import { useState, useEffect, useCallback } from 'react';
import Layout from './Layout';
import { doctorService } from '../services/doctorService';
import { queueService, connectQueueSocket, joinQueueRoom, leaveQueueRoom, disconnectQueueSocket } from '../services/queueService';
import {
  FaSync,
  FaUser,
  FaPhone,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';

/**
 * DOCTOR QUEUE PAGE
 * Trang theo dõi queue của bác sĩ với realtime updates
 * 
 * Features:
 * - Xem toàn bộ queue hôm nay
 * - Realtime updates khi Doctor gọi số
 * - Xem số hiện tại, số tiếp theo, danh sách đầy đủ
 * - Có thể đánh dấu "Hoàn thành khám" (nếu đang khám)
 */

const DoctorQueue = () => {
  const [queueState, setQueueState] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
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
    WAITING: 'bg-yellow-100 text-yellow-800',
    CALLED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    DONE: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    SKIPPED: 'bg-gray-100 text-gray-800'
  };

  // Fetch doctor info and queue state
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // Get doctor info first
      const dashboardResponse = await doctorService.getDashboardData();
      if (dashboardResponse.success) {
        setDoctorInfo(dashboardResponse.data.doctor_info);
        const doctorId = dashboardResponse.data.doctor_info.doctor_id;
        const today = new Date().toISOString().split('T')[0];

        // Get queue state
        const queueResponse = await queueService.getQueueState(doctorId, today);
        if (queueResponse.success) {
          setQueueState(queueResponse.data);
          setLastRefresh(new Date());
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup Socket.IO for realtime updates
  useEffect(() => {
    if (!doctorInfo?.doctor_id) return;

    const today = new Date().toISOString().split('T')[0];
    const doctorId = doctorInfo.doctor_id;

    // Connect socket
    const disconnect = connectQueueSocket(
      // onStateUpdate
      (newState) => {
        setQueueState(newState);
        setLastRefresh(new Date());
      },
      // onError
      (error) => {
        console.error('Socket error:', error);
      }
    );

    // Join queue room
    setTimeout(() => {
      joinQueueRoom(doctorId, today);
    }, 100);

    return () => {
      leaveQueueRoom(doctorId, today);
      disconnectQueueSocket();
    };
  }, [doctorInfo?.doctor_id]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  // Handle finish appointment
  const handleFinishAppointment = async (appointmentId) => {
    if (!confirm('Bạn có chắc chắn muốn đánh dấu hoàn thành khám cho bệnh nhân này?')) {
      return;
    }

    setActionLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await doctorService.finishAppointment(appointmentId, doctorInfo.doctor_id, today);
      // Refresh data
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể hoàn thành khám');
    } finally {
      setActionLoading(false);
    }
  };

  // Combine all queue items
  const getAllQueueItems = () => {
    if (!queueState) return [];
    
    const all = [];
    if (queueState.waitingList) all.push(...queueState.waitingList);
    if (queueState.calledList) all.push(...queueState.calledList);
    if (queueState.inProgress) all.push(queueState.inProgress);
    
    // Sort by queue number
    return all.sort((a, b) => a.queueNumber - b.queueNumber);
  };

  if (loading && !queueState) {
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Theo dõi hàng chờ</h1>
           
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaExclamationCircle />
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {queueState && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaUser className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số hiện tại</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {queueState.current ? `#${queueState.current.queueNumber}` : '--'}
                  </p>
                </div>
              </div>
              {queueState.current && (
                <p className="text-sm text-gray-600 mt-2">{queueState.current.patientName}</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaClock className="text-green-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số tiếp theo</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {queueState.next ? `#${queueState.next.queueNumber}` : '--'}
                  </p>
                </div>
              </div>
              {queueState.next && (
                <p className="text-sm text-gray-600 mt-2">{queueState.next.patientName}</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FaClock className="text-yellow-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Đang chờ</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {queueState.waitingCount || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaCheckCircle className="text-green-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Đã xong</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {queueState.doneCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Queue List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Danh sách hàng đợi</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : getAllQueueItems().length === 0 ? (
            <div className="text-center py-8 text-gray-500">Không có bệnh nhân nào trong hàng đợi hôm nay</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Số thứ tự</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Bệnh nhân</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Giờ khám</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Trạng thái</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {getAllQueueItems().map((item) => (
                    <tr
                      key={item.appointmentId}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        queueState.current?.appointmentId === item.appointmentId
                          ? 'bg-blue-50'
                          : queueState.inProgress?.appointmentId === item.appointmentId
                          ? 'bg-purple-50'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold text-lg">#{item.queueNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-800">{item.patientName}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <FaPhone className="text-xs" />
                            {item.patientPhone}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.appointmentTime || '--'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusColors[item.status] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {statusLabels[item.status] || item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleFinishAppointment(item.appointmentId)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            title="Hoàn thành khám"
                          >
                            Hoàn thành
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DoctorQueue;

