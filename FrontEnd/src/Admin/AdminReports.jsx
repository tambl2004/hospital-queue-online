import { useState, useEffect } from 'react';
import { 
  FaCalendarAlt,
  FaFilter,
  FaSync,
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle,
  FaUserMd,
  FaHospital,
  FaList
} from 'react-icons/fa';
import Layout from './Layout';
import { adminService } from '../services/adminService';
import StatCard from '../components/Admin/StatCard';

/**
 * ADMIN REPORTS PAGE
 * Trang báo cáo thống kê appointments
 * 
 * Features:
 * - Bộ lọc: Date range, chuyên khoa, bác sĩ, trạng thái
 * - Summary cards: Tổng lượt, DONE, CANCELLED, tỉ lệ huỷ, trung bình/ngày
 * - Biểu đồ theo ngày
 * - Top bác sĩ
 * - Top chuyên khoa
 * - Breakdown theo trạng thái
 */

const AdminReports = () => {
  // ========== STATE ==========
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // 30 ngày trước
    to: new Date().toISOString().split('T')[0], // Hôm nay
    department_id: '',
    doctor_id: '',
    status: ''
  });

  // Data cho dropdowns
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Reports data
  const [reportsData, setReportsData] = useState(null);

  // Status labels (Vietnamese)
  const statusLabels = {
    WAITING: 'Chờ gọi',
    CALLED: 'Đã gọi',
    IN_PROGRESS: 'Đang khám',
    DONE: 'Hoàn thành',
    CANCELLED: 'Đã huỷ',
    SKIPPED: 'Bỏ qua'
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    loadDepartments();
    loadDoctors();
  }, []);

  // ========== LOAD DATA ==========
  const loadDepartments = async () => {
    try {
      const response = await adminService.getDepartments({ limit: 1000 });
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await adminService.getDoctors({ limit: 1000 });
      if (response.success) {
        setDoctors(response.data || []);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        from: filters.from,
        to: filters.to
      };

      if (filters.department_id) {
        params.department_id = filters.department_id;
      }

      if (filters.doctor_id) {
        params.doctor_id = filters.doctor_id;
      }

      if (filters.status) {
        params.status = filters.status;
      }

      const response = await adminService.getReports(params);

      if (response.success) {
        setReportsData(response.data);
      } else {
        setError('Không thể tải báo cáo');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // ========== HANDLERS ==========
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewReports = () => {
    loadReports();
  };

  const handleReset = () => {
    setFilters({
      from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
      department_id: '',
      doctor_id: '',
      status: ''
    });
    setReportsData(null);
  };

  // Filter doctors by department
  const filteredDoctors = filters.department_id
    ? doctors.filter(d => d.department?.id === parseInt(filters.department_id))
    : doctors;

  // ========== RENDER CHART ==========
  const renderDailyChart = () => {
    if (!reportsData?.daily_series || reportsData.daily_series.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <p>Không có dữ liệu để hiển thị</p>
        </div>
      );
    }

    const data = reportsData.daily_series;
    const maxValue = Math.max(...data.map(d => d.total), 1);
    const chartHeight = 250;

    return (
      <div className="relative" style={{ height: `${chartHeight + 60}px` }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-12 w-12 flex flex-col justify-between text-xs text-gray-500">
          <span>{maxValue}</span>
          <span>{Math.floor(maxValue / 2)}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-14 h-full">
          <div className="relative" style={{ height: `${chartHeight}px` }}>
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2].map(i => (
                <div key={i} className="border-t border-gray-200"></div>
              ))}
            </div>

            {/* Bars */}
            <div className="absolute inset-0 flex items-end gap-1 px-2">
              {data.map((item, index) => {
                const height = (item.total / maxValue) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center group relative"
                  >
                    <div
                      className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-colors cursor-pointer relative"
                      style={{ height: `${height}%` }}
                      title={`${item.date}: ${item.total} lượt`}
                    >
                      {height > 10 && (
                        <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                          {item.total}
                        </span>
                      )}
                    </div>
                    <span className="mt-1 text-xs text-gray-600 transform -rotate-45 origin-left whitespace-nowrap" style={{ transformOrigin: 'top left' }}>
                      {new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Báo cáo thống kê</h1>
            <p className="text-gray-600 mt-1">Báo cáo chi tiết lượt đăng ký khám theo khoảng thời gian</p>
          </div>
        </div>

        {/* Khu A: Bộ lọc báo cáo */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Bộ lọc báo cáo</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => handleFilterChange('from', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => handleFilterChange('to', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chuyên khoa
              </label>
              <select
                value={filters.department_id}
                onChange={(e) => {
                  handleFilterChange('department_id', e.target.value);
                  handleFilterChange('doctor_id', ''); // Reset doctor when department changes
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả</option>
                {departments.map(dept => (
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
                disabled={!filters.department_id && departments.length > 0}
              >
                <option value="">Tất cả</option>
                {filteredDoctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>
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
                <option value="">Tất cả</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleViewReports}
              disabled={loading || !filters.from || !filters.to}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <FaChartLine />
              {loading ? 'Đang tải...' : 'Xem báo cáo'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <FaSync />
              Reset
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Khu B: Summary Cards */}
        {reportsData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                title="Tổng lượt"
                value={reportsData.summary.total.toLocaleString()}
                icon={FaChartLine}
                subtitle={`${reportsData.summary.date_range.days} ngày`}
                iconColor="bg-blue-500"
              />
              <StatCard
                title="Hoàn thành"
                value={reportsData.summary.done.toLocaleString()}
                icon={FaCheckCircle}
                iconColor="bg-green-500"
              />
              <StatCard
                title="Đã huỷ"
                value={reportsData.summary.cancelled.toLocaleString()}
                icon={FaTimesCircle}
                iconColor="bg-red-500"
              />
              <StatCard
                title="Tỉ lệ huỷ"
                value={`${reportsData.summary.cancel_rate}%`}
                icon={FaTimesCircle}
                subtitle={`${reportsData.summary.cancelled}/${reportsData.summary.total}`}
                iconColor="bg-orange-500"
              />
              <StatCard
                title="Trung bình/ngày"
                value={reportsData.summary.avg_per_day}
                icon={FaChartLine}
                subtitle="lượt mỗi ngày"
                iconColor="bg-purple-500"
              />
            </div>

            {/* Khu C: Biểu đồ & Bảng */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* C1: Biểu đồ theo ngày */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaChartLine className="text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Biểu đồ theo ngày</h2>
                </div>
                {renderDailyChart()}
              </div>

              {/* C4: Breakdown theo trạng thái */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaList className="text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Phân bổ theo trạng thái</h2>
                </div>
                {reportsData.status_breakdown && reportsData.status_breakdown.length > 0 ? (
                  <div className="space-y-3">
                    {reportsData.status_breakdown.map((item, index) => {
                      const percentage = reportsData.summary.total > 0
                        ? ((item.count / reportsData.summary.total) * 100).toFixed(1)
                        : 0;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{statusLabels[item.status] || item.status}</span>
                            <span className="font-semibold text-gray-800">
                              {item.count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">Không có dữ liệu</p>
                )}
              </div>
            </div>

            {/* C2: Top bác sĩ */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaUserMd className="text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-800">Top bác sĩ</h2>
              </div>
              {reportsData.top_doctors && reportsData.top_doctors.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Bác sĩ</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Tổng</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Hoàn thành</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Đã huỷ</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Đang chờ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportsData.top_doctors.map((doctor, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-800">{doctor.doctor_name}</td>
                          <td className="py-3 px-4 text-center text-gray-700">{doctor.total}</td>
                          <td className="py-3 px-4 text-center text-green-600 font-medium">{doctor.done}</td>
                          <td className="py-3 px-4 text-center text-red-600 font-medium">{doctor.cancelled}</td>
                          <td className="py-3 px-4 text-center text-orange-600 font-medium">{doctor.waiting_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Không có dữ liệu</p>
              )}
            </div>

            {/* C3: Top chuyên khoa */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaHospital className="text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-800">Top chuyên khoa</h2>
              </div>
              {reportsData.top_departments && reportsData.top_departments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Chuyên khoa</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Tổng</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Hoàn thành</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Đã huỷ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportsData.top_departments.map((dept, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-800">{dept.department_name}</td>
                          <td className="py-3 px-4 text-center text-gray-700">{dept.total}</td>
                          <td className="py-3 px-4 text-center text-green-600 font-medium">{dept.done}</td>
                          <td className="py-3 px-4 text-center text-red-600 font-medium">{dept.cancelled}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Không có dữ liệu</p>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !reportsData && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FaChartLine className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Chọn khoảng thời gian và nhấn "Xem báo cáo" để xem thống kê</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminReports;

