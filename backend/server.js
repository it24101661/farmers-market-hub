/**
 * Farmers Market Hub — Express entry + Socket.IO for live order/delivery updates.
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '.env');
const exampleEnvPath = path.resolve(__dirname, '.env.example');

const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  if (fs.existsSync(exampleEnvPath)) {
    console.info('.env not found; loading .env.example for local development.');
    dotenv.config({ path: exampleEnvPath });
  }
}
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set. Set it in .env for production.');
}

const app = express();
const server = http.createServer(app);

// Socket.IO — same port as HTTP; mobile connects with socket.io-client
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const allowed = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowed?.length ? allowed : '*',
  })
);
app.use(express.json({ limit: '2mb' }));

// Health check (useful for hosting / load balancers)
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'farmers-market-hub-api' });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`API + WebSocket running on port ${PORT}`);
  });
});
