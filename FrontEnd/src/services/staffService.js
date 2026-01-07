import api from './api';

export const staffService = {
  // Lấy thống kê tổng quan dashboard cho Staff
  async getDashboardData() {
    try {
      const response = await api.get('/staff/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching staff dashboard data:', error);
      throw error;
    }
  },

  // Lấy danh sách lượt đăng ký hôm nay
  async getTodayAppointments(params = {}) {
    try {
      const response = await api.get('/staff/appointments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching today appointments:', error);
      throw error;
    }
  },
};

