import api from './api';

export const faqService = {
  // Lấy danh sách FAQs (public)
  getFAQs: async (isActive = true) => {
    const response = await api.get('/faqs/public', {
      params: { is_active: isActive },
    });
    return response.data;
  },

  // Admin: Lấy danh sách FAQs
  getAllFAQs: async () => {
    const response = await api.get('/admin/faqs');
    return response.data;
  },

  // Admin: Lấy FAQ theo ID
  getFAQById: async (id) => {
    const response = await api.get(`/admin/faqs/${id}`);
    return response.data;
  },

  // Admin: Tạo FAQ mới
  createFAQ: async (faqData) => {
    const response = await api.post('/admin/faqs', faqData);
    return response.data;
  },

  // Admin: Cập nhật FAQ
  updateFAQ: async (id, faqData) => {
    const response = await api.put(`/admin/faqs/${id}`, faqData);
    return response.data;
  },

  // Admin: Xóa FAQ
  deleteFAQ: async (id) => {
    const response = await api.delete(`/admin/faqs/${id}`);
    return response.data;
  },
};

