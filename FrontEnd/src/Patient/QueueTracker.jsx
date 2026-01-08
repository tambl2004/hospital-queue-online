import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';
import { connectQueueSocket, joinQueueRoom, leaveQueueRoom, disconnectQueueSocket } from '../services/queueService';
import QueueContextHeader from '../components/Patient/QueueContextHeader';
import MyQueueNumberCard from '../components/Patient/MyQueueNumberCard';
import CurrentQueueCard from '../components/Patient/CurrentQueueCard';
import QueueEstimateCard from '../components/Patient/QueueEstimateCard';
import QueueNearbyList from '../components/Patient/QueueNearbyList';
import { FaHome, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

/**
 * QueueTracker - Trang theo dõi số thứ tự realtime cho Patient
 */
function QueueTracker() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  
  const [appointment, setAppointment] = useState(null);
  const [queueState, setQueueState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  
  const socketDisconnectRef = useRef(null);
  const currentRoomRef = useRef(null);

  useEffect(() => {
    if (appointmentId) {
      initializeTracking();
    } else {
      setError('Không tìm thấy thông tin lịch khám');
      setLoading(false);
    }

    // Cleanup khi unmount
    return () => {
      cleanup();
    };
  }, [appointmentId]);

  const cleanup = () => {
    if (currentRoomRef.current) {
      const { doctorId, date } = currentRoomRef.current;
      leaveQueueRoom(doctorId, date);
      currentRoomRef.current = null;
    }
    
    if (socketDisconnectRef.current) {
      socketDisconnectRef.current();
      socketDisconnectRef.current = null;
    }
    
    disconnectQueueSocket();
  };

  const initializeTracking = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Lấy thông tin appointment
      const appointmentResponse = await patientService.getAppointmentById(appointmentId);
      
      if (!appointmentResponse.success || !appointmentResponse.data) {
        setError('Không tìm thấy thông tin lịch khám');
        setLoading(false);
        return;
      }

      const appt = appointmentResponse.data;
      setAppointment(appt);

      // Kiểm tra appointment có bị hủy không
      if (appt.status === 'CANCELLED') {
        setError('Lịch khám này đã bị hủy');
        setLoading(false);
        return;
      }

      // Kiểm tra appointment có queue_number không
      if (!appt.queue_number) {
        setError('Lịch khám này chưa có số thứ tự');
        setLoading(false);
        return;
      }

      // 2. Kết nối Socket.IO và join room
      const doctorId = appt.doctor_id;
      const date = appt.appointment_date;

      if (!doctorId || !date) {
        setError('Thông tin lịch khám không đầy đủ');
        setLoading(false);
        return;
      }

      // Kết nối socket
      const disconnect = connectQueueSocket(
        (data) => {
          handleQueueUpdate(data);
          setSocketConnected(true);
        },
        handleSocketError
      );

      socketDisconnectRef.current = disconnect;
      currentRoomRef.current = { doctorId, date, appointmentId };

      // Join room sau khi socket connected (thử nhiều lần nếu cần)
      const tryJoinRoom = () => {
        try {
          joinQueueRoom(doctorId, date, appointmentId);
          setSocketConnected(true);
        } catch (err) {
          console.warn('[QueueTracker] Failed to join room, retrying...', err);
          setTimeout(tryJoinRoom, 1000);
        }
      };

      // Thử join ngay, nếu socket chưa sẵn sàng thì retry
      setTimeout(tryJoinRoom, 300);

      // 3. Lấy queue state ban đầu từ API (fallback)
      fetchQueueState(doctorId, date);

      setLoading(false);
    } catch (err) {
      console.error('Error initializing tracking:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin theo dõi');
      setLoading(false);
    }
  };

  const fetchQueueState = async (doctorId, date) => {
    try {
      const { queueService } = await import('../services/queueService');
      // Truyền appointment_id cho PATIENT
      const response = await queueService.getQueueState(doctorId, date, appointmentId);
      
      if (response.success) {
        processQueueState(response.data);
      }
    } catch (err) {
      console.error('Error fetching queue state:', err);
      // Không set error vì có thể dùng socket
    }
  };

  const handleQueueUpdate = (data) => {
    console.log('[QueueTracker] Received queue update:', data);
    
    if (data && data.context) {
      processQueueState(data);
    }
  };

  const handleSocketError = (error) => {
    console.error('[QueueTracker] Socket error:', error);
    setSocketConnected(false);
    // Không set error để user vẫn có thể xem thông tin cơ bản
  };

  const processQueueState = (queueData) => {
    setQueueState(queueData);
    setSocketConnected(true);

    // Cập nhật status của appointment nếu có trong queue
    if (queueData.appointments || queueData.waitingList || queueData.calledList) {
      const allAppointments = [
        ...(queueData.waitingList || []),
        ...(queueData.calledList || []),
        ...(queueData.appointments || []),
      ];

      const myAppointment = allAppointments.find(
        (apt) => apt.appointmentId === parseInt(appointmentId)
      );

      if (myAppointment && appointment) {
        setAppointment((prev) => ({
          ...prev,
          status: myAppointment.status,
        }));
      }
    }
  };

  // Tính toán số lượt trước bệnh nhân
  const calculateAheadCount = () => {
    if (!queueState || !appointment) return 0;

    const myQueueNumber = appointment.queue_number;
    if (!myQueueNumber) return 0;

    // Lấy tất cả appointments đang chờ (WAITING, CALLED, IN_PROGRESS)
    const allWaiting = [
      ...(queueState.waitingList || []),
      ...(queueState.calledList || []),
      ...(queueState.appointments || []),
    ].filter(
      (apt) =>
        apt.queueNumber < myQueueNumber &&
        ['WAITING', 'CALLED', 'IN_PROGRESS'].includes(apt.status)
    );

    return allWaiting.length;
  };

  // Lấy danh sách queue để hiển thị nearby
  const getQueueList = () => {
    if (!queueState) return [];

    const allAppointments = [
      ...(queueState.waitingList || []),
      ...(queueState.calledList || []),
      ...(queueState.appointments || []),
    ];

    // Sắp xếp theo queue_number
    return allAppointments.sort((a, b) => a.queueNumber - b.queueNumber);
  };

  // Tính ước lượng thời gian (giả sử mỗi lượt khám ~15 phút)
  const calculateEstimatedMinutes = () => {
    const aheadCount = calculateAheadCount();
    return aheadCount * 15; // 15 phút mỗi lượt
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
          <p className="text-red-600 mb-4 text-lg font-semibold">
            {error || 'Không tìm thấy thông tin lịch khám'}
          </p>
          <Link
            to="/patient/appointments"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại lịch đã đặt
          </Link>
        </div>
      </div>
    );
  }

  const aheadCount = calculateAheadCount();
  const estimatedMinutes = calculateEstimatedMinutes();
  const queueList = getQueueList();
  const currentQueue = queueState?.current || queueState?.inProgress;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Khu A: Thông tin lịch đang theo dõi */}
      <div className="mb-6">
        <QueueContextHeader appointment={appointment} />
      </div>

      {/* Socket connection status */}
      <div className="mb-4 flex items-center justify-end gap-2 text-sm">
        {socketConnected ? (
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Đang kết nối realtime</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-600">
            <FaSpinner className="animate-spin" />
            <span>Đang kết nối...</span>
          </div>
        )}
      </div>

      {/* Khu B & C: Số của tôi và Số hiện tại */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <MyQueueNumberCard
          queueNumber={appointment.queue_number}
          status={appointment.status}
        />
        <CurrentQueueCard currentQueue={currentQueue} />
      </div>

      {/* Khu D: Ước lượng */}
      <div className="mb-6">
        <QueueEstimateCard
          aheadCount={aheadCount}
          estimatedMinutes={estimatedMinutes}
        />
      </div>

      {/* Khu E: Danh sách số gần nhất */}
      <div className="mb-6">
        <QueueNearbyList
          queueList={queueList}
          myQueueNumber={appointment.queue_number}
          myAppointmentId={parseInt(appointmentId)}
        />
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Lưu ý:</strong> Vui lòng có mặt tại bệnh viện trước giờ khám 15 phút. 
          Khi đến lượt, bạn sẽ được gọi vào phòng khám. Số thứ tự sẽ được cập nhật tự động theo thời gian thực.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 justify-center">
        <Link
          to="/patient/appointments"
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
        >
          <FaHome />
          Quay lại lịch đã đặt
        </Link>
      </div>
    </div>
  );
}

export default QueueTracker;
