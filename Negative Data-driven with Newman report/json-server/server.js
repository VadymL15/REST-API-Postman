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
    if (!req.path.startsWith('/posts'))
        return next();

    // POST: гарантовано ставимо ЧИСЛОВИЙ id
    if (req.method === 'POST') {
        const hasBody = req.body && typeof req.body === 'object';
        if (!hasBody)
            return res.status(400).json({
                error: 'Invalid JSON body'
            });

        // якщо id передали — він має бути числом
        if (Object.prototype.hasOwnProperty.call(req.body, 'id')) {
            if (!isInt(req.body.id)) {
                return res.status(400).json({
                    error: 'id must be an integer or omitted'
                });
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
            return res.status(400).json({
                error: 'path id must be an integer'
            });
        }
        const hasBody = req.body && typeof req.body === 'object';
        if (!hasBody)
            return res.status(400).json({
                error: 'Invalid JSON body'
            });

        if (Object.prototype.hasOwnProperty.call(req.body, 'id')) {
            if (!isInt(req.body.id)) {
                return res.status(400).json({
                    error: 'body id must be an integer'
                });
            }
            if (Number(req.body.id) !== Number(pathId)) {
                return res.status(400).json({
                    error: 'body id must equal path id'
                });
            }
            req.body.id = Number(req.body.id);
        } else if (req.method === 'PUT') {
            // Для PUT зазвичай вимагаємо повний об'єкт, тож проставимо id = pathId, якщо його немає
            req.body.id = Number(pathId);
        }
    }

    next();
});
// ===== JWT налаштування =====
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'dev-secret-change-me'; // збережи в env у реальних проектах
const JWT_EXPIRES_IN = '30m'; // 30 хвилин

// /login видає JWT
server.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({
            error: 'username and password are required'
        });
    }

    // У реальності перевіряють користувача в БД; ми просто підписуємо payload
    const payload = {
        sub: username
    }; // sub = subject (ідентифікатор юзера)
    const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
    return res.status(200).json({
        token,
        expiresIn: JWT_EXPIRES_IN
    });
});

// Middleware: перевіряти JWT для write-операцій на /posts
server.use((req, res, next) => {
    const needsAuth =
        req.path.startsWith('/posts') &&
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

    if (!needsAuth)
        return next();

    const auth = req.get('authorization') || '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m)
        return res.status(401).json({
            error: 'Missing Bearer token'
        });

    const token = m[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Можна зберегти info про користувача в req.user для аудиту
        req.user = decoded;
        return next();
    } catch (err) {
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }
});
// 422: валідація title/userId на POST/PUT/PATCH /posts
server.use((req, res, next) => {
    const needsValidation =
        req.path.startsWith('/posts') &&
        ['POST', 'PUT', 'PATCH'].includes(req.method);

    if (!needsValidation)
        return next();

    const { title, userId } = req.body || {};
    if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(422).json({
            error: 'title must be non-empty string'
        });
    }
    if (!Number.isInteger(userId)) {
        return res.status(422).json({
            error: 'userId must be integer'
        });
    }

    // 400: надлишкове поле (простий приклад)
    const allowed = ['id', 'title', 'body', 'userId'];
    const extra = Object.keys(req.body || {}).filter(k => !allowed.includes(k));
    if (extra.length) {
        return res.status(400).json({
            error: `unexpected fields: ${extra.join(', ')}`
        });
    }

    next();
});

// 409: конфлікт за title (якщо вже існує такий title)
server.use((req, res, next) => {
    const isWrite = req.path.startsWith('/posts') && ['POST', 'PUT'].includes(req.method);
    if (!isWrite)
        return next();
    try {
        const db = router.db; // lowdb
        const exists = db.get('posts').find({
            title: req.body?.title
        }).value();
        if (exists && exists.id !== req.body.id) {
            return res.status(409).json({
                error: 'title already exists'
            });
        }
    } catch (_) {}
    next();
});

// 500: примусовий збій, якщо передали special query `?force=500`
server.use((req, res, next) => {
    if (req.query.force === '500') {
        return res.status(500).json({
            error: 'forced server error'
        });
    }
    next();
});

server.use(router);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`JSON Server is running on http://127.0.0.1:${PORT}`);
});