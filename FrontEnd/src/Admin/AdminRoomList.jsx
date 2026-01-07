import { useState, useEffect } from 'react';
import Layout from './Layout';
import RoomCreateModal from '../components/Admin/RoomCreateModal';
import RoomEditModal from '../components/Admin/RoomEditModal';
import ConfirmToggleStatusModal from '../components/Admin/ConfirmToggleStatusModal';
import { adminService } from '../services/adminService';
import {
  FaPlus,
  FaEdit,
  FaBan,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
} from 'react-icons/fa';

const AdminRoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    department_id: '',
    status: '',
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomToToggle, setRoomToToggle] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [search, filters]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        search,
        limit: 1000,
      };

      if (filters.department_id) {
        params.department_id = filters.department_id;
      }
      if (filters.status) {
        params.is_active = filters.status === 'active';
      }

      const response = await adminService.getRooms(params);

      if (response.success) {
        setRooms(response.data || []);
      } else {
        setError('Không thể tải danh sách phòng khám');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
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

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdd = () => {
    setEditingRoom(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setIsEditModalOpen(true);
  };

  const handleToggleStatus = (room) => {
    setRoomToToggle(room);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!roomToToggle) return;

    try {
      setSubmitting(true);
      setError('');
      const newStatus = !roomToToggle.is_active;
      const response = await adminService.updateRoomStatus(roomToToggle.id, newStatus);

      if (response.success) {
        setIsConfirmModalOpen(false);
        setRoomToToggle(null);
        fetchRooms();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating room status:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');

      const response = await adminService.createRoom(formData);

      if (response.success) {
        setIsCreateModalOpen(false);
        fetchRooms();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo phòng khám');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');

      const response = await adminService.updateRoom(editingRoom.id, formData);

      if (response.success) {
        setIsEditModalOpen(false);
        setEditingRoom(null);
        fetchRooms();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating room:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật phòng khám');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý phòng khám</h1>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            <FaPlus />
            <span>Thêm phòng</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã phòng, tên phòng..."
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
          ) : rooms.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {search || filters.department_id || filters.status
                ? 'Không tìm thấy phòng khám nào'
                : 'Chưa có phòng khám nào'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã phòng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên phòng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chuyên khoa
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
                  {rooms.map((room, index) => (
                    <tr key={room.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {room.room_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {room.room_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {room.department?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {room.is_active ? (
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
                            onClick={() => handleEdit(room)}
                            className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Sửa"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(room)}
                            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                              room.is_active
                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700'
                                : 'bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700'
                            }`}
                            title={room.is_active ? 'Ngừng sử dụng' : 'Kích hoạt'}
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
          )}
        </div>
      </div>

      {/* Create Modal */}
      <RoomCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setError('');
        }}
        onSubmit={handleCreateSubmit}
        departments={departments}
        loading={submitting}
      />

      {/* Edit Modal */}
      <RoomEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRoom(null);
          setError('');
        }}
        onSubmit={handleEditSubmit}
        room={editingRoom}
        departments={departments}
        loading={submitting}
      />

      {/* Confirm Toggle Status Modal */}
      <ConfirmToggleStatusModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setRoomToToggle(null);
        }}
        onConfirm={handleConfirmToggle}
        item={roomToToggle}
        itemType="phòng khám"
        loading={submitting}
      />
    </Layout>
  );
};

export default AdminRoomList;

