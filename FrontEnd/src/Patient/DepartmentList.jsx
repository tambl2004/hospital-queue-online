import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientService } from '../services/patientService';
import { FaHospital, FaArrowRight, FaSearch } from 'react-icons/fa';

function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    fetchDepartments();
  }, [page, search]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await patientService.getDepartments({
        search,
        page,
        limit: 12,
      });
      if (response.success) {
        setDepartments(response.data || []);
        setPagination(response.pagination || pagination);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center gap-3">
            <FaHospital className="text-blue-600" />
            Danh Sách Chuyên Khoa
          </h1>
          <p className="text-gray-600">
            Chọn chuyên khoa để xem danh sách bác sĩ và đặt lịch khám
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm chuyên khoa..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Departments Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Không tìm thấy chuyên khoa nào</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {departments.map((dept) => (
                <Link
                  key={dept.id}
                  to={`/departments/${dept.id}/doctors`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:scale-105"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FaHospital className="text-blue-600 text-2xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800">{dept.name}</h3>
                      {dept.is_active === false && (
                        <span className="text-xs text-red-600">Tạm ngưng</span>
                      )}
                    </div>
                  </div>
                  {dept.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {dept.description}
                    </p>
                  )}
                  <div className="flex items-center text-blue-600 font-medium">
                    Xem bác sĩ <FaArrowRight className="ml-2" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DepartmentList;

