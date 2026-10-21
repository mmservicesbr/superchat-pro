import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

export const usersRouter = Router();
usersRouter.use(authMiddleware);

usersRouter.get('/', (req: AuthenticatedRequest, res) => {
  const companyId = req.user!.companyId;
  const users = db.prepare(`
    SELECT id, name, email, role, status, avatar_url, created_at
    FROM users
    WHERE company_id = ?
    ORDER BY name ASC
  `).all(companyId);
  res.json(users);
});

usersRouter.post('/', (req: AuthenticatedRequest, res) => {
  const companyId = req.user!.companyId;
  const { name, email, password, role = 'agent' } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
    return;
  }

  // Check if email already exists
  const exists = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (exists) {
    res.status(400).json({ error: 'Este e-mail já está em uso' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const id = `user_${uuidv4().substring(0, 8)}`;

  db.prepare(`
    INSERT INTO users (id, company_id, name, email, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?, 'offline')
  `).run(id, companyId, name, email, passwordHash, role);

  res.status(201).json({ id, name, email, role, status: 'offline' });
});

usersRouter.put('/:id/status', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.prepare(`UPDATE users SET status = ? WHERE id = ?`).run(status, id);
  res.json({ success: true, status });
});

usersRouter.delete('/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  // Cannot delete yourself
  if (id === req.user!.id) {
    res.status(400).json({ error: 'Você não pode excluir sua própria conta' });
    return;
  }

  db.prepare(`DELETE FROM users WHERE id = ? AND company_id = ?`).run(id, companyId);
  res.json({ success: true });
});
