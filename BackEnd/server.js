// backend/server.js
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const { setupQueueHandlers } = require('./socketHandlers/queue.handler');

require('dotenv').config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Setup Socket.IO handlers
setupQueueHandlers(io);

// Basic connection logging (for other socket events if needed)
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

