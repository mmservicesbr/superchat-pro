import { Server as SocketIOServer, Socket } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setupSocketIO(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    // Join company room for real-time notifications
    socket.on('joinCompany', (companyId: string) => {
      socket.join(`company_${companyId}`);
    });

    // Join specific ticket chat room
    socket.on('joinTicket', (ticketId: string) => {
      socket.join(`ticket_${ticketId}`);
    });

    socket.on('leaveTicket', (ticketId: string) => {
      socket.leave(`ticket_${ticketId}`);
    });

    // Typing indicators
    socket.on('typing', (data: { ticketId: string; userName: string; isTyping: boolean }) => {
      socket.to(`ticket_${data.ticketId}`).emit('userTyping', data);
    });

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });
}

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized');
  }
  return ioInstance;
}
