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
    const isAdmin = userRoles.some(role => role === 'ADMIN');
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

        // Kiểm tra quyền: ADMIN có thể xem mọi queue, DOCTOR chỉ xem queue của chính mình
        if (!isAdmin && isDoctor) {
          // DOCTOR chỉ được xem queue của chính mình
          const [doctors] = await pool.execute(
            'SELECT id FROM doctors WHERE user_id = ? AND id = ?',
            [socket.userId, doctorId]
          );

          if (doctors.length === 0) {
            socket.emit('queue:error', { message: 'Không có quyền truy cập queue này' });
            return;
          }
        } else if (isPatient && !isAdmin && !isDoctor) {
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
          
          // Normalize date để so sánh (chỉ lấy phần YYYY-MM-DD)
          const normalizeDate = (dateValue) => {
            try {
              if (!dateValue) return '';
              
              // Nếu là Date object, convert sang string
              if (dateValue instanceof Date) {
                return dateValue.toISOString().split('T')[0];
              }
              
              // Convert sang string nếu chưa phải
              const dateStr = String(dateValue);
              
              // Nếu là ISO datetime string, extract chỉ phần date
              if (dateStr.includes('T')) {
                return dateStr.split('T')[0];
              }
              // Nếu có space, lấy phần đầu
              if (dateStr.includes(' ')) {
                return dateStr.split(' ')[0];
              }
              return dateStr;
            } catch (err) {
              console.error('Error normalizing date:', err, dateValue);
              return String(dateValue || '');
            }
          };
          
          const appointmentDate = normalizeDate(appointment.appointment_date);
          const requestedDate = normalizeDate(date);
          
          // Kiểm tra appointment có khớp với doctorId và date không
          if (appointment.doctor_id !== parseInt(doctorId) || appointmentDate !== requestedDate) {
            socket.emit('queue:error', { message: 'Thông tin lịch khám không khớp' });
            return;
          }

          // Lưu appointmentId vào socket để dùng sau
          socket.currentAppointmentId = appointmentId;
        } else if (!isAdmin && !isDoctor && !isPatient) {
          socket.emit('queue:error', { message: 'Không có quyền truy cập queue dashboard' });
          return;
        }

        // Normalize date để đảm bảo format nhất quán (YYYY-MM-DD)
        const normalizeDate = (dateValue) => {
          try {
            if (!dateValue) return '';
            
            // Nếu là Date object, convert sang string
            if (dateValue instanceof Date) {
              return dateValue.toISOString().split('T')[0];
            }
            
            // Convert sang string nếu chưa phải
            const dateStr = String(dateValue);
            
            // Nếu là ISO datetime string, extract chỉ phần date
            if (dateStr.includes('T')) {
              return dateStr.split('T')[0];
            }
            // Nếu có space, lấy phần đầu
            if (dateStr.includes(' ')) {
              return dateStr.split(' ')[0];
            }
            return dateStr;
          } catch (err) {
            console.error('Error normalizing date:', err, dateValue);
            return String(dateValue || '');
          }
        };
        
        const normalizedDate = normalizeDate(date);
        const roomKey = `queue:${doctorId}:${normalizedDate}`;
        socket.join(roomKey);
        
        console.log(`[Queue Socket] User ${socket.id} joined room: ${roomKey} (original date: ${date}, normalized: ${normalizedDate})`);

        // Gửi queue state hiện tại cho client vừa join (dùng normalized date)
        const queueState = await getQueueStateInternal(pool, doctorId, normalizedDate);
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

