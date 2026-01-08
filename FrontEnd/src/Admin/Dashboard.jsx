import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import StatCard from '../components/Admin/StatCard';
import { adminService } from '../services/adminService';
import {
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaTimes,
  FaHandPaper,
  FaChartLine,
  FaUserMd,
  FaHospital,
  FaSync,
  FaArrowRight,
  FaStethoscope,
  FaDoorOpen,
  FaUser,
  FaList
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * ADMIN DASHBOARD
 * Trang tổng quan vận hành theo thời gian gần thực (near realtime)
 * 
 * Blocks:
 * A - KPI Cards (hôm nay)
 * B - Top tải (Top bác sĩ, Top chuyên khoa)
 * C - Tình trạng khám hiện tại (live list)
 * D - Biểu đồ 7 ngày gần nhất
 * E - Recent appointments
 */

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' or 'departments'
  const [lastRefresh, setLastRefresh] = useState(null);

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
    WAITING: 'bg-yellow-500',
    CALLED: 'bg-blue-500',
    IN_PROGRESS: 'bg-purple-500',
    DONE: 'bg-green-500',
    CANCELLED: 'bg-red-500',
    SKIPPED: 'bg-gray-500'
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const response = await adminService.getDashboardData();
      if (response.success) {
        setDashboardData(response.data);
        setLastRefresh(new Date());
      } else {
        setError('Không thể tải dữ liệu dashboard');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto refresh every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 45000); // 45 seconds

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  // Navigate to queue
  const handleGoToQueue = (doctorId) => {
    const today = new Date().toISOString().split('T')[0];
    navigate(`/admin/queue?doctor_id=${doctorId}&date=${today}`);
  };

  // Navigate to appointments
  const handleGoToAppointments = () => {
    navigate('/admin/appointments');
  };

  // Render chart 7 days
  const renderChart = () => {
    if (!dashboardData?.chart_7_days || dashboardData.chart_7_days.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <p>Không có dữ liệu</p>
        </div>
      );
    }

    // Format data for Recharts
    const chartData = dashboardData.chart_7_days.map(item => ({
      date: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      fullDate: item.date,
      lượt: item.total
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Số lượt', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px'
            }}
            labelFormatter={(label) => `Ngày: ${label}`}
            formatter={(value) => [`${value} lượt`, 'Số lượt']}
          />
          <Legend />
          <Bar 
            dataKey="lượt" 
            fill="#3b82f6" 
            radius={[8, 8, 0, 0]}
            name="Số lượt đăng ký"
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (loading && !dashboardData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const kpi = dashboardData?.kpi || {
    total: 0,
    WAITING: 0,
    CALLED: 0,
    IN_PROGRESS: 0,
    DONE: 0,
    CANCELLED: 0,
    SKIPPED: 0
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Tổng quan vận hành hôm nay - {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-sm text-gray-500">
                Cập nhật: {lastRefresh.toLocaleTimeString('vi-VN')}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Block A: KPI Cards */}
        <div className="space-y-4">
          {/* Hàng 1: 4 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Tổng lượt"
              value={kpi.total.toLocaleString()}
              icon={FaCalendarAlt}
              iconColor="bg-blue-500"
              subtitle="Hôm nay"
            />
            <StatCard
              title="Chờ gọi"
              value={kpi.WAITING.toLocaleString()}
              icon={FaClock}
              iconColor="bg-yellow-500"
            />
            <StatCard
              title="Đã gọi"
              value={kpi.CALLED.toLocaleString()}
              icon={FaHandPaper}
              iconColor="bg-blue-400"
            />
            <StatCard
              title="Đang khám"
              value={kpi.IN_PROGRESS.toLocaleString()}
              icon={FaStethoscope}
              iconColor="bg-purple-500"
            />
          </div>
          {/* Hàng 2: 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Hoàn thành"
              value={kpi.DONE.toLocaleString()}
              icon={FaCheckCircle}
              iconColor="bg-green-500"
            />
            <StatCard
              title="Đã huỷ"
              value={kpi.CANCELLED.toLocaleString()}
              icon={FaTimes}
              iconColor="bg-red-500"
            />
            <StatCard
              title="Bỏ qua"
              value={kpi.SKIPPED.toLocaleString()}
              icon={FaTimes}
              iconColor="bg-gray-500"
            />
          </div>
        </div>

        {/* Block B: Top tải */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Top tải hôm nay</h2>
            <div className="flex gap-2 border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveTab('doctors')}
                className={`px-4 py-2 transition-colors ${
                  activeTab === 'doctors'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FaUserMd className="inline mr-2" />
                Bác sĩ
              </button>
              <button
                onClick={() => setActiveTab('departments')}
                className={`px-4 py-2 transition-colors ${
                  activeTab === 'departments'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FaHospital className="inline mr-2" />
                Chuyên khoa
              </button>
            </div>
          </div>

          {activeTab === 'doctors' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Bác sĩ</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Tổng lượt hôm nay</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Đang chờ</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.top_doctors && dashboardData.top_doctors.length > 0 ? (
                    dashboardData.top_doctors.map((doctor, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800">{doctor.doctor_name}</td>
                        <td className="py-3 px-4 text-center text-gray-700">{doctor.total_today}</td>
                        <td className="py-3 px-4 text-center text-orange-600 font-medium">{doctor.waiting_count}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-gray-400">
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Chuyên khoa</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Tổng lượt hôm nay</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Đang chờ</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.top_departments && dashboardData.top_departments.length > 0 ? (
                    dashboardData.top_departments.map((dept, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800">{dept.department_name}</td>
                        <td className="py-3 px-4 text-center text-gray-700">{dept.total_today}</td>
                        <td className="py-3 px-4 text-center text-orange-600 font-medium">{dept.waiting_count}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-gray-400">
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Block C: Tình trạng khám hiện tại */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Tình trạng khám hiện tại</h2>
              <button
                onClick={handleGoToAppointments}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                Xem tất cả <FaArrowRight className="text-xs" />
              </button>
            </div>
            <div className="space-y-3">
              {dashboardData?.live_list && dashboardData.live_list.length > 0 ? (
                dashboardData.live_list.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          item.status === 'IN_PROGRESS' ? 'bg-purple-500' : 'bg-blue-500'
                        }`}></div>
                        <div>
                          <p className="font-semibold text-gray-800">{item.doctor_name}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <FaDoorOpen className="text-xs" />
                            {item.room_name} {item.room_code && `(${item.room_code})`}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'IN_PROGRESS'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {statusLabels[item.status] || item.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Số hiện tại:</span> {item.current_number || 'N/A'}
                        {item.patient_name && (
                          <span className="ml-3">
                            <FaUser className="inline mr-1 text-xs" />
                            {item.patient_name}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleGoToQueue(item.doctor_id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Vào Queue
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Không có lượt khám đang diễn ra
                </div>
              )}
            </div>
          </div>

          {/* Block D: Biểu đồ 7 ngày gần nhất */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Biểu đồ 7 ngày gần nhất</h2>
            {renderChart()}
          </div>
        </div>

        {/* Block E: Recent appointments */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Lượt đăng ký gần đây</h2>
            <button
              onClick={handleGoToAppointments}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              Xem tất cả <FaArrowRight className="text-xs" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Thời gian tạo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Bệnh nhân</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Bác sĩ</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Số thứ tự</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.recent_appointments && dashboardData.recent_appointments.length > 0 ? (
                  dashboardData.recent_appointments.map((apt, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">
                        {new Date(apt.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-gray-800">{apt.patient_name}</td>
                      <td className="py-3 px-4 text-gray-700">{apt.doctor_name}</td>
                      <td className="py-3 px-4 text-center text-gray-700">
                        {apt.queue_number || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[apt.status]
                            ? `${statusColors[apt.status]} text-white`
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {statusLabels[apt.status] || apt.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
