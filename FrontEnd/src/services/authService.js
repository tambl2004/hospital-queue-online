import api from './api';

export const authService = {
  // Đăng nhập
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Đăng ký
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Quên mật khẩu
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Đặt lại mật khẩu
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      token,
      password: newPassword,
    });
    return response.data;
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Lấy thông tin user hiện tại từ server
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Cập nhật hồ sơ (full_name, phone, gender, date_of_birth)
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // Đổi mật khẩu
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  // Lấy thông tin user hiện tại từ localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Kiểm tra đã đăng nhập
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Đăng nhập Google - redirect đến backend
  loginWithGoogle: () => {
    window.location.href = '/api/auth/google';
  },
};

