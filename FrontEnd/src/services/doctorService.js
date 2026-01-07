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
};

