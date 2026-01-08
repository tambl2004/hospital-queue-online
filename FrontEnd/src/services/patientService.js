import api from './api';

/**
 * PATIENT SERVICE
 * Service xử lý các API liên quan đến bệnh nhân (Patient)
 */

export const patientService = {
  // ========== PUBLIC ROUTES (Không cần đăng nhập) ==========
  
  /**
   * Lấy danh sách chuyên khoa (public)
   */
  async getDepartments(params = {}) {
    try {
      const response = await api.get('/admin/departments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin một chuyên khoa (public)
   */
  async getDepartmentById(id) {
    try {
      const response = await api.get(`/admin/departments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching department:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách bác sĩ (public - có thể filter theo department)
   */
  async getDoctors(params = {}) {
    try {
      const response = await api.get('/admin/doctors', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết một bác sĩ (public)
   */
  async getDoctorById(id) {
    try {
      const response = await api.get(`/admin/doctors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor:', error);
      throw error;
    }
  },

  /**
   * Lấy lịch khám của bác sĩ (public - để xem slot còn trống)
   */
  async getDoctorSchedules(doctorId, date) {
    try {
      const response = await api.get('/admin/schedules', {
        params: {
          doctor_id: doctorId,
          work_date: date,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor schedules:', error);
      throw error;
    }
  },

  // ========== PATIENT ZONE (Cần đăng nhập) ==========

  /**
   * Đặt lịch khám mới
   */
  async bookAppointment(data) {
    try {
      const response = await api.post('/appointments', data);
      return response.data;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách lịch đã đặt của bệnh nhân
   */
  async getMyAppointments(params = {}) {
    try {
      const response = await api.get('/appointments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching my appointments:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết một lịch đã đặt
   */
  async getAppointmentById(id) {
    try {
      const response = await api.get(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  },

  /**
   * Hủy lịch đã đặt
   */
  async cancelAppointment(id, reason = null) {
    try {
      const response = await api.patch(`/appointments/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin số thứ tự hiện tại (realtime)
   */
  async getQueueStatus(appointmentId) {
    try {
      const response = await api.get(`/appointments/${appointmentId}/queue-status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching queue status:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin hồ sơ cá nhân từ server
   */
  async getProfile() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin cá nhân
   */
  async updateProfile(data) {
    try {
      const response = await api.put('/auth/profile', data);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Lấy đánh giá của appointment (nếu có)
   */
  async getRating(appointmentId) {
    try {
      const response = await api.get(`/appointments/${appointmentId}/rating`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rating:', error);
      throw error;
    }
  },

  /**
   * Đánh giá bác sĩ sau khi khám xong
   */
  async reviewDoctor(appointmentId, rating, comment) {
    try {
      const response = await api.post(`/appointments/${appointmentId}/review`, {
        rating,
        comment,
      });
      return response.data;
    } catch (error) {
      console.error('Error reviewing doctor:', error);
      throw error;
    }
  },
};

export default patientService;

