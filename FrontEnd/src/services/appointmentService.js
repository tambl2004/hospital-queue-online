import api from './api';

/**
 * APPOINTMENT SERVICE
 * Service xử lý các API liên quan đến quản lý lượt đăng ký khám (Appointments)
 */

export const appointmentService = {
  /**
   * Lấy danh sách appointments với filter và pagination
   * @param {Object} params - Filter parameters
   * @param {string} params.date - Ngày khám (YYYY-MM-DD)
   * @param {number} params.doctor_id - ID bác sĩ
   * @param {number} params.department_id - ID chuyên khoa
   * @param {number} params.room_id - ID phòng khám
   * @param {string} params.status - Trạng thái (WAITING, CALLED, IN_PROGRESS, DONE, CANCELLED, SKIPPED)
   * @param {string} params.search - Tìm kiếm theo tên/phone/email bệnh nhân
   * @param {number} params.page - Trang hiện tại
   * @param {number} params.limit - Số lượng mỗi trang
   * @param {string} params.sort_by - Sắp xếp theo (queue_number, appointment_time, created_at)
   * @param {string} params.sort_order - Thứ tự sắp xếp (ASC, DESC)
   * @returns {Promise<Object>} Response data
   */
  async getAppointments(params = {}) {
    try {
      const response = await api.get('/appointments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết một appointment
   * @param {number} id - ID appointment
   * @returns {Promise<Object>} Appointment detail
   */
  async getAppointmentById(id) {
    try {
      const response = await api.get(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment detail:', error);
      throw error;
    }
  },

  /**
   * Tạo appointment mới (Admin/Staff tạo thủ công)
   * @param {Object} data - Appointment data
   * @param {number} data.patient_id - ID bệnh nhân
   * @param {number} data.doctor_id - ID bác sĩ
   * @param {number} data.schedule_id - ID lịch khám
   * @param {string} data.appointment_date - Ngày khám (YYYY-MM-DD)
   * @param {string} data.appointment_time - Giờ khám (HH:mm:ss)
   * @returns {Promise<Object>} Created appointment
   */
  async createAppointment(data) {
    try {
      const response = await api.post('/appointments', data);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái appointment (theo state machine)
   * @param {number} id - ID appointment
   * @param {string} status - Trạng thái mới
   * @param {string} reason - Lý do (optional)
   * @returns {Promise<Object>} Updated appointment
   */
  async updateAppointmentStatus(id, status, reason = null) {
    try {
      const response = await api.patch(`/appointments/${id}/status`, {
        status,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  },

  /**
   * Hủy appointment (chỉ khi trạng thái WAITING)
   * @param {number} id - ID appointment
   * @param {string} reason - Lý do hủy
   * @returns {Promise<Object>} Response
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
   * Lấy thống kê appointments theo ngày
   * @param {string} date - Ngày (YYYY-MM-DD)
   * @returns {Promise<Object>} Daily statistics
   */
  async getDailyStats(date) {
    try {
      const response = await api.get('/appointments/stats/daily', {
        params: { date }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách appointments theo bác sĩ và ngày (dùng cho Queue)
   * @param {number} doctorId - ID bác sĩ
   * @param {string} date - Ngày (YYYY-MM-DD)
   * @returns {Promise<Object>} Appointments list
   */
  async getAppointmentsByDoctorAndDate(doctorId, date) {
    try {
      const response = await api.get(`/appointments/doctor/${doctorId}/date/${date}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments by doctor and date:', error);
      throw error;
    }
  },

  // ========== HELPER METHODS ==========

  /**
   * Kiểm tra có thể chuyển trạng thái không
   * @param {string} currentStatus - Trạng thái hiện tại
   * @param {string} newStatus - Trạng thái mới
   * @returns {boolean} True nếu hợp lệ
   */
  canTransitionStatus(currentStatus, newStatus) {
    const transitions = {
      WAITING: ['CALLED', 'CANCELLED'],
      CALLED: ['IN_PROGRESS', 'SKIPPED'],
      IN_PROGRESS: ['DONE'],
      SKIPPED: ['CALLED'],
      DONE: [],
      CANCELLED: []
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  },

  /**
   * Lấy nhãn hiển thị cho trạng thái
   * @param {string} status - Trạng thái
   * @returns {string} Nhãn tiếng Việt
   */
  getStatusLabel(status) {
    const labels = {
      WAITING: 'Đang chờ',
      CALLED: 'Đã gọi',
      IN_PROGRESS: 'Đang khám',
      DONE: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
      SKIPPED: 'Bỏ qua'
    };
    return labels[status] || status;
  },

  /**
   * Lấy màu badge cho trạng thái
   * @param {string} status - Trạng thái
   * @returns {string} Tên class Tailwind
   */
  getStatusColor(status) {
    const colors = {
      WAITING: 'bg-yellow-100 text-yellow-800',
      CALLED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      DONE: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      SKIPPED: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  },

  /**
   * Lấy danh sách actions có thể thực hiện theo trạng thái
   * @param {string} status - Trạng thái hiện tại
   * @returns {Array} Danh sách actions
   */
  getAvailableActions(status) {
    const actions = {
      WAITING: [
        { key: 'cancel', label: 'Hủy lịch', color: 'red', newStatus: 'CANCELLED' }
      ],
      CALLED: [
        { key: 'start', label: 'Bắt đầu khám', color: 'blue', newStatus: 'IN_PROGRESS' },
        { key: 'skip', label: 'Bỏ qua', color: 'gray', newStatus: 'SKIPPED' }
      ],
      IN_PROGRESS: [
        { key: 'complete', label: 'Kết thúc', color: 'green', newStatus: 'DONE' }
      ],
      SKIPPED: [
        { key: 'recall', label: 'Gọi lại', color: 'blue', newStatus: 'CALLED' }
      ],
      DONE: [],
      CANCELLED: []
    };
    return actions[status] || [];
  }
};

export default appointmentService;

