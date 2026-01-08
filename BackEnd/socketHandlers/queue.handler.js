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

    const userRoles = socket.userRoles || [];
    const isAdminOrStaff = userRoles.some(role => ['ADMIN', 'STAFF'].includes(role));
    const isDoctor = userRoles.some(role => role === 'DOCTOR');
    const isPatient = userRoles.some(role => role === 'PATIENT');

    // Join queue room
    socket.on('queue:join', async (data) => {
      try {
        const { doctorId, date, appointmentId } = data;

        if (!doctorId || !date) {
          socket.emit('queue:error', { message: 'doctorId và date là bắt buộc' });
          return;
        }

        const pool = getPool();

        // Kiểm tra quyền: ADMIN/STAFF có thể xem mọi queue, DOCTOR chỉ xem queue của chính mình
        if (!isAdminOrStaff && isDoctor) {
          // DOCTOR chỉ được xem queue của chính mình
          const [doctors] = await pool.execute(
            'SELECT id FROM doctors WHERE user_id = ? AND id = ?',
            [socket.userId, doctorId]
          );

          if (doctors.length === 0) {
            socket.emit('queue:error', { message: 'Không có quyền truy cập queue này' });
            return;
          }
        } else if (isPatient && !isAdminOrStaff && !isDoctor) {
          // PATIENT chỉ được xem queue của appointment của chính mình
          if (!appointmentId) {
            socket.emit('queue:error', { message: 'appointmentId là bắt buộc cho patient' });
            return;
          }

          // Kiểm tra appointment thuộc về patient này
          const [appointments] = await pool.execute(
            'SELECT id, patient_id, doctor_id, appointment_date FROM appointments WHERE id = ? AND patient_id = ?',
            [appointmentId, socket.userId]
          );

          if (appointments.length === 0) {
            socket.emit('queue:error', { message: 'Không tìm thấy lịch khám hoặc không có quyền truy cập' });
            return;
          }

          const appointment = appointments[0];
          
          // Kiểm tra appointment có khớp với doctorId và date không
          if (appointment.doctor_id !== parseInt(doctorId) || appointment.appointment_date !== date) {
            socket.emit('queue:error', { message: 'Thông tin lịch khám không khớp' });
            return;
          }

          // Lưu appointmentId vào socket để dùng sau
          socket.currentAppointmentId = appointmentId;
        } else if (!isAdminOrStaff && !isDoctor && !isPatient) {
          socket.emit('queue:error', { message: 'Không có quyền truy cập queue dashboard' });
          return;
        }

        const roomKey = `queue:${doctorId}:${date}`;
        socket.join(roomKey);
        
        console.log(`[Queue Socket] User ${socket.id} joined room: ${roomKey}`);

        // Gửi queue state hiện tại cho client vừa join
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

