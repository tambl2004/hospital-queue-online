const { verifyToken } = require('../utils/jwt');
const { getPool } = require('../config/database');
const { getQueueStateInternal } = require('../controllers/queue.controller');

/**
 * Socket.IO handlers cho Queue Management
 */

/**
 * Xác thực socket connection với JWT token
 */
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = verifyToken(token);
    socket.userId = decoded.sub;
    socket.userRoles = decoded.roles || [];
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

/**
 * Xử lý queue socket events
 */
const setupQueueHandlers = (io) => {
  // Middleware xác thực cho namespace queue
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`[Queue Socket] User connected: ${socket.id}, userId: ${socket.userId}`);

    // Kiểm tra quyền truy cập (ADMIN hoặc STAFF mới được join queue room)
    const userRoles = socket.userRoles || [];
    const isAdminOrStaff = userRoles.some(role => ['ADMIN', 'STAFF'].includes(role));

    if (!isAdminOrStaff) {
      socket.emit('queue:error', { message: 'Không có quyền truy cập queue dashboard' });
      socket.disconnect();
      return;
    }

    // Join queue room
    socket.on('queue:join', async (data) => {
      try {
        const { doctorId, date } = data;

        if (!doctorId || !date) {
          socket.emit('queue:error', { message: 'doctorId và date là bắt buộc' });
          return;
        }

        const roomKey = `queue:${doctorId}:${date}`;
        socket.join(roomKey);
        
        console.log(`[Queue Socket] User ${socket.id} joined room: ${roomKey}`);

        // Gửi queue state hiện tại cho client vừa join
        const pool = getPool();
        const queueState = await getQueueStateInternal(pool, doctorId, date);
        socket.emit('queue:state', queueState);

      } catch (error) {
        console.error('[Queue Socket] Error joining room:', error);
        socket.emit('queue:error', { message: error.message || 'Lỗi khi join queue room' });
      }
    });

    // Leave queue room (optional)
    socket.on('queue:leave', (data) => {
      try {
        const { doctorId, date } = data;

        if (doctorId && date) {
          const roomKey = `queue:${doctorId}:${date}`;
          socket.leave(roomKey);
          console.log(`[Queue Socket] User ${socket.id} left room: ${roomKey}`);
        }
      } catch (error) {
        console.error('[Queue Socket] Error leaving room:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Queue Socket] User disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupQueueHandlers };

