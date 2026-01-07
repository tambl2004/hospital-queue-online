import { useState, useEffect, useCallback } from 'react';
import Layout from './Layout';
import { doctorService } from '../services/doctorService';
import { connectQueueSocket, joinQueueRoom, leaveQueueRoom, disconnectQueueSocket } from '../services/queueService';
import { useNavigate } from 'react-router-dom';
import {
  FaUserMd,
  FaHospital,
  FaDoorOpen,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaSync,
  FaUser,
  FaPhone,
  FaArrowRight,
  FaList,
} from 'react-icons/fa';

/**
 * DOCTOR DASHBOARD
 * Trang tổng quan lịch cá nhân cho bác sĩ
 * 
 * Blocks:
 * A - Thông tin cá nhân (Tên, Chuyên khoa, Phòng, Ngày)
 * B - Queue hôm nay cá nhân (Số hiện tại, Số tiếp theo, 5 bệnh nhân sắp tới)
 * C - Lịch hôm nay (Slot giờ, Số đã đặt/max, Trạng thái)
 */

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Pagination for schedule
  const [schedulePage, setSchedulePage] = useState(1);
  const schedulePerPage = 10;

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
    WAITING: 'bg-yellow-100 text-yellow-800',
    CALLED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    DONE: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    SKIPPED: 'bg-gray-100 text-gray-800'
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const response = await doctorService.getDashboardData();
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

  // Setup Socket.IO for realtime updates
  useEffect(() => {
    if (!dashboardData?.doctor_info?.doctor_id) return;

    const today = new Date().toISOString().split('T')[0];
    const doctorId = dashboardData.doctor_info.doctor_id;

    // Connect socket
    const disconnect = connectQueueSocket(
      // onStateUpdate - Update queue info when queue changes
      (newState) => {
        // Update queue_info from newState
        setDashboardData(prev => {
          if (!prev) return prev;
          
          // Convert queue state to queue_info format
          const queueInfo = {
            current: newState.current || null,
            next: newState.next || null,
            upcoming: [
              ...(newState.waitingList || []),
              ...(newState.calledList || []),
              ...(newState.inProgress ? [newState.inProgress] : [])
            ].sort((a, b) => a.queueNumber - b.queueNumber).slice(0, 10)
          };

          return {
            ...prev,
            queue_info: queueInfo
          };
        });
      },
      // onError
      (error) => {
        console.error('Socket error:', error);
      }
    );

    // Join queue room for this doctor
    setTimeout(() => {
      joinQueueRoom(doctorId, today);
    }, 100);

    return () => {
      leaveQueueRoom(doctorId, today);
      disconnectQueueSocket();
    };
  }, [dashboardData?.doctor_info?.doctor_id]);

  // Auto refresh every 30 seconds (fallback)
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

  // Handle finish appointment (if allowed)
  const handleFinishAppointment = async (appointmentId) => {
    if (!confirm('Bạn có chắc chắn muốn đánh dấu hoàn thành khám cho bệnh nhân này?')) {
      return;
    }

    setActionLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await doctorService.finishAppointment(appointmentId, dashboardData.doctor_info.doctor_id, today);
      // Refresh data
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể hoàn thành khám');
    } finally {
      setActionLoading(false);
    }
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

  const doctorInfo = dashboardData?.doctor_info || {};
  const queueInfo = dashboardData?.queue_info || {};
  const schedule = dashboardData?.schedule || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Bác sĩ</h1>
            <p className="text-gray-600 mt-1">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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

        {/* Block A: Thông tin cá nhân */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin cá nhân</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaUserMd className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tên bác sĩ</p>
                <p className="font-semibold text-gray-800">{doctorInfo.full_name || '--'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaHospital className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Chuyên khoa</p>
                <p className="font-semibold text-gray-800">{doctorInfo.department_name || '--'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaDoorOpen className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phòng khám</p>
                <p className="font-semibold text-gray-800">
                  {doctorInfo.room_name || '--'} {doctorInfo.room_code && `(${doctorInfo.room_code})`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FaCalendarAlt className="text-orange-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ngày hiện tại</p>
                <p className="font-semibold text-gray-800">
                  {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Block B: Queue hôm nay cá nhân */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Hàng đợi hôm nay</h2>
              <button
                onClick={() => navigate('/doctor/queue')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                Xem chi tiết <FaArrowRight className="text-xs" />
              </button>
            </div>
            
            {/* Số hiện tại và số tiếp theo */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Số hiện tại</p>
                <p className="text-2xl font-bold text-blue-600">
                  {queueInfo.current ? `#${queueInfo.current.queueNumber}` : '--'}
                </p>
                {queueInfo.current && (
                  <p className="text-sm text-gray-600 mt-1">{queueInfo.current.patientName}</p>
                )}
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Số tiếp theo</p>
                <p className="text-2xl font-bold text-green-600">
                  {queueInfo.next ? `#${queueInfo.next.queueNumber}` : '--'}
                </p>
                {queueInfo.next && (
                  <p className="text-sm text-gray-600 mt-1">{queueInfo.next.patientName}</p>
                )}
              </div>
            </div>

            {/* Danh sách 5 bệnh nhân sắp tới */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Bệnh nhân sắp tới</h3>
              {queueInfo.upcoming && queueInfo.upcoming.length > 0 ? (
                <div className="space-y-2">
                  {queueInfo.upcoming.slice(0, 5).map((patient, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        patient.status === 'IN_PROGRESS'
                          ? 'bg-purple-50 border-purple-200'
                          : patient.status === 'CALLED'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="font-bold text-blue-600">#{patient.queueNumber}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{patient.patientName}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <FaPhone className="text-xs" />
                              {patient.patientPhone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            statusColors[patient.status] || 'bg-gray-100 text-gray-800'
                          }`}>
                            {statusLabels[patient.status] || patient.status}
                          </span>
                          {patient.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleFinishAppointment(patient.appointmentId)}
                              disabled={actionLoading}
                              className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              Hoàn thành
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Không có bệnh nhân sắp tới
                </div>
              )}
            </div>
          </div>

          {/* Block C: Lịch hôm nay */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Lịch khám hôm nay</h2>
            {schedule.length > 0 ? (
              <>
                <div className="space-y-3">
                  {schedule
                    .slice((schedulePage - 1) * schedulePerPage, schedulePage * schedulePerPage)
                    .map((slot, index) => (
                    <div
                      key={slot.id || index}
                      className={`p-4 rounded-lg border ${
                        slot.current_count >= slot.max_patients
                          ? 'bg-red-50 border-red-200'
                          : slot.current_count > 0
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <FaClock className="text-gray-400" />
                          <span className="font-semibold text-gray-800">
                            {slot.time_slot} {slot.end_time && `- ${slot.end_time}`}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          slot.current_count >= slot.max_patients
                            ? 'bg-red-100 text-red-800'
                            : slot.current_count > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {slot.current_count >= slot.max_patients ? 'Đầy' : slot.current_count > 0 ? 'Có lịch' : 'Trống'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{slot.current_count}</span> / {slot.max_patients} bệnh nhân
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {schedule.length > schedulePerPage && (
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-700">
                      Hiển thị {((schedulePage - 1) * schedulePerPage) + 1} - {Math.min(schedulePage * schedulePerPage, schedule.length)} / {schedule.length} slot
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSchedulePage(prev => Math.max(1, prev - 1))}
                        disabled={schedulePage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Trước
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Trang {schedulePage} / {Math.ceil(schedule.length / schedulePerPage)}
                      </span>
                      <button
                        onClick={() => setSchedulePage(prev => Math.min(Math.ceil(schedule.length / schedulePerPage), prev + 1))}
                        disabled={schedulePage >= Math.ceil(schedule.length / schedulePerPage)}
                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Không có lịch khám hôm nay
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DoctorDashboard;

