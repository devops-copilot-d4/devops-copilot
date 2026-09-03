const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || '*' },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Call this from controllers/services to push live updates to the dashboard
// e.g. emitEvent('deployment:update', { serviceId, status })
const emitEvent = (eventName, payload) => {
  if (!io) return;
  io.emit(eventName, payload);
};

module.exports = { initSocket, emitEvent };

