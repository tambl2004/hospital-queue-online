import api from './api';

export const doctorService = {
  // Lấy thống kê tổng quan dashboard cho Doctor
  async getDashboardData() {
    try {
      const response = await api.get('/doctor/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor dashboard data:', error);
      throw error;
    }
  },

  // Hoàn thành khám (nếu cho phép)
  async finishAppointment(appointmentId, doctorId, date) {
    try {
      const response = await api.post('/queue/finish', {
        appointment_id: appointmentId,
        doctor_id: doctorId,
        date: date
      });
      return response.data;
    } catch (error) {
      console.error('Error finishing appointment:', error);
      throw error;
    }
  },

  // Lấy danh sách lịch khám theo ngày
  async getSchedules(params = {}) {
    try {
      const response = await api.get('/doctor/schedules', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor schedules:', error);
      throw error;
    }
  },

  // Lấy danh sách appointments hôm nay của Doctor
  async getTodayAppointments(params = {}) {
    try {
      const response = await api.get('/doctor/appointments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching today appointments:', error);
      throw error;
    }
  },

  // Lấy thông tin profile của Doctor
  async getProfile() {
    try {
      const response = await api.get('/doctor/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      throw error;
    }
  },

  // Lấy danh sách đánh giá của Doctor
  async getRatings(params = {}) {
    try {
      const response = await api.get('/doctor/ratings', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor ratings:', error);
      throw error;
    }
  },
};

