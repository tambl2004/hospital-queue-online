import { useState, useEffect } from 'react';
import { 
  FaSearch,
  FaFilter,
  FaSync,
  FaEye,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import Layout from './Layout';
import appointmentService from '../services/appointmentService';
import { adminService } from '../services/adminService';
import AppointmentDetailDrawer from '../components/Admin/AppointmentDetailDrawer';
import ConfirmAppointmentActionModal from '../components/Admin/ConfirmAppointmentActionModal';

/**
 * ADMIN APPOINTMENT LIST PAGE
 * Trang quản lý lượt đăng ký khám
 * 
 * Features:
 * - Lọc theo ngày, bác sĩ, chuyên khoa, phòng, trạng thái
 * - Tìm kiếm theo tên/phone/email bệnh nhân
 * - Xem chi tiết appointment
 * - Cập nhật trạng thái (theo state machine)
 * - Hủy lịch
 * - Pagination
 */

const AdminAppointmentList = () => {
  // ========== STATE ==========
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0], // Mặc định hôm nay
    doctor_id: '',
    department_id: '',
    room_id: '',
    status: '',
    search: ''
  });

  // Data cho dropdowns
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Drawer/Modal states
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'cancel', 'start', 'skip', 'complete', 'recall'

  // Statistics
  const [stats, setStats] = useState({
    WAITING: 0,
    CALLED: 0,
    IN_PROGRESS: 0,
    DONE: 0,
    CANCELLED: 0,
    SKIPPED: 0,
    total: 0
  });

  // ========== EFFECTS ==========
  useEffect(() => {
    loadDepartments();
    loadDoctors();
    loadRooms();
  }, []);

  useEffect(() => {
    loadAppointments();
    loadDailyStats();
  }, [filters, pagination.page]);

  // ========== LOAD DATA ==========
  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sort_by: 'queue_number',
        sort_order: 'ASC'
      };

      const response = await appointmentService.getAppointments(params);
      
      if (response.success) {
        setAppointments(response.data.appointments);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Không thể tải danh sách lượt đăng ký khám');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyStats = async () => {
    if (!filters.date) return;

    try {
      const response = await appointmentService.getDailyStats(filters.date);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading daily stats:', err);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await adminService.getDepartments({ page: 1, limit: 100 });
      if (response.success) {
        setDepartments(response.data.departments || []);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
      setDepartments([]);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await adminService.getDoctors({ page: 1, limit: 100 });
      if (response.success) {
        setDoctors(response.data.doctors || []);
      } else {
        setDoctors([]);
      }
    } catch (err) {
      console.error('Error loading doctors:', err);
      setDoctors([]);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await adminService.getRooms({ page: 1, limit: 100 });
      if (response.success) {
        setRooms(response.data.rooms || []);
      } else {
        setRooms([]);
      }
    } catch (err) {
      console.error('Error loading rooms:', err);
      setRooms([]);
    }
  };

  // ========== HANDLERS ==========
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset về trang 1
  };

  const handleResetFilters = () => {
    setFilters({
      date: new Date().toISOString().split('T')[0],
      doctor_id: '',
      department_id: '',
      room_id: '',
      status: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRefresh = () => {
    loadAppointments();
    loadDailyStats();
  };

  const handleViewDetail = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailDrawer(true);
  };

  const handleAction = (appointment, action) => {
    setSelectedAppointment(appointment);
    setActionType(action);
    setShowActionModal(true);
  };

  const handleConfirmAction = async (reason = null) => {
    if (!selectedAppointment || !actionType) return;

    try {
      let response;
      const action = appointmentService.getAvailableActions(selectedAppointment.status)
        .find(a => a.key === actionType);

      if (!action) return;

      if (actionType === 'cancel') {
        response = await appointmentService.cancelAppointment(
          selectedAppointment.id,
          reason
        );
      } else {
        response = await appointmentService.updateAppointmentStatus(
          selectedAppointment.id,
          action.newStatus,
          reason
        );
      }

      if (response.success) {
        // Reload data
        await loadAppointments();
        await loadDailyStats();
        
        // Close modal
        setShowActionModal(false);
        setSelectedAppointment(null);
        setActionType(null);

        // Show success message
        alert(`${action.label} thành công!`);
      }
    } catch (err) {
      console.error('Error performing action:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi thực hiện thao tác');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // ========== RENDER ==========
  return (
    <Layout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý lượt đăng ký khám
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi và quản lý toàn bộ lượt đăng ký khám của bệnh viện
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <FaSync className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-7 gap-4">
        <StatCard label="Tổng" value={stats.total} color="gray" />
        <StatCard label="Đang chờ" value={stats.WAITING} color="yellow" />
        <StatCard label="Đã gọi" value={stats.CALLED} color="blue" />
        <StatCard label="Đang khám" value={stats.IN_PROGRESS} color="purple" />
        <StatCard label="Hoàn thành" value={stats.DONE} color="green" />
        <StatCard label="Đã hủy" value={stats.CANCELLED} color="red" />
        <StatCard label="Bỏ qua" value={stats.SKIPPED} color="gray" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Date picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày khám
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chuyên khoa
            </label>
            <select
              value={filters.department_id}
              onChange={(e) => handleFilterChange('department_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả chuyên khoa</option>
              {departments && departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Doctor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bác sĩ
            </label>
            <select
              value={filters.doctor_id}
              onChange={(e) => handleFilterChange('doctor_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả bác sĩ</option>
              {doctors && doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>
              ))}
            </select>
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phòng khám
            </label>
            <select
              value={filters.room_id}
              onChange={(e) => handleFilterChange('room_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả phòng</option>
              {rooms && rooms.map(room => (
                <option key={room.id} value={room.id}>{room.room_name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="WAITING">Đang chờ</option>
              <option value="CALLED">Đã gọi</option>
              <option value="IN_PROGRESS">Đang khám</option>
              <option value="DONE">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="SKIPPED">Bỏ qua</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm bệnh nhân
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tên, số điện thoại, email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Đặt lại
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số thứ tự
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bệnh nhân
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bác sĩ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chuyên khoa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phòng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày/Giờ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    <div className="flex justify-center">
                      <FaSync className="w-6 h-6 animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                appointments.map((appointment, index) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    index={(pagination.page - 1) * pagination.limit + index + 1}
                    onViewDetail={handleViewDetail}
                    onAction={handleAction}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && appointments.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>
                {' '}-{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>
                {' '}trong{' '}
                <span className="font-medium">{pagination.total}</span>
                {' '}kết quả
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and adjacent pages
                      return (
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - pagination.page) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <span key={`ellipsis-${page}`} className="px-2">...</span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded-lg ${
                            page === pagination.page
                              ? 'bg-blue-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawer: Chi tiết appointment */}
      {showDetailDrawer && selectedAppointment && (
        <AppointmentDetailDrawer
          appointment={selectedAppointment}
          onClose={() => {
            setShowDetailDrawer(false);
            setSelectedAppointment(null);
          }}
          onRefresh={handleRefresh}
        />
      )}

      {/* Modal: Xác nhận thao tác */}
      {showActionModal && selectedAppointment && actionType && (
        <ConfirmAppointmentActionModal
          appointment={selectedAppointment}
          action={actionType}
          onConfirm={handleConfirmAction}
          onClose={() => {
            setShowActionModal(false);
            setSelectedAppointment(null);
            setActionType(null);
          }}
        />
      )}
    </div>
    </Layout>
  );
};

// ========== SUB COMPONENTS ==========

/**
 * Stat Card Component
 */
const StatCard = ({ label, value, color }) => {
  const colorClasses = {
    gray: 'bg-gray-50 text-gray-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700'
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-4`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
};

/**
 * Appointment Row Component
 */
const AppointmentRow = ({ appointment, index, onViewDetail, onAction }) => {
  const actions = appointmentService.getAvailableActions(appointment.status);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">
        {index}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="w-4 h-4 text-gray-400" />
          <span className="text-lg font-bold text-blue-600">
            {appointment.queue_number || '-'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900">
          {appointment.patient_name}
        </div>
        <div className="text-sm text-gray-500">
          {appointment.patient_phone}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {appointment.doctor_name}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {appointment.department_name}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {appointment.room_name || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        <div>{new Date(appointment.appointment_date).toLocaleDateString('vi-VN')}</div>
        <div className="text-gray-500">{appointment.appointment_time?.slice(0, 5)}</div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          appointmentService.getStatusColor(appointment.status)
        }`}>
          {appointmentService.getStatusLabel(appointment.status)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetail(appointment)}
            className="p-1 text-gray-600 hover:text-blue-600"
            title="Xem chi tiết"
          >
            <FaEye className="w-4 h-4" />
          </button>

          {actions.map(action => (
            <button
              key={action.key}
              onClick={() => onAction(appointment, action.key)}
              className={`px-2 py-1 text-xs font-medium rounded ${
                action.color === 'red'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : action.color === 'green'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : action.color === 'blue'
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={action.label}
            >
              {action.label}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
};

export default AdminAppointmentList;

