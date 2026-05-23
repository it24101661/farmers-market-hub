/**
 * Helper to notify connected clients (Socket.IO) — used after order/status changes.
 * io is attached in server.js via app.set('io', io).
 */

function notifyOrder(io, payload) {
  if (!io) return;
  // Broadcast to rooms; clients join role/user rooms separately in production
  io.emit('order:update', payload);
}

module.exports = { notifyOrder };
