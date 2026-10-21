import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';
import { config } from '../config.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    return;
  }

  const user = db.prepare(`
    SELECT u.*, c.name as company_name, c.plan as company_plan
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE u.email = ?
  `).get(email) as any;

  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  // Update status to online
  db.prepare(`UPDATE users SET status = 'online' WHERE id = ?`).run(user.id);

  const token = jwt.sign(
    {
      id: user.id,
      companyId: user.company_id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      companyId: user.company_id,
      companyName: user.company_name,
      companyPlan: user.company_plan,
      name: user.name,
      email: user.email,
      role: user.role,
      status: 'online',
      avatarUrl: user.avatar_url
    }
  });
});

authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  const user = db.prepare(`
    SELECT u.*, c.name as company_name, c.plan as company_plan
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE u.id = ?
  `).get(req.user!.id) as any;

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      companyId: user.company_id,
      companyName: user.company_name,
      companyPlan: user.company_plan,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatar_url
    }
  });
});

authRouter.post('/logout', authMiddleware, (req: AuthenticatedRequest, res) => {
  db.prepare(`UPDATE users SET status = 'offline' WHERE id = ?`).run(req.user!.id);
  res.json({ success: true });
});
