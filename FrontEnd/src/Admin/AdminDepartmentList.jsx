import { useState, useEffect } from 'react';
import Layout from './Layout';
import DepartmentFormModal from '../components/Admin/DepartmentFormModal';
import { adminService } from '../services/adminService';
import { FaPlus, FaEdit, FaBan, FaCheckCircle, FaTimesCircle, FaSearch } from 'react-icons/fa';

const AdminDepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, [page, search]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getDepartments({
        search,
        page,
        limit: 10,
      });

      if (response.success) {
        setDepartments(response.data || []);
        setPagination(response.pagination || pagination);
      } else {
        setError('Không thể tải danh sách chuyên khoa');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset về trang 1 khi tìm kiếm
  };

  const handleAdd = () => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError('');

      let response;
      if (editingDepartment) {
        response = await adminService.updateDepartment(editingDepartment.id, formData);
      } else {
        response = await adminService.createDepartment(formData);
      }

      if (response.success) {
        setIsModalOpen(false);
        setEditingDepartment(null);
        fetchDepartments();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting department:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (department) => {
    const newStatus = !department.is_active;
    const action = newStatus ? 'kích hoạt' : 'ngừng sử dụng';

    if (!window.confirm(`Bạn có chắc chắn muốn ${action} chuyên khoa "${department.name}"?`)) {
      return;
    }

    try {
      setError('');
      const response = await adminService.updateDepartmentStatus(department.id, newStatus);

      if (response.success) {
        fetchDepartments();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating department status:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý chuyên khoa</h1>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            <FaPlus />
            <span>Thêm chuyên khoa</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên chuyên khoa..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          ) : departments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {search ? 'Không tìm thấy chuyên khoa nào' : 'Chưa có chuyên khoa nào'}
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
                        Tên chuyên khoa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mô tả
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
                    {departments.map((department, index) => (
                      <tr key={department.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {department.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                          {department.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {department.is_active ? (
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
                              onClick={() => handleEdit(department)}
                              className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Sửa"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(department)}
                              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                                department.is_active
                                  ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700'
                              }`}
                              title={department.is_active ? 'Ngừng sử dụng' : 'Kích hoạt'}
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

      {/* Modal */}
      <DepartmentFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDepartment(null);
          setError('');
        }}
        onSubmit={handleSubmit}
        department={editingDepartment}
        loading={submitting}
      />
    </Layout>
  );
};

export default AdminDepartmentList;

