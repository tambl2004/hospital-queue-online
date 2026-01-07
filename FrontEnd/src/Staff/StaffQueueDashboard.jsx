import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FaPlay,
  FaStop,
  FaStepForward,
  FaUndo,
  FaTimes,
  FaSync,
  FaCheckCircle,
  FaClock,
  FaUserMd,
  FaCalendarAlt,
  FaExclamationCircle
} from 'react-icons/fa';
import Layout from './Layout';
import { queueService, connectQueueSocket, joinQueueRoom, leaveQueueRoom, disconnectQueueSocket } from '../services/queueService';
import { adminService } from '../services/adminService';
import StatCard from '../components/Admin/StatCard';

/**
 * STAFF QUEUE DASHBOARD
 * Trang quản lý hàng đợi & gọi số realtime cho nhân viên
 * 
 * Features:
 * - Chọn bác sĩ + ngày để xem queue
 * - Xem số hiện tại, số tiếp theo, thống kê
 * - Gọi số tiếp theo, bắt đầu, kết thúc, bỏ qua, gọi lại
 * - Realtime updates qua Socket.IO
 */

const StaffQueueDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Queue context - lấy từ URL params nếu có
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(searchParams.get('doctor_id') || '');
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);

  // Queue state
  const [queueState, setQueueState] = useState(null);

  // Data cho dropdowns
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);

  // ========== EFFECTS ==========
  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [selectedDepartmentId]);

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      loadQueueState();
      setupSocket();
      
      // Update URL params
      const newParams = new URLSearchParams();
      newParams.set('doctor_id', selectedDoctorId);
      newParams.set('date', selectedDate);
      setSearchParams(newParams);
    } else {
      disconnectQueueSocket();
      setQueueState(null);
    }

    return () => {
      disconnectQueueSocket();
    };
  }, [selectedDoctorId, selectedDate]);

  // ========== LOAD DATA ==========
  const loadDepartments = async () => {
    try {
      const response = await adminService.getDepartments({ limit: 1000 });
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const loadDoctors = async () => {
    try {
      const params = { limit: 1000 };
      if (selectedDepartmentId) {
        params.department_id = selectedDepartmentId;
      }
      const response = await adminService.getDoctors(params);
      if (response.success) {
        setDoctors(response.data || []);
      }
    } catch (err) {
      console.error('Error loading doctors:', err);
      setDoctors([]);
    }
  };

  const loadQueueState = async () => {
    if (!selectedDoctorId || !selectedDate) return;

    setLoading(true);
    setError(null);

    try {
      const response = await queueService.getQueueState(selectedDoctorId, selectedDate);
      if (response.success) {
        setQueueState(response.data);
      }
    } catch (err) {
      console.error('Error loading queue state:', err);
      setError(err.response?.data?.message || 'Không thể tải trạng thái hàng đợi');
    } finally {
      setLoading(false);
    }
  };

  // ========== SOCKET SETUP ==========
  const setupSocket = useCallback(() => {
    if (!selectedDoctorId || !selectedDate) return;

    const disconnect = connectQueueSocket(
      // onStateUpdate
      (newState) => {
        setQueueState(newState);
      },
      // onError
      (error) => {
        console.error('Socket error:', error);
        setError(error.message || 'Lỗi kết nối realtime');
      }
    );

    // Join room sau khi kết nối
    setTimeout(() => {
      joinQueueRoom(selectedDoctorId, selectedDate);
    }, 100);

    return disconnect;
  }, [selectedDoctorId, selectedDate]);

  // ========== ACTIONS ==========
  const handleCallNext = async () => {
    if (!selectedDoctorId || !selectedDate) return;

    setActionLoading(true);
    try {
      await queueService.callNext(selectedDoctorId, selectedDate);
      // State sẽ được cập nhật qua socket
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gọi số tiếp theo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async (appointmentId) => {
    if (!selectedDoctorId || !selectedDate) return;

    setActionLoading(true);
    try {
      await queueService.startAppointment(appointmentId, selectedDoctorId, selectedDate);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể bắt đầu khám');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinish = async (appointmentId) => {
    if (!selectedDoctorId || !selectedDate) return;

    setActionLoading(true);
    try {
      await queueService.finishAppointment(appointmentId, selectedDoctorId, selectedDate);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể kết thúc khám');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async (appointmentId) => {
    if (!selectedDoctorId || !selectedDate) return;
    if (!confirm('Bạn có chắc chắn muốn bỏ qua số này?')) return;

    setActionLoading(true);
    try {
      await queueService.skipAppointment(appointmentId, selectedDoctorId, selectedDate);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể bỏ qua số');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecall = async (appointmentId) => {
    if (!selectedDoctorId || !selectedDate) return;

    setActionLoading(true);
    try {
      await queueService.recallAppointment(appointmentId, selectedDoctorId, selectedDate);
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
      IN_PROGRESS: 'bg-green-100 text-green-800',
      DONE: 'bg-gray-100 text-gray-800',
      SKIPPED: 'bg-orange-100 text-orange-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      WAITING: 'Chờ gọi',
      CALLED: 'Đã gọi',
      IN_PROGRESS: 'Đang khám',
      DONE: 'Xong',
      SKIPPED: 'Bỏ qua',
      CANCELLED: 'Hủy'
    };
    return texts[status] || status;
  };

  // Combine all queue items for table
  const getAllQueueItems = () => {
    if (!queueState) return [];
    
    const all = [];
    if (queueState.waitingList) all.push(...queueState.waitingList);
    if (queueState.calledList) all.push(...queueState.calledList);
    if (queueState.inProgress) all.push(queueState.inProgress);
    
    // Sort by queue number
    return all.sort((a, b) => a.queueNumber - b.queueNumber);
  };

  const selectedDoctor = doctors.find(d => d.id === parseInt(selectedDoctorId));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gọi số</h1>
            <p className="text-gray-600 mt-1">Vận hành khám theo bác sĩ và ngày</p>
          </div>
          <button
            onClick={loadQueueState}
            disabled={!selectedDoctorId || !selectedDate || loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Tải lại
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaExclamationCircle />
            {error}
          </div>
        )}

        {/* Khu A: Bộ chọn ngữ cảnh queue */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Chọn ngữ cảnh hàng đợi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chuyên khoa (Tùy chọn)
              </label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => {
                  setSelectedDepartmentId(e.target.value);
                  setSelectedDoctorId(''); // Reset doctor when department changes
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tất cả chuyên khoa</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Doctor (Required) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bác sĩ <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Chọn bác sĩ</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name} {doctor.department?.name && `- ${doctor.department.name}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Khu B: Summary Cards - Chỉ hiển thị khi đã chọn doctor + date */}
        {selectedDoctorId && selectedDate && queueState && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Card 1: Số hiện tại */}
              <StatCard
                title="Số hiện tại"
                value={queueState.current ? `#${queueState.current.queueNumber}` : '--'}
                subtitle={queueState.current ? queueState.current.patientName : 'Chưa có'}
                icon={FaPlay}
                iconColor={queueState.current ? 'bg-green-500' : 'bg-gray-400'}
              />

              {/* Card 2: Số tiếp theo */}
              <StatCard
                title="Số tiếp theo"
                value={queueState.next ? `#${queueState.next.queueNumber}` : '--'}
                subtitle={queueState.next ? queueState.next.patientName : 'Hết số'}
                icon={FaStepForward}
                iconColor={queueState.next ? 'bg-blue-500' : 'bg-gray-400'}
              />

              {/* Card 3: Đang chờ */}
              <StatCard
                title="Đang chờ"
                value={queueState.waitingCount || 0}
                subtitle="Bệnh nhân chờ gọi"
                icon={FaClock}
                iconColor="bg-yellow-500"
              />

              {/* Card 4: Đã xong */}
              <StatCard
                title="Đã xong"
                value={queueState.doneCount || 0}
                subtitle="Khám hoàn thành"
                icon={FaCheckCircle}
                iconColor="bg-indigo-500"
              />
            </div>

            {/* Khu D: Panel thao tác nhanh */}
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

            {/* Khu C: Danh sách hàng đợi */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Danh sách hàng đợi</h2>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : getAllQueueItems().length === 0 ? (
                <div className="text-center py-8 text-gray-500">Không có số nào trong hàng đợi</div>
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
          </>
        )}

        {/* Empty state */}
        {selectedDoctorId && selectedDate && !loading && !queueState && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FaCalendarAlt className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">Chưa có dữ liệu hàng đợi cho bác sĩ và ngày đã chọn</p>
          </div>
        )}

        {/* Initial state */}
        {(!selectedDoctorId || !selectedDate) && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FaUserMd className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">Vui lòng chọn bác sĩ và ngày để xem hàng đợi</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StaffQueueDashboard;

