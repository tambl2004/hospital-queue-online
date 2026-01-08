import { useState, useEffect } from 'react';
import Layout from './Layout';
import UserCreateModal from '../components/Admin/UserCreateModal';
import UserEditModal from '../components/Admin/UserEditModal';
import ConfirmToggleStatusModal from '../components/Admin/ConfirmToggleStatusModal';
import { adminService } from '../services/adminService';
import {
  FaPlus,
  FaEdit,
  FaBan,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaUser,
} from 'react-icons/fa';

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    role: '',
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToToggle, setUserToToggle] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, search, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        search,
        page,
        limit: 10,
      };

      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.role) {
        params.role = filters.role;
      }

      const response = await adminService.getUsers(params);

      if (response.success) {
        setUsers(response.data || []);
        setPagination(response.pagination || pagination);
      } else {
        setError('Không thể tải danh sách người dùng');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      // Roles được hardcode vì không có API riêng
      setRoles([
        { code: 'ADMIN', name: 'Quản trị viên' },
        { code: 'DOCTOR', name: 'Bác sĩ' },
        { code: 'PATIENT', name: 'Bệnh nhân' },
      ]);
    } catch (error) {
      console.error('Error fetching roles:', error);
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
    setEditingUser(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleToggleStatus = (user) => {
    setUserToToggle(user);
    setIsConfirmModalOpen(true);
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!userToToggle) return;

    try {
      setSubmitting(true);
      setError('');
      const newStatus = !userToToggle.is_active;
      const response = await adminService.updateUserStatus(userToToggle.id, newStatus);

      if (response.success) {
        setIsConfirmModalOpen(false);
        setUserToToggle(null);
        fetchUsers();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setSubmitting(true);
      setError('');
      const response = await adminService.deleteUser(userToDelete.id);

      if (response.success) {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa người dùng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');

      const response = await adminService.createUser(formData);

      if (response.success) {
        setIsCreateModalOpen(false);
        fetchUsers();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo người dùng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');

      const response = await adminService.updateUser(editingUser.id, formData);

      if (response.success) {
        setIsEditModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật người dùng');
    } finally {
      setSubmitting(false);
    }
  };

  // Lấy danh sách role codes unique từ users
  const availableRoles = roles;

  return (
    <Layout>
      <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h1>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            <FaPlus />
            <span>Thêm người dùng</span>
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
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả vai trò</option>
            {availableRoles.map((role) => (
              <option key={role.code} value={role.code}>
                {role.name}
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
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {search || filters.role || filters.status
                ? 'Không tìm thấy người dùng nào'
                : 'Chưa có người dùng nào'}
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
                        Họ tên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số điện thoại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vai trò
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
                    {users.map((user, index) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <FaUser className="text-gray-400" />
                            {user.full_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((roleCode) => {
                                const role = availableRoles.find((r) => r.code === roleCode);
                                return (
                                  <span
                                    key={roleCode}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {role ? role.name : roleCode}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.is_active ? (
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
                              onClick={() => handleEdit(user)}
                              className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Sửa"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                                user.is_active
                                  ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700'
                              }`}
                              title={user.is_active ? 'Ngừng hoạt động' : 'Kích hoạt'}
                            >
                              <FaBan className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Xóa"
                            >
                              <FaTrash className="text-sm" />
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
      <UserCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setError('');
        }}
        onSubmit={handleCreateSubmit}
        roles={roles}
        loading={submitting}
      />

      {/* Edit Modal */}
      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
          setError('');
        }}
        onSubmit={handleEditSubmit}
        user={editingUser}
        roles={roles}
        loading={submitting}
      />

      {/* Confirm Toggle Status Modal */}
      <ConfirmToggleStatusModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setUserToToggle(null);
        }}
        onConfirm={handleConfirmToggle}
        item={userToToggle}
        itemType="người dùng"
        loading={submitting}
      />

      {/* Confirm Delete Modal */}
      <ConfirmToggleStatusModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        item={userToDelete}
        itemType="người dùng"
        actionType="delete"
        loading={submitting}
      />
    </Layout>
  );
};

export default AdminUserList;

