// server.js
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

const db = router.db; // lowdb instance

const isInt = (v) => Number.isInteger(Number(v));

// Допоміжна: отримати числовий nextId для колекції
function getNextNumericId(collectionName) {
  const list = db.get(collectionName).value() || [];
  // беремо лише числові id
  const numericIds = list
    .map((x) => x && x.id)
    .filter((v) => v !== undefined && v !== null && isFinite(Number(v)))
    .map((v) => Number(v));

  const maxId = numericIds.length ? Math.max(...numericIds) : 0;
  return maxId + 1;
}

// Акуратно витягуємо :id зі шляху /posts/:id
function getPathId(req) {
  const m = req.path.match(/^\/posts\/([^\/\?]+)(?:$|[\/\?])/);
  return m ? m[1] : undefined;
}

// Контроль лише для /posts
server.use((req, res, next) => {
  if (!req.path.startsWith('/posts')) return next();

  // POST: гарантовано ставимо ЧИСЛОВИЙ id
  if (req.method === 'POST') {
    const hasBody = req.body && typeof req.body === 'object';
    if (!hasBody) return res.status(400).json({ error: 'Invalid JSON body' });

    // якщо id передали — він має бути числом
    if (Object.prototype.hasOwnProperty.call(req.body, 'id')) {
      if (!isInt(req.body.id)) {
        return res.status(400).json({ error: 'id must be an integer or omitted' });
      }
      req.body.id = Number(req.body.id);
    } else {
      // не передавали id → згенеруємо наступний числовий
      req.body.id = getNextNumericId('posts');
    }
  }

  // PUT/PATCH: path id має бути числовим; body.id (якщо є) = path id (і число)
  if (req.method === 'PUT' || req.method === 'PATCH') {
    const pathId = getPathId(req);
    if (!isInt(pathId)) {
      return res.status(400).json({ error: 'path id must be an integer' });
    }
    const hasBody = req.body && typeof req.body === 'object';
    if (!hasBody) return res.status(400).json({ error: 'Invalid JSON body' });

    if (Object.prototype.hasOwnProperty.call(req.body, 'id')) {
      if (!isInt(req.body.id)) {
        return res.status(400).json({ error: 'body id must be an integer' });
      }
      if (Number(req.body.id) !== Number(pathId)) {
        return res.status(400).json({ error: 'body id must equal path id' });
      }
      req.body.id = Number(req.body.id);
    } else if (req.method === 'PUT') {
      // Для PUT зазвичай вимагаємо повний об'єкт, тож проставимо id = pathId, якщо його немає
      req.body.id = Number(pathId);
    }
  }

  next();
});
// Пам'ять виданих токенів (на час роботи процесу)
const issuedTokens = new Set();

// /login видає фейковий токен і кладе його в пам'ять
server.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  const token = `abc123.${Date.now()}`;
  issuedTokens.add(token);
  return res.status(200).json({ token });
});

// Middleware: вимагати Bearer токен для write-операцій на /posts
server.use((req, res, next) => {
  const needsAuth =
    req.path.startsWith('/posts') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (!needsAuth) return next();

  const auth = req.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'Missing Bearer token' });

  const token = m[1];
  if (!issuedTokens.has(token)) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
});

server.use(router);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`JSON Server is running on http://127.0.0.1:${PORT}`);
});
