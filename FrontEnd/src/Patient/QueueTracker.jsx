import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { patientService } from '../services/patientService';
import { queueService } from '../services/queueService';
import { FaHome, FaClock, FaUserMd, FaCheckCircle, FaSpinner, FaTimes } from 'react-icons/fa';

function QueueTracker() {
  const { appointmentId } = useParams();
  
  const [appointment, setAppointment] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
      fetchQueueStatus();
      // Polling mỗi 5 giây để cập nhật realtime
      const interval = setInterval(() => {
        fetchQueueStatus();
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setError('Không tìm thấy thông tin lịch khám');
      setLoading(false);
    }
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const response = await patientService.getAppointmentById(appointmentId);
      if (response.success) {
        setAppointment(response.data);
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      setError('Không thể tải thông tin lịch khám');
    }
  };

  const fetchQueueStatus = async () => {
    try {
      // Lấy thông tin queue từ appointment
      const response = await patientService.getAppointmentById(appointmentId);
      if (response.success && response.data) {
        const appt = response.data;
        setAppointment(appt);
        
        // Lấy thông tin queue hiện tại của bác sĩ
        if (appt.doctor_id && appt.appointment_date) {
          try {
            const queueResponse = await queueService.getQueueState(
              appt.doctor_id,
              appt.appointment_date
            );
            if (queueResponse.success) {
              const queues = queueResponse.data?.appointments || [];
              const currentQueue = queues.find((q) => q.appointment_id === parseInt(appointmentId));
              setQueueStatus({
                currentNumber: currentQueue?.queue_number || appt.queue_number,
                currentServing: queues.find((q) => q.status === 'IN_PROGRESS')?.queue_number || null,
                totalWaiting: queues.filter((q) => q.status === 'WAITING').length,
                position: currentQueue
                  ? queues
                      .filter((q) => q.status === 'WAITING')
                      .findIndex((q) => q.queue_number === currentQueue.queue_number) + 1
                  : null,
              });
            }
          } catch (queueError) {
            // Nếu không lấy được queue state, vẫn hiển thị thông tin từ appointment
            setQueueStatus({
              currentNumber: appt.queue_number,
              currentServing: null,
              totalWaiting: 0,
              position: null,
            });
          }
        } else {
          setQueueStatus({
            currentNumber: appt.queue_number,
            currentServing: null,
            totalWaiting: 0,
            position: null,
          });
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching queue status:', error);
      setError('Không thể tải thông tin số thứ tự');
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!appointment || !queueStatus) return '';
    
    const status = appointment.status;
    if (status === 'DONE') {
      return { text: 'Đã hoàn thành khám', color: 'text-green-600', icon: FaCheckCircle };
    } else if (status === 'IN_PROGRESS') {
      return { text: 'Đang được khám', color: 'text-blue-600', icon: FaUserMd };
    } else if (status === 'CALLED') {
      return { text: 'Đã được gọi, vui lòng vào phòng khám', color: 'text-purple-600', icon: FaClock };
    } else if (status === 'WAITING') {
      if (queueStatus.position && queueStatus.position > 0) {
        return {
          text: `Còn ${queueStatus.position} người trước bạn`,
          color: 'text-yellow-600',
          icon: FaSpinner,
        };
      }
      return { text: 'Đang chờ', color: 'text-yellow-600', icon: FaClock };
    } else if (status === 'CANCELLED') {
      return { text: 'Đã hủy', color: 'text-red-600', icon: FaTimes };
    }
    return { text: status, color: 'text-gray-600', icon: FaClock };
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-red-600 mb-4">{error || 'Không tìm thấy thông tin'}</p>
        <Link
          to="/patient/appointments"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Quay lại lịch đã đặt
        </Link>
      </div>
    );
  }

  const statusMsg = getStatusMessage();
  const StatusIcon = statusMsg.icon;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <FaHome className="text-blue-600" />
          Theo Dõi Số Thứ Tự
        </h1>

        {/* Appointment Info */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <FaUserMd className="text-white text-2xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {appointment.doctor?.full_name || 'Bác sĩ'}
              </h2>
              <p className="text-gray-600">{appointment.doctor?.department?.name}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>
              <strong>Ngày khám:</strong>{' '}
              {new Date(appointment.appointment_date).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p>
              <strong>Giờ khám:</strong> {appointment.appointment_time?.substring(0, 5)}
            </p>
          </div>
        </div>

        {/* Queue Status */}
        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full p-8 mb-4">
            <div className="text-white text-sm mb-2">Số thứ tự của bạn</div>
            <div className="text-6xl font-bold text-white">
              {queueStatus?.currentNumber || appointment.queue_number || 'N/A'}
            </div>
          </div>

          {statusMsg && (
            <div className={`flex items-center justify-center gap-3 text-lg font-semibold ${statusMsg.color}`}>
              <StatusIcon className="animate-pulse" />
              <span>{statusMsg.text}</span>
            </div>
          )}
        </div>

        {/* Queue Info */}
        {queueStatus && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">
                {queueStatus.currentServing || 'N/A'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Đang khám</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">
                {queueStatus.totalWaiting || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Đang chờ</div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Lưu ý:</strong> Vui lòng có mặt tại bệnh viện trước giờ khám 15 phút. Khi đến
            lượt, bạn sẽ được gọi vào phòng khám. Số thứ tự sẽ được cập nhật tự động.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/patient/appointments"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Quay lại lịch đã đặt
          </Link>
        </div>
      </div>
    </div>
  );
}

export default QueueTracker;

