import { useState, useEffect } from 'react';
import Layout from './Layout';
import DoctorCreateModal from '../components/Admin/DoctorCreateModal';
import DoctorEditModal from '../components/Admin/DoctorEditModal';
import ConfirmToggleStatusModal from '../components/Admin/ConfirmToggleStatusModal';
import { adminService } from '../services/adminService';
import {
  FaPlus,
  FaEdit,
  FaBan,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaStar,
} from 'react-icons/fa';

const AdminDoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    department_id: '',
    room_id: '',
    status: '',
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorToToggle, setDoctorToToggle] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartments();
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [page, search, filters]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        search,
        page,
        limit: 10,
      };

      if (filters.department_id) {
        params.department_id = filters.department_id;
      }
      if (filters.room_id) {
        params.room_id = filters.room_id;
      }
      if (filters.status) {
        params.status = filters.status;
      }

      const response = await adminService.getDoctors(params);

      if (response.success) {
        setDoctors(response.data || []);
        setPagination(response.pagination || pagination);
      } else {
        setError('Không thể tải danh sách bác sĩ');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await adminService.getDepartments({ limit: 1000 });
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await adminService.getRooms({ limit: 1000 });
      if (response.success) {
        setRooms(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(1);
  };

  const handleAdd = () => {
    setEditingDoctor(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor);
    setIsEditModalOpen(true);
  };

  const handleToggleStatus = (doctor) => {
    setDoctorToToggle(doctor);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!doctorToToggle) return;

    try {
      setSubmitting(true);
      setError('');
      const newStatus = !doctorToToggle.is_active;
      const response = await adminService.updateDoctorStatus(doctorToToggle.id, newStatus);

      if (response.success) {
        setIsConfirmModalOpen(false);
        setDoctorToToggle(null);
        fetchDoctors();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating doctor status:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');

      const response = await adminService.createDoctor(formData);

      if (response.success) {
        setIsCreateModalOpen(false);
        fetchDoctors();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error creating doctor:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo bác sĩ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');

      const response = await adminService.updateDoctor(editingDoctor.id, formData);

      if (response.success) {
        setIsEditModalOpen(false);
        setEditingDoctor(null);
        fetchDoctors();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật bác sĩ');
    } finally {
      setSubmitting(false);
    }
  };

  // Lọc rooms theo department đã chọn
  const filteredRooms = filters.department_id
    ? rooms.filter((room) => (room.department?.id || room.department_id) === parseInt(filters.department_id))
    : rooms;

  return (
    <Layout>
      <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý bác sĩ</h1>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            <FaPlus />
            <span>Thêm bác sĩ</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={filters.department_id}
            onChange={(e) => handleFilterChange('department_id', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả chuyên khoa</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {search || filters.department_id || filters.status
                ? 'Không tìm thấy bác sĩ nào'
                : 'Chưa có bác sĩ nào'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        STT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên bác sĩ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chuyên khoa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phòng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kinh nghiệm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {doctors.map((doctor, index) => (
                      <tr key={doctor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {doctor.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doctor.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doctor.department?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doctor.room?.room_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doctor.experience_years ? `${doctor.experience_years} năm` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <FaStar className="text-yellow-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {doctor.rating_avg ? doctor.rating_avg.toFixed(1) : '0.0'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {doctor.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 shadow-sm">
                              <FaCheckCircle className="text-green-600" />
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200 shadow-sm">
                              <FaTimesCircle className="text-red-600" />
                              Ngừng
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(doctor)}
                              className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Sửa"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(doctor)}
                              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                                doctor.is_active
                                  ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700'
                              }`}
                              title={doctor.is_active ? 'Ngừng hoạt động' : 'Kích hoạt'}
                            >
                              <FaBan className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Hiển thị {(pagination.page - 1) * pagination.limit + 1} đến{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} của{' '}
                    {pagination.total} kết quả
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Trước
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Trang {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <DoctorCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setError('');
        }}
        onSubmit={handleCreateSubmit}
        departments={departments}
        rooms={rooms}
        loading={submitting}
      />

      {/* Edit Modal */}
      <DoctorEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDoctor(null);
          setError('');
        }}
        onSubmit={handleEditSubmit}
        doctor={editingDoctor}
        departments={departments}
        rooms={rooms}
        loading={submitting}
      />

      {/* Confirm Toggle Status Modal */}
      <ConfirmToggleStatusModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setDoctorToToggle(null);
        }}
        onConfirm={handleConfirmToggle}
        item={doctorToToggle}
        itemType="bác sĩ"
        loading={submitting}
      />
    </Layout>
  );
};

export default AdminDoctorList;

