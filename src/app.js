import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
   import path from 'node:path';
   import { existsSync } from 'node:fs';
   import { fileURLToPath } from 'node:url';

export const STATUSES = ['applied', 'interview', 'offer', 'rejected'];

export function createApp(db, secret) {
  if (!secret) throw new Error('JWT secret is required');
  const app = express();
  app.use(express.json());
      

  const auth = (req, res, next) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    try {
      req.userId = jwt.verify(token, secret).sub;
      next();
    } catch {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };

  // --- Auth ---
  app.post('/auth/register', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password || password.length < 8)
      return res.status(400).json({ error: 'Email and a password of 8+ characters are required' });
    try {
      const hash = bcrypt.hashSync(password, 10);
      const r = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, hash);
      res.status(201).json({ id: Number(r.lastInsertRowid), email });
    } catch {
      res.status(409).json({ error: 'Email already registered' });
    }
  });

  app.post('/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email ?? '');
    if (!user || !bcrypt.compareSync(password ?? '', user.password_hash))
      return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: jwt.sign({ sub: user.id }, secret, { expiresIn: '2h' }) });
  });

  // --- Applications (every query is scoped to the logged-in user) ---
  app.get('/applications', auth, (req, res) => {
    const { status } = req.query;
    const rows = status
      ? db.prepare('SELECT * FROM applications WHERE user_id = ? AND status = ? ORDER BY id DESC').all(req.userId, status)
      : db.prepare('SELECT * FROM applications WHERE user_id = ? ORDER BY id DESC').all(req.userId);
    res.json(rows);
  });

  app.post('/applications', auth, (req, res) => {
    const { company, role, status = 'applied', notes = '' } = req.body || {};
    if (!company || !role) return res.status(400).json({ error: 'company and role are required' });
    if (!STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
    const r = db.prepare('INSERT INTO applications (user_id, company, role, status, notes) VALUES (?, ?, ?, ?, ?)')
      .run(req.userId, company, role, status, notes);
    res.status(201).json(db.prepare('SELECT * FROM applications WHERE id = ?').get(r.lastInsertRowid));
  });

  app.patch('/applications/:id', auth, (req, res) => {
    const row = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const next = { ...row, ...req.body };
    if (!STATUSES.includes(next.status)) return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
    db.prepare('UPDATE applications SET company = ?, role = ?, status = ?, notes = ? WHERE id = ?')
      .run(next.company, next.role, next.status, next.notes, row.id);
    res.json(db.prepare('SELECT * FROM applications WHERE id = ?').get(row.id));
  });

  app.delete('/applications/:id', auth, (req, res) => {
    const r = db.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    r.changes ? res.status(204).end() : res.status(404).json({ error: 'Not found' });
  });

  app.get('/stats', auth, (req, res) => {
    const rows = db.prepare('SELECT status, COUNT(*) AS n FROM applications WHERE user_id = ? GROUP BY status').all(req.userId);
    res.json(Object.fromEntries(STATUSES.map(s => [s, rows.find(r => r.status === s)?.n ?? 0])));
  });
     // Serve the built React frontend when it exists (used in production).
     const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');
     if (existsSync(dist)) app.use(express.static(dist));
  return app;
}
