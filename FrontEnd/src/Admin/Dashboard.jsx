import { useState, useEffect } from 'react';
import Layout from './Layout';
import StatCard from '../components/Admin/StatCard';
import { adminService } from '../services/adminService';
import {
  FaUsers,
  FaUserMd,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaPlus,
  FaHandPaper,
  FaChartBar,
} from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  const statData = stats || {
    totalPatients: 0,
    totalDoctors: 0,
    totalStaff: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    appointmentsByStatus: {},
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <FaHandPaper className="text-3xl" />
            <h1 className="text-3xl font-bold">Chào mừng trở lại!</h1>
          </div>
          <p className="text-blue-100">
            Đây là tổng quan về hệ thống quản lý bệnh viện của bạn
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Tổng số bệnh nhân"
            value={statData.totalPatients?.toLocaleString('vi-VN') || '0'}
            icon={FaUsers}
            iconColor="bg-blue-500"
            change="+12% so với tháng trước"
            changeType="positive"
          />
          <StatCard
            title="Tổng số bác sĩ"
            value={statData.totalDoctors?.toLocaleString('vi-VN') || '0'}
            icon={FaUserMd}
            iconColor="bg-purple-500"
            change="+3 bác sĩ mới"
            changeType="positive"
          />
          <StatCard
            title="Lịch hẹn hôm nay"
            value={statData.todayAppointments?.toLocaleString('vi-VN') || '0'}
            icon={FaCalendarAlt}
            iconColor="bg-green-500"
            subtitle="Cuộc hẹn trong ngày"
          />
          <StatCard
            title="Tổng lịch hẹn"
            value={statData.totalAppointments?.toLocaleString('vi-VN') || '0'}
            icon={FaCheckCircle}
            iconColor="bg-emerald-500"
            subtitle={`Hoàn thành: ${statData.completedAppointments || 0}`}
          />
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Đang chờ xử lý"
            value={statData.pendingAppointments || 0}
            icon={FaClock}
            iconColor="bg-orange-500"
            changeType="neutral"
          />
          <StatCard
            title="Đã hoàn thành"
            value={statData.completedAppointments?.toLocaleString('vi-VN') || '0'}
            icon={FaCheckCircle}
            iconColor="bg-emerald-500"
            changeType="positive"
          />
          <StatCard
            title="Đã hủy"
            value={statData.cancelledAppointments || 0}
            icon={FaTimes}
            iconColor="bg-red-500"
            changeType="negative"
          />
        </div>

        {/* Charts and Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointments by Status */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Lịch hẹn theo trạng thái</h3>
            <div className="space-y-4">
              {Object.entries(statData.appointmentsByStatus || {}).map(([status, count]) => {
                const statusLabels = {
                  WAITING: 'Đang chờ',
                  CALLED: 'Đã gọi',
                  IN_PROGRESS: 'Đang khám',
                  DONE: 'Hoàn thành',
                  CANCELLED: 'Đã hủy',
                };
                const statusColors = {
                  WAITING: 'bg-yellow-500',
                  CALLED: 'bg-blue-500',
                  IN_PROGRESS: 'bg-purple-500',
                  DONE: 'bg-green-500',
                  CANCELLED: 'bg-red-500',
                };
                const total = Object.values(statData.appointmentsByStatus || {}).reduce(
                  (a, b) => a + (b || 0),
                  0
                );
                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

                return (
                  <div key={status}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {statusLabels[status] || status}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`${statusColors[status] || 'bg-gray-500'} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
                <FaPlus className="text-2xl mb-2 text-blue-600" />
                <div className="font-semibold text-gray-800">Thêm bác sĩ</div>
                <div className="text-xs text-gray-600 mt-1">Tạo tài khoản mới</div>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
                <FaCalendarAlt className="text-2xl mb-2 text-green-600" />
                <div className="font-semibold text-gray-800">Xem lịch hẹn</div>
                <div className="text-xs text-gray-600 mt-1">Quản lý appointments</div>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
                <FaUsers className="text-2xl mb-2 text-purple-600" />
                <div className="font-semibold text-gray-800">Quản lý người dùng</div>
                <div className="text-xs text-gray-600 mt-1">Xem danh sách</div>
              </button>
              <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors">
                <FaChartBar className="text-2xl mb-2 text-orange-600" />
                <div className="font-semibold text-gray-800">Báo cáo</div>
                <div className="text-xs text-gray-600 mt-1">Xem thống kê chi tiết</div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Hoạt động gần đây</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Xem tất cả →
            </button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaCalendarAlt className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      Lịch hẹn mới được tạo bởi bệnh nhân
                    </p>
                    <p className="text-sm text-gray-500">2 phút trước</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  Chờ xử lý
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
