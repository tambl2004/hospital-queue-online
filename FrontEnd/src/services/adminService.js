import api from './api';

export const adminService = {
  // Lấy thống kê tổng quan
  async getDashboardStats() {
    try {
      const response = await api.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Trả về dữ liệu mẫu nếu API chưa sẵn sàng
      return {
        totalPatients: 1250,
        totalDoctors: 45,
        totalStaff: 120,
        totalAppointments: 3840,
        todayAppointments: 42,
        pendingAppointments: 15,
        completedAppointments: 3250,
        cancelledAppointments: 35,
        appointmentsByStatus: {
          WAITING: 15,
          CALLED: 8,
          IN_PROGRESS: 12,
          DONE: 3250,
          CANCELLED: 35,
        },
        recentAppointments: [],
        appointmentsByMonth: [],
      };
    }
  },

  // Lấy danh sách người dùng
  async getUsers(params = {}) {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Lấy danh sách lịch hẹn
  async getAppointments(params = {}) {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  // Lấy danh sách khoa
  async getDepartments(params = {}) {
    const response = await api.get('/admin/departments', { params });
    return response.data;
  },

  // Lấy thông tin một chuyên khoa
  async getDepartmentById(id) {
    const response = await api.get(`/admin/departments/${id}`);
    return response.data;
  },

  // Tạo chuyên khoa mới
  async createDepartment(data) {
    const response = await api.post('/admin/departments', data);
    return response.data;
  },

  // Cập nhật chuyên khoa
  async updateDepartment(id, data) {
    const response = await api.put(`/admin/departments/${id}`, data);
    return response.data;
  },

  // Cập nhật trạng thái chuyên khoa
  async updateDepartmentStatus(id, is_active) {
    const response = await api.patch(`/admin/departments/${id}/status`, { is_active });
    return response.data;
  },

  // ========== DOCTORS ==========
  // Lấy danh sách bác sĩ
  async getDoctors(params = {}) {
    const response = await api.get('/admin/doctors', { params });
    return response.data;
  },

  // Lấy thông tin một bác sĩ
  async getDoctorById(id) {
    const response = await api.get(`/admin/doctors/${id}`);
    return response.data;
  },

  // Tạo bác sĩ mới
  async createDoctor(data) {
    const response = await api.post('/admin/doctors', data);
    return response.data;
  },

  // Cập nhật bác sĩ
  async updateDoctor(id, data) {
    const response = await api.put(`/admin/doctors/${id}`, data);
    return response.data;
  },

  // Cập nhật trạng thái bác sĩ
  async updateDoctorStatus(id, is_active) {
    const response = await api.patch(`/admin/doctors/${id}/status`, { is_active });
    return response.data;
  },

  // Lấy danh sách thiết bị
  async getDevices(params = {}) {
    const response = await api.get('/devices', { params });
    return response.data;
  },

  // Lấy chấm công
  async getAttendance(params = {}) {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  // ========== ROOMS ==========
  // Lấy danh sách phòng khám
  async getRooms(params = {}) {
    const response = await api.get('/admin/rooms', { params });
    return response.data;
  },

  // Lấy thông tin một phòng khám
  async getRoomById(id) {
    const response = await api.get(`/admin/rooms/${id}`);
    return response.data;
  },

  // Tạo phòng khám mới
  async createRoom(data) {
    const response = await api.post('/admin/rooms', data);
    return response.data;
  },

  // Cập nhật phòng khám
  async updateRoom(id, data) {
    const response = await api.put(`/admin/rooms/${id}`, data);
    return response.data;
  },

  // Cập nhật trạng thái phòng khám
  async updateRoomStatus(id, is_active) {
    const response = await api.patch(`/admin/rooms/${id}/status`, { is_active });
    return response.data;
  },
};

