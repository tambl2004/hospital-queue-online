import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';
import { connectQueueSocket, joinQueueRoom, leaveQueueRoom, disconnectQueueSocket } from '../services/queueService';
import QueueContextHeader from '../components/Patient/QueueContextHeader';
import MyQueueNumberCard from '../components/Patient/MyQueueNumberCard';
import CurrentQueueCard from '../components/Patient/CurrentQueueCard';
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
  const [roomInfo, setRoomInfo] = useState(null); // doctorId + date để fallback polling
  
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
      // socketDisconnectRef.current giờ là object { disconnect, onReconnect, isConnected }
      if (typeof socketDisconnectRef.current === 'function') {
        socketDisconnectRef.current();
      } else if (socketDisconnectRef.current?.disconnect) {
        socketDisconnectRef.current.disconnect();
      }
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

      let appt = appointmentResponse.data;

      // Enrich appointment với avatar bác sĩ
      appt = await enrichAppointmentWithAvatar(appt);

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
      const doctorId = appt.doctor_id || appt.doctor?.id;
      // Sử dụng queue_date nếu có (trùng hoàn toàn với queue_numbers.queue_date trên backend),
      // fallback sang appointment_date nếu chưa có
      let date = appt.queue_date || appt.appointment_date;
      if (date) {
        // Nếu date là ISO datetime string, extract chỉ phần date
        if (date.includes('T')) {
          date = date.split('T')[0];
        } else if (date.includes(' ')) {
          date = date.split(' ')[0];
        }
        // Đảm bảo format là YYYY-MM-DD
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          date = dateObj.toISOString().split('T')[0];
        }
      }
      
      // Debug: log date để kiểm tra
      console.log('[QueueTracker] Initializing with date:', date);
      console.log('[QueueTracker] Appointment queue_date:', appt.queue_date);
      console.log('[QueueTracker] Appointment appointment_date:', appt.appointment_date);
      console.log('[QueueTracker] Doctor ID:', doctorId);

      if (!doctorId || !date) {
        setError('Thông tin lịch khám không đầy đủ');
        setLoading(false);
        return;
      }

      // Kết nối socket
      const socketControl = connectQueueSocket(
        (data) => {
          handleQueueUpdate(data);
          setSocketConnected(true);
        },
        handleSocketError
      );

      socketDisconnectRef.current = socketControl.disconnect;
      currentRoomRef.current = { doctorId, date, appointmentId };
      setRoomInfo({ doctorId, date });

      // Đăng ký callback khi socket reconnect để tự động join lại room
      socketControl.onReconnect(() => {
        console.log('[QueueTracker] Socket reconnected, rejoining room...');
        const { doctorId: roomDoctorId, date: roomDate, appointmentId: roomAppointmentId } = currentRoomRef.current || {};
        if (roomDoctorId && roomDate) {
          setTimeout(() => {
            joinQueueRoom(roomDoctorId, roomDate, roomAppointmentId);
            fetchQueueState(roomDoctorId, roomDate);
          }, 500);
        }
      });

      // Join room sau khi socket connected (thử nhiều lần nếu cần)
      const tryJoinRoom = () => {
        try {
          if (socketControl.isConnected()) {
            joinQueueRoom(doctorId, date, appointmentId);
            setSocketConnected(true);
          } else {
            // Socket chưa connected, retry sau
            setTimeout(tryJoinRoom, 1000);
          }
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

  // Helper function: Enrich appointment với avatar bác sĩ
  const enrichAppointmentWithAvatar = async (appt) => {
    if (!appt) return appt;
    
    // Nếu đã có avatar_url rồi thì không cần fetch lại
    if (appt.doctor?.avatar_url) {
      return appt;
    }
    
    try {
      const doctorIdForAvatar = appt.doctor?.id || appt.doctor_id;
      if (doctorIdForAvatar) {
        const doctorDetailRes = await patientService.getDoctorById(doctorIdForAvatar);
        if (doctorDetailRes.success && doctorDetailRes.data?.avatar_url) {
          return {
            ...appt,
            doctor: {
              ...(appt.doctor || {}),
              id: doctorIdForAvatar,
              avatar_url: doctorDetailRes.data.avatar_url,
            },
          };
        }
      }
    } catch (avatarErr) {
      console.warn('[QueueTracker] Không lấy được avatar bác sĩ:', avatarErr);
    }
    
    return appt;
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

  // Reconnect callback đã được đăng ký trong initializeTracking
  // Không cần polling nữa vì socket tự động reconnect và callback sẽ handle

  const handleQueueUpdate = (data) => {
    console.log('[QueueTracker] Received queue update:', data);
    console.log('[QueueTracker] Current appointmentId:', appointmentId);
    
    if (!data || !data.context) {
      console.warn('[QueueTracker] Received invalid queue update data:', data);
      return;
    }

    // Debug: log context để kiểm tra date/doctorId
    console.log('[QueueTracker] Queue context:', data.context);
    console.log('[QueueTracker] Expected room info:', currentRoomRef.current);
    
    if (currentRoomRef.current && data.context) {
      const expectedDate = currentRoomRef.current.date;
      const receivedDate = data.context.date;
      if (expectedDate !== receivedDate) {
        console.warn(`[QueueTracker] Date mismatch! Expected: ${expectedDate}, Received: ${receivedDate}`);
      }
    }

    // Luôn reload appointment từ API để lấy trạng thái mới nhất (CALLED / IN_PROGRESS / DONE...)
    if (appointmentId) {
      patientService
        .getAppointmentById(appointmentId)
        .then(async (response) => {
          if (response.success && response.data) {
            console.log('[QueueTracker] Reloaded appointment from API:', response.data);
            // Enrich với avatar bác sĩ trước khi set
            const enrichedAppt = await enrichAppointmentWithAvatar(response.data);
            setAppointment(enrichedAppt);
          } else {
            console.warn('[QueueTracker] Failed to reload appointment from API, keeping old state');
          }
        })
        .catch((err) => {
          console.error('[QueueTracker] Failed to reload appointment:', err);
        })
        .finally(() => {
          // Dù API thành công hay thất bại, vẫn process queue state để cập nhật currentQueue / danh sách
          processQueueState(data);
        });
    } else {
      // Không có appointmentId (trường hợp hiếm), chỉ process queue state
      processQueueState(data);
    }
  };

  const handleSocketError = (error) => {
    console.error('[QueueTracker] Socket error:', error);
    setSocketConnected(false);
    // Không set error để user vẫn có thể xem thông tin cơ bản
  };

  const processQueueState = (queueData) => {
    console.log('[QueueTracker] Processing queue state:', queueData);
    setQueueState(queueData);
    setSocketConnected(true);

    // Cập nhật status của appointment từ queueData
    // Có thể lấy từ current, inProgress, hoặc từ danh sách appointments
    let myAppointment = null;

    // Ưu tiên: kiểm tra current/inProgress trước
    if (queueData.current && queueData.current.appointmentId === parseInt(appointmentId)) {
      myAppointment = queueData.current;
      console.log('[QueueTracker] Found my appointment in current:', myAppointment);
    } else if (queueData.inProgress && queueData.inProgress.appointmentId === parseInt(appointmentId)) {
      myAppointment = queueData.inProgress;
      console.log('[QueueTracker] Found my appointment in inProgress:', myAppointment);
    } else if (queueData.appointments || queueData.waitingList || queueData.calledList) {
      // Tìm trong danh sách appointments
      const allAppointments = [
        ...(queueData.waitingList || []),
        ...(queueData.calledList || []),
        ...(queueData.appointments || []),
      ];

      console.log('[QueueTracker] All appointments in queue:', allAppointments);
      console.log('[QueueTracker] Looking for appointmentId:', appointmentId);

      myAppointment = allAppointments.find(
        (apt) => apt.appointmentId === parseInt(appointmentId)
      );

      console.log('[QueueTracker] Found my appointment in list:', myAppointment);
    }

    // Nếu tìm thấy appointment trong queue, cập nhật status
    if (myAppointment) {
      const newStatus = myAppointment.status;
      console.log('[QueueTracker] Updating appointment status to', newStatus);
      
      // Dùng functional update để không phụ thuộc vào appointment state hiện tại
      setAppointment((prev) => {
        if (!prev) {
          console.warn('[QueueTracker] Appointment state is null, cannot update status');
          // Nếu appointment null, thử reload từ API
          if (appointmentId) {
            console.log('[QueueTracker] Attempting to reload appointment from API...');
            patientService.getAppointmentById(appointmentId).then((response) => {
              if (response.success && response.data) {
                setAppointment({
                  ...response.data,
                  status: newStatus, // Update với status mới từ queue
                });
              }
            }).catch((err) => {
              console.error('[QueueTracker] Failed to reload appointment:', err);
            });
          }
          return prev;
        }
        
        if (prev.status !== newStatus) {
          console.log('[QueueTracker] Status changed from', prev.status, 'to', newStatus);
          return {
            ...prev,
            status: newStatus,
          };
        } else {
          console.log('[QueueTracker] Status unchanged, skipping update');
          return prev;
        }
      });
    } else {
      console.warn('[QueueTracker] My appointment not found in queue data');
      // Nếu queueData có current/inProgress nhưng không phải appointment của mình,
      // vẫn cập nhật queueState để hiển thị số đang gọi/khám
    }
  };

  // Lấy danh sách queue để hiển thị nearby
  const getQueueList = () => {
    if (queueState) {
      const allAppointments = [
        ...(queueState.waitingList || []),
        ...(queueState.calledList || []),
        ...(queueState.appointments || []),
      ];

      if (allAppointments.length > 0) {
        // Sắp xếp theo queue_number
        return allAppointments.sort((a, b) => a.queueNumber - b.queueNumber);
      }
    }

    // Fallback: nếu queueState trống nhưng appointment có queue_number
    if (appointment?.queue_number) {
      return [
        {
          appointmentId: appointment.id,
          queueNumber: appointment.queue_number,
          status: appointment.status,
        },
      ];
    }

    return [];
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

  const queueList = getQueueList();
  
  // Lấy currentQueue - ưu tiên inProgress, sau đó current
  // Nếu appointment của bệnh nhân đang IN_PROGRESS, hiển thị số của họ
  let currentQueue = queueState?.inProgress || queueState?.current;

  // Fallback nếu backend trả queue_number thay vì queueNumber
  if (currentQueue && !currentQueue.queueNumber && currentQueue.queue_number) {
    currentQueue = {
      ...currentQueue,
      queueNumber: currentQueue.queue_number,
    };
  }
  
  // Nếu appointment của bệnh nhân đang IN_PROGRESS và là current, hiển thị số của họ
  if (appointment?.status === 'IN_PROGRESS' && appointment?.queue_number) {
    const myAppointmentInQueue = queueList.find(
      (apt) => apt.appointmentId === parseInt(appointmentId) && apt.status === 'IN_PROGRESS'
    );
    if (myAppointmentInQueue) {
      currentQueue = myAppointmentInQueue;
    }
  }

  // Fallback cuối: nếu không tìm thấy trong queueState nhưng status đang CALLED/IN_PROGRESS,
  // thì vẫn hiển thị số của chính bệnh nhân là current
  if (
    !currentQueue &&
    appointment?.queue_number &&
    ['CALLED', 'IN_PROGRESS'].includes(appointment.status)
  ) {
    currentQueue = {
      appointmentId: appointment.id,
      queueNumber: appointment.queue_number,
      status: appointment.status,
      patientName: appointment.patient?.full_name || appointment.patient_name || undefined,
    };
  }

  // Debug log để kiểm tra
  console.log('[QueueTracker] Final currentQueue:', currentQueue);
  console.log('[QueueTracker] Final appointment status:', appointment?.status);
  console.log('[QueueTracker] Final queueState:', queueState);

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

      {/* Khu B & C: Số của tôi và Số đang gọi/đang khám */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <MyQueueNumberCard
          queueNumber={appointment.queue_number}
          status={appointment.status}
        />
        <CurrentQueueCard currentQueue={currentQueue} />
      </div>

      {/* Khu D: Danh sách số gần nhất */}
      <div className="mb-5">
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
