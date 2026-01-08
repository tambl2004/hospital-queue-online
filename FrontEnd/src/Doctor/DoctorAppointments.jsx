import { useState, useEffect } from 'react';
import Layout from './Layout';
import { doctorService } from '../services/doctorService';
import {
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaPhone,
  FaSync,
  FaFilter,
  FaList,
} from 'react-icons/fa';

/**
 * DOCTOR APPOINTMENTS PAGE
 * Trang xem lịch khám của bác sĩ
 * 
 * Features:
 * - Xem danh sách bệnh nhân đã đặt lịch với mình
 * - Lọc theo ngày và trạng thái
 * - Xem thông tin bệnh nhân: Tên, Số thứ tự, Giờ khám, Trạng thái
 * - Không cho huỷ/sửa lịch (chỉ xem)
 */

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Status labels
  const statusLabels = {
    WAITING: 'Chờ gọi',
    CALLED: 'Đã gọi',
    IN_PROGRESS: 'Đang khám',
    DONE: 'Hoàn thành',
    CANCELLED: 'Đã huỷ',
    SKIPPED: 'Bỏ qua'
  };

  const statusColors = {
    WAITING: 'bg-yellow-100 text-yellow-800',
    CALLED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    DONE: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    SKIPPED: 'bg-gray-100 text-gray-800'
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        date: selectedDate,
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (selectedStatus) {
        params.status = selectedStatus;
      }

      const response = await doctorService.getTodayAppointments(params);
      if (response.success) {
        setAppointments(response.data.appointments);
        setPagination(response.data.pagination);
      } else {
        setError('Không thể tải danh sách lịch khám');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, selectedStatus, pagination.page]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Lịch khám của tôi</h1>
            <p className="text-gray-600 mt-1">Xem danh sách bệnh nhân đã đặt lịch với bạn</p>
          </div>
          <button
            onClick={fetchAppointments}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Lọc:</span>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày khám
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả</option>
                  <option value="WAITING">Chờ gọi</option>
                  <option value="CALLED">Đã gọi</option>
                  <option value="IN_PROGRESS">Đang khám</option>
                  <option value="DONE">Hoàn thành</option>
                  <option value="CANCELLED">Đã huỷ</option>
                  <option value="SKIPPED">Bỏ qua</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FaList />
              Danh sách lịch khám ({pagination.total})
            </h2>
          </div>

          {loading && appointments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : appointments.length > 0 ? (
            <>
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          {appointment.queue_number && (
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="font-bold text-blue-600">#{appointment.queue_number}</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <FaUser className="text-gray-400" />
                              <p className="font-semibold text-gray-800 text-lg">
                                {appointment.patient_name}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <FaPhone className="text-gray-400" />
                              <span>{appointment.patient_phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FaCalendarAlt className="text-gray-400" />
                            <span>
                              {new Date(appointment.appointment_date).toLocaleDateString('vi-VN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          {appointment.appointment_time && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaClock className="text-gray-400" />
                              <span>{appointment.appointment_time}</span>
                            </div>
                          )}
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              statusColors[appointment.status] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {statusLabels[appointment.status] || appointment.status}
                            </span>
                          </div>
                        </div>

                        {appointment.department_name && (
                          <div className="mt-2 text-sm text-gray-500">
                            Chuyên khoa: {appointment.department_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-700">
                    Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} lịch khám
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Trước
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Trang {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <FaList className="text-4xl mx-auto mb-4 opacity-50" />
              <p>Không có lịch khám nào</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DoctorAppointments;

