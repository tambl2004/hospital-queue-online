import api from './api';
import { io } from 'socket.io-client';

/**
 * QUEUE SERVICE
 * Service xử lý các API và Socket.IO liên quan đến quản lý hàng đợi & gọi số
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

/**
 * Kết nối Socket.IO cho queue
 * @param {Function} onStateUpdate - Callback khi nhận queue:updated
 * @param {Function} onError - Callback khi có lỗi
 * @returns {Function} Disconnect function
 */
export const connectQueueSocket = (onStateUpdate, onError) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    onError?.({ message: 'Không có token xác thực' });
    return () => {};
  }

  // Nếu đã có socket, disconnect trước
  if (socket?.connected) {
    socket.disconnect();
  }

  // Tạo socket mới
  socket = io(SOCKET_URL, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('[Queue Socket] Connected:', socket.id);
  });

  socket.on('queue:state', (data) => {
    console.log('[Queue Socket] Received state:', data);
    onStateUpdate?.(data);
  });

  socket.on('queue:updated', (data) => {
    console.log('[Queue Socket] Queue updated:', data);
    onStateUpdate?.(data);
  });

  socket.on('queue:error', (error) => {
    console.error('[Queue Socket] Error:', error);
    onError?.(error);
  });

  socket.on('disconnect', () => {
    console.log('[Queue Socket] Disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('[Queue Socket] Connection error:', error);
    onError?.(error);
  });

  // Return disconnect function
  return () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };
};

/**
 * Join queue room
 * @param {number} doctorId - ID bác sĩ
 * @param {string} date - Ngày (YYYY-MM-DD)
 */
export const joinQueueRoom = (doctorId, date) => {
  if (!socket || !socket.connected) {
    console.warn('[Queue Socket] Socket not connected');
    return;
  }
  
  socket.emit('queue:join', { doctorId, date });
};

/**
 * Leave queue room
 * @param {number} doctorId - ID bác sĩ
 * @param {string} date - Ngày (YYYY-MM-DD)
 */
export const leaveQueueRoom = (doctorId, date) => {
  if (!socket || !socket.connected) {
    return;
  }
  
  socket.emit('queue:leave', { doctorId, date });
};

/**
 * Disconnect socket
 */
export const disconnectQueueSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Queue API service
 */
export const queueService = {
  /**
   * Lấy trạng thái queue theo doctor + date
   * @param {number} doctorId - ID bác sĩ
   * @param {string} date - Ngày (YYYY-MM-DD)
   * @returns {Promise<Object>} Queue state
   */
  async getQueueState(doctorId, date) {
    try {
      const response = await api.get('/queue/state', {
        params: { doctor_id: doctorId, date }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching queue state:', error);
      throw error;
    }
  },

  /**
   * Gọi số tiếp theo
   * @param {number} doctorId - ID bác sĩ
   * @param {string} date - Ngày (YYYY-MM-DD)
   * @returns {Promise<Object>} Updated queue state
   */
  async callNext(doctorId, date) {
    try {
      const response = await api.post('/queue/call-next', {
        doctor_id: doctorId,
        date
      });
      return response.data;
    } catch (error) {
      console.error('Error calling next:', error);
      throw error;
    }
  },

  /**
   * Bắt đầu khám
   * @param {number} appointmentId - ID appointment
   * @param {number} doctorId - ID bác sĩ
   * @param {string} date - Ngày (YYYY-MM-DD)
   * @returns {Promise<Object>} Updated queue state
   */
  async startAppointment(appointmentId, doctorId, date) {
    try {
      const response = await api.post('/queue/start', {
        appointment_id: appointmentId,
        doctor_id: doctorId,
        date
      });
      return response.data;
    } catch (error) {
      console.error('Error starting appointment:', error);
      throw error;
    }
  },

  /**
   * Kết thúc khám
   * @param {number} appointmentId - ID appointment
   * @param {number} doctorId - ID bác sĩ
   * @param {string} date - Ngày (YYYY-MM-DD)
   * @returns {Promise<Object>} Updated queue state
   */
  async finishAppointment(appointmentId, doctorId, date) {
    try {
      const response = await api.post('/queue/finish', {
        appointment_id: appointmentId,
        doctor_id: doctorId,
        date
      });
      return response.data;
    } catch (error) {
      console.error('Error finishing appointment:', error);
      throw error;
    }
  },

  /**
   * Bỏ qua số
   * @param {number} appointmentId - ID appointment
   * @param {number} doctorId - ID bác sĩ
   * @param {string} date - Ngày (YYYY-MM-DD)
   * @param {string} reason - Lý do bỏ qua (optional)
   * @returns {Promise<Object>} Updated queue state
   */
  async skipAppointment(appointmentId, doctorId, date, reason = '') {
    try {
      const response = await api.post('/queue/skip', {
        appointment_id: appointmentId,
        doctor_id: doctorId,
        date,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error skipping appointment:', error);
      throw error;
    }
  },

  /**
   * Gọi lại số
   * @param {number} appointmentId - ID appointment
   * @param {number} doctorId - ID bác sĩ
   * @param {string} date - Ngày (YYYY-MM-DD)
   * @returns {Promise<Object>} Updated queue state
   */
  async recallAppointment(appointmentId, doctorId, date) {
    try {
      const response = await api.post('/queue/recall', {
        appointment_id: appointmentId,
        doctor_id: doctorId,
        date
      });
      return response.data;
    } catch (error) {
      console.error('Error recalling appointment:', error);
      throw error;
    }
  }
};

