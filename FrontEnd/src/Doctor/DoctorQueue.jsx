import { useState, useEffect, useCallback } from 'react';
import Layout from './Layout';
import { doctorService } from '../services/doctorService';
import { queueService, connectQueueSocket, joinQueueRoom, leaveQueueRoom, disconnectQueueSocket } from '../services/queueService';
import StatCard from '../components/Admin/StatCard';
import {
  FaSync,
  FaPlay,
  FaStop,
  FaStepForward,
  FaTimes,
  FaUndo,
  FaCheckCircle,
  FaClock,
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

  // ========== ACTIONS ==========
  const handleCallNext = async () => {
    if (!doctorInfo?.doctor_id) return;

    setActionLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await queueService.callNext(doctorInfo.doctor_id, today);
      // State sẽ được cập nhật qua socket
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gọi số tiếp theo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async (appointmentId) => {
    if (!doctorInfo?.doctor_id) return;

    setActionLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await queueService.startAppointment(appointmentId, doctorInfo.doctor_id, today);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể bắt đầu khám');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinish = async (appointmentId) => {
    if (!doctorInfo?.doctor_id) return;

    setActionLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await queueService.finishAppointment(appointmentId, doctorInfo.doctor_id, today);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể kết thúc khám');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async (appointmentId) => {
    if (!doctorInfo?.doctor_id) return;
    if (!confirm('Bạn có chắc chắn muốn bỏ qua số này?')) return;

    setActionLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await queueService.skipAppointment(appointmentId, doctorInfo.doctor_id, today);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể bỏ qua số');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecall = async (appointmentId) => {
    if (!doctorInfo?.doctor_id) return;

    setActionLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await queueService.recallAppointment(appointmentId, doctorInfo.doctor_id, today);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gọi lại số');
    } finally {
      setActionLoading(false);
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const getStatusBadge = (status) => {
    const badges = {
      WAITING: 'bg-yellow-100 text-yellow-800',
      CALLED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      DONE: 'bg-green-100 text-green-800',
      SKIPPED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      WAITING: 'Chờ gọi',
      CALLED: 'Đã gọi',
      IN_PROGRESS: 'Đang khám',
      DONE: 'Hoàn thành',
      SKIPPED: 'Bỏ qua',
      CANCELLED: 'Đã huỷ'
    };
    return texts[status] || status;
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
            <h1 className="text-3xl font-bold text-gray-800">Hàng đợi & Gọi số</h1>
            <p className="text-gray-600 mt-1">Theo dõi và quản lý hàng đợi hôm nay</p>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-sm text-gray-500">
                Cập nhật: {lastRefresh.toLocaleTimeString('vi-VN')}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={!doctorInfo?.doctor_id || loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
              Tải lại
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
            <StatCard
              title="Số hiện tại"
              value={queueState.current ? `#${queueState.current.queueNumber}` : '--'}
              subtitle={queueState.current ? queueState.current.patientName : 'Chưa có'}
              icon={FaPlay}
              iconColor={queueState.current ? 'bg-green-500' : 'bg-gray-400'}
            />

            <StatCard
              title="Số tiếp theo"
              value={queueState.next ? `#${queueState.next.queueNumber}` : '--'}
              subtitle={queueState.next ? queueState.next.patientName : 'Hết số'}
              icon={FaStepForward}
              iconColor={queueState.next ? 'bg-blue-500' : 'bg-gray-400'}
            />

            <StatCard
              title="Đang chờ"
              value={queueState.waitingCount || 0}
              subtitle="Bệnh nhân chờ gọi"
              icon={FaClock}
              iconColor="bg-yellow-500"
            />

            <StatCard
              title="Đã xong"
              value={queueState.doneCount || 0}
              subtitle="Khám hoàn thành"
              icon={FaCheckCircle}
              iconColor="bg-indigo-500"
            />
          </div>
        )}

        {/* Thao tác nhanh */}
        {queueState && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thao tác nhanh</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCallNext}
                disabled={!queueState.next || actionLoading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
              >
                <FaStepForward />
                Gọi số tiếp theo
              </button>

              {queueState.current && queueState.current.status === 'CALLED' && (
                <button
                  onClick={() => handleStart(queueState.current.appointmentId)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <FaPlay />
                  Bắt đầu khám
                </button>
              )}

              {queueState.current && queueState.current.status === 'CALLED' && (
                <button
                  onClick={() => handleSkip(queueState.current.appointmentId)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <FaTimes />
                  Bỏ qua
                </button>
              )}

              {queueState.inProgress && (
                <button
                  onClick={() => handleFinish(queueState.inProgress.appointmentId)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <FaStop />
                  Kết thúc khám
                </button>
              )}
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
                          ? 'bg-green-50'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold text-lg">#{item.queueNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-800">{item.patientName}</div>
                          <div className="text-sm text-gray-500">{item.patientPhone}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.appointmentTime || '--'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {item.status === 'WAITING' && (
                            <button
                              onClick={handleCallNext}
                              disabled={queueState.next?.appointmentId !== item.appointmentId || actionLoading}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              title="Gọi số này"
                            >
                              Gọi
                            </button>
                          )}
                          {item.status === 'CALLED' && (
                            <>
                              <button
                                onClick={() => handleStart(item.appointmentId)}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                title="Bắt đầu khám"
                              >
                                Bắt đầu
                              </button>
                              <button
                                onClick={() => handleSkip(item.appointmentId)}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                title="Bỏ qua"
                              >
                                Bỏ qua
                              </button>
                            </>
                          )}
                          {item.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleFinish(item.appointmentId)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              title="Kết thúc khám"
                            >
                              Kết thúc
                            </button>
                          )}
                          {item.status === 'SKIPPED' && (
                            <button
                              onClick={() => handleRecall(item.appointmentId)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              title="Gọi lại"
                            >
                              Gọi lại
                            </button>
                          )}
                        </div>
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

