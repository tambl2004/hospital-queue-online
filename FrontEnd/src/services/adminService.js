import api from './api';

export const adminService = {
  // Lấy thống kê tổng quan dashboard
  async getDashboardData() {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // ========== USERS ==========
  // Lấy danh sách người dùng
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Lấy thông tin một người dùng
  async getUserById(id) {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  // Tạo người dùng mới
  async createUser(data) {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  // Cập nhật người dùng
  async updateUser(id, data) {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  // Cập nhật trạng thái người dùng
  async updateUserStatus(id, is_active) {
    const response = await api.patch(`/admin/users/${id}/status`, { is_active });
    return response.data;
  },

  // Xóa người dùng
  async deleteUser(id) {
    const response = await api.delete(`/admin/users/${id}`);
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

  // ========== SCHEDULES ==========
  // Lấy danh sách lịch khám theo bác sĩ và ngày
  async getSchedules(params = {}) {
    const response = await api.get('/admin/schedules', { params });
    return response.data;
  },

  // Tạo lịch tự động (bulk)
  async createBulkSchedules(data) {
    const response = await api.post('/admin/schedules/bulk', data);
    return response.data;
  },

  // Cập nhật slot (is_active hoặc max_patients)
  async updateSchedule(id, data) {
    const response = await api.patch(`/admin/schedules/${id}`, data);
    return response.data;
  },

  // Xóa slot
  async deleteSchedule(id) {
    const response = await api.delete(`/admin/schedules/${id}`);
    return response.data;
  },

  // ========== REPORTS ==========
  // Lấy báo cáo thống kê appointments
  async getReports(params = {}) {
    const response = await api.get('/admin/reports', { params });
    return response.data;
  },
};

