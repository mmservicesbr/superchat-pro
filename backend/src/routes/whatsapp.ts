import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { getIO } from '../sockets/socketManager.js';

export const whatsappRouter = Router();
whatsappRouter.use(authMiddleware);

whatsappRouter.get('/', (req: AuthenticatedRequest, res) => {
  const companyId = req.user!.companyId;
  const connections = db.prepare(`SELECT * FROM whatsapp_connections WHERE company_id = ? ORDER BY is_default DESC, created_at ASC`).all(companyId);
  res.json(connections);
});

whatsappRouter.post('/', (req: AuthenticatedRequest, res) => {
  const companyId = req.user!.companyId;
  const { name, phoneNumber } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Nome da conexão é obrigatório' });
    return;
  }

  const id = `conn_${uuidv4().substring(0, 8)}`;
  db.prepare(`
    INSERT INTO whatsapp_connections (id, company_id, name, phone_number, status, is_default)
    VALUES (?, ?, ?, ?, 'DISCONNECTED', 0)
  `).run(id, companyId, name, phoneNumber || null);

  res.status(201).json({ id, name, status: 'DISCONNECTED' });
});

// Request QR Code (Inicia tentativa de conexão)
whatsappRouter.post('/:id/qrcode', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  // Generate a mock QR code string/payload for instant demo or Baileys engine
  const mockQr = `2@singlechat-whatsapp-session-${Date.now()}-${uuidv4()}`;

  db.prepare(`
    UPDATE whatsapp_connections
    SET status = 'QRCODE', qr_code_data = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).run(mockQr, id, companyId);

  try {
    const io = getIO();
    io.to(`company_${companyId}`).emit('whatsappStatus', { id, status: 'QRCODE', qrCodeData: mockQr });
  } catch (err) {}

  res.json({ id, status: 'QRCODE', qrCodeData: mockQr });
});

// Simulate successful connection (Scan QR Code)
whatsappRouter.post('/:id/connect', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;
  const phoneNumber = req.body.phoneNumber || '+55 (11) 9' + Math.floor(10000000 + Math.random() * 90000000);

  db.prepare(`
    UPDATE whatsapp_connections
    SET status = 'CONNECTED', phone_number = ?, qr_code_data = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).run(phoneNumber, id, companyId);

  try {
    const io = getIO();
    io.to(`company_${companyId}`).emit('whatsappStatus', { id, status: 'CONNECTED', phoneNumber });
  } catch (err) {}

  res.json({ success: true, status: 'CONNECTED', phoneNumber });
});

// Disconnect
whatsappRouter.post('/:id/disconnect', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  db.prepare(`
    UPDATE whatsapp_connections
    SET status = 'DISCONNECTED', qr_code_data = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).run(id, companyId);

  try {
    const io = getIO();
    io.to(`company_${companyId}`).emit('whatsappStatus', { id, status: 'DISCONNECTED' });
  } catch (err) {}

  res.json({ success: true, status: 'DISCONNECTED' });
});

// Delete connection
whatsappRouter.delete('/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  db.prepare(`DELETE FROM whatsapp_connections WHERE id = ? AND company_id = ?`).run(id, companyId);
  res.json({ success: true });
});
