import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import StatCard from '../components/Admin/StatCard';
import { staffService } from '../services/staffService';
import {
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaStethoscope,
  FaSync,
  FaArrowRight,
  FaDoorOpen,
  FaUser,
  FaList,
  FaBullhorn,
} from 'react-icons/fa';

/**
 * STAFF DASHBOARD
 * Trang tổng quan vận hành hôm nay cho nhân viên
 * 
 * Blocks:
 * A - KPI Cards (Tổng lượt, WAITING, IN_PROGRESS, DONE)
 * B - Danh sách đang chờ (Bác sĩ, Phòng, Số hiện tại, Số tiếp theo, Nút "Vào Queue")
 * C - Shortcut (Danh sách lượt đăng ký hôm nay, Gọi số)
 */

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      const response = await staffService.getDashboardData();
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

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds

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
    navigate(`/staff/queue?doctor_id=${doctorId}&date=${today}`);
  };

  // Navigate to appointments
  const handleGoToAppointments = () => {
    navigate('/staff/appointments');
  };

  // Navigate to queue dashboard
  const handleGoToQueueDashboard = () => {
    navigate('/staff/queue');
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
    IN_PROGRESS: 0,
    DONE: 0
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Nhân viên</h1>
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
            title="Đang khám"
            value={kpi.IN_PROGRESS.toLocaleString()}
            icon={FaStethoscope}
            iconColor="bg-purple-500"
          />
          <StatCard
            title="Hoàn thành"
            value={kpi.DONE.toLocaleString()}
            icon={FaCheckCircle}
            iconColor="bg-green-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Block B: Danh sách đang chờ */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Danh sách đang chờ</h2>
              <button
                onClick={handleGoToAppointments}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                Xem tất cả <FaArrowRight className="text-xs" />
              </button>
            </div>
            <div className="space-y-3">
              {dashboardData?.waiting_list && dashboardData.waiting_list.length > 0 ? (
                dashboardData.waiting_list.map((item, index) => (
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
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Số hiện tại:</span> {item.current_number || 'N/A'}
                          {item.current_patient_name && (
                            <span className="ml-3">
                              <FaUser className="inline mr-1 text-xs" />
                              {item.current_patient_name}
                            </span>
                          )}
                        </div>
                        {item.next_number && (
                          <div>
                            <span className="font-medium">Số tiếp theo:</span> {item.next_number}
                          </div>
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

          {/* Block C: Shortcut */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thao tác nhanh</h2>
            <div className="space-y-3">
              <button
                onClick={handleGoToAppointments}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaList className="text-xl" />
                <span className="font-medium">Danh sách lượt đăng ký hôm nay</span>
              </button>
              <button
                onClick={handleGoToQueueDashboard}
                className="w-full flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaBullhorn className="text-xl" />
                <span className="font-medium">Gọi số</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StaffDashboard;

