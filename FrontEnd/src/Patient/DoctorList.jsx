import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { patientService } from '../services/patientService';
import { FaUserMd, FaStar, FaSearch, FaArrowLeft } from 'react-icons/fa';

function DoctorList() {
  const { departmentId: departmentIdFromParams } = useParams();
  const [searchParams] = useSearchParams();
  const departmentIdFromQuery = searchParams.get('departmentId');
  const departmentId = departmentIdFromParams || departmentIdFromQuery;
  
  const [doctors, setDoctors] = useState([]);
  const [department, setDepartment] = useState(null);
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
    if (departmentId) {
      fetchDepartment();
    }
    fetchDoctors();
  }, [departmentId, page, search]);

  const fetchDepartment = async () => {
    try {
      const response = await patientService.getDepartmentById(departmentId);
      if (response.success) {
        setDepartment(response.data);
      }
    } catch (error) {
      console.error('Error fetching department:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = {
        status: 'active',
        search,
        page,
        limit: 12,
      };
      if (departmentId) {
        params.department_id = departmentId;
      }
      const response = await patientService.getDoctors(params);
      if (response.success) {
        setDoctors(response.data || []);
        setPagination(response.pagination || pagination);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
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
          <Link
            to="/departments"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Quay lại danh sách chuyên khoa
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {department ? `Bác Sĩ - ${department.name}` : 'Danh Sách Bác Sĩ'}
          </h1>
          {department && department.description && (
            <p className="text-gray-600">{department.description}</p>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bác sĩ..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Doctors Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Không tìm thấy bác sĩ nào</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {doctors.map((doctor) => (
                <Link
                  key={doctor.id}
                  to={`/doctors/${doctor.id}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:scale-105"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaUserMd className="text-blue-600 text-3xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {doctor.full_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {doctor.department?.name}
                      </p>
                      {doctor.experience_years && (
                        <p className="text-sm text-gray-500 mb-2">
                          Kinh nghiệm: {doctor.experience_years} năm
                        </p>
                      )}
                      {doctor.rating_avg != null && Number(doctor.rating_avg) > 0 && (
                        <div className="flex items-center gap-1">
                          <FaStar className="text-yellow-400" />
                          <span className="font-medium text-gray-700">
                            {Number(doctor.rating_avg).toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500">({Number(doctor.rating_avg).toFixed(1)})</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {doctor.bio && (
                    <p className="text-sm text-gray-600 mt-4 line-clamp-2">{doctor.bio}</p>
                  )}
                  <div className="mt-4 text-blue-600 font-medium text-sm">
                    Xem chi tiết và đặt lịch →
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

export default DoctorList;

