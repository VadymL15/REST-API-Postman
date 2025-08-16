// middleware.js
module.exports = (req, res, next) => {
  // Працюємо лише з /posts (за потреби додай інші ресурси)
  const isPosts = req.path.startsWith('/posts');

  // Хелпер: перевірка на ціле число
  const isInt = (v) => Number.isInteger(Number(v));

  if (isPosts) {
    // POST: або без id (автоінкремент), або числовий id
    if (req.method === 'POST') {
      if (req.body && req.body.hasOwnProperty('id')) {
        if (!isInt(req.body.id)) {
          return res.status(400).json({ error: 'id must be an integer or omitted' });
        }
        // опційно: привести до числа
        req.body.id = Number(req.body.id);
      }
    }

    // PUT/PATCH: id у шляху має бути числовим
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const pathId = req.params.id; // /posts/:id
      if (!isInt(pathId)) {
        return res.status(400).json({ error: 'path id must be an integer' });
      }

      // Якщо у body є id — він має бути числовим і збігатися з path id
      if (req.body && req.body.hasOwnProperty('id')) {
        if (!isInt(req.body.id)) {
          return res.status(400).json({ error: 'body id must be an integer' });
        }
        if (Number(req.body.id) !== Number(pathId)) {
          return res.status(400).json({ error: 'body id must equal path id' });
        }
        // нормалізуємо тип
        req.body.id = Number(req.body.id);
      }
    }
  }

  next();
};
