import express from 'express';
import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase } from './database/db.js';
import { setupSocketIO } from './sockets/socketManager.js';

// Routers
import { authRouter } from './routes/auth.js';
import { ticketsRouter } from './routes/tickets.js';
import { messagesRouter } from './routes/messages.js';
import { queuesRouter } from './routes/queues.js';
import { whatsappRouter } from './routes/whatsapp.js';
import { quickRepliesRouter } from './routes/quickReplies.js';
import { usersRouter } from './routes/users.js';
import { companiesRouter } from './routes/companies.js';
import { dashboardRouter } from './routes/dashboard.js';

// Initialize DB schema & seed data
initDatabase();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

setupSocketIO(io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/queues', queuesRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/quick-replies', quickRepliesRouter);
app.use('/api/users', usersRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/dashboard', dashboardRouter);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'SingleChat Pro',
    timestamp: new Date().toISOString()
  });
});

server.listen(config.port, () => {
  console.log(`[SingleChat Backend] Servidor rodando na porta ${config.port}`);
  console.log(`[SingleChat Backend] Healthcheck: http://localhost:${config.port}/api/health`);
});
