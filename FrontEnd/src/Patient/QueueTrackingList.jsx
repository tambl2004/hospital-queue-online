import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientService } from '../services/patientService';
import { FaClipboardList, FaClock, FaArrowRight } from 'react-icons/fa';

/**
 * QueueTrackingList - Trang danh sách các lịch có thể theo dõi số thứ tự
 */
function QueueTrackingList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrackableAppointments();
  }, []);

  const fetchTrackableAppointments = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await patientService.getMyAppointments({
        patient_id: user.id,
        limit: 1000,
      });

      if (response.success) {
        // Lọc các appointments có thể theo dõi (có queue_number và status phù hợp)
        const trackable = (response.data || []).filter(
          (apt) =>
            apt.queue_number &&
            ['WAITING', 'CALLED', 'IN_PROGRESS'].includes(apt.status)
        );

        // Sắp xếp: lịch sắp tới trước
        const sorted = trackable.sort((a, b) => {
          const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
          const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
          return dateA - dateB;
        });

        setAppointments(sorted);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date, time) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      WAITING: { label: 'Đang chờ', color: 'bg-yellow-100 text-yellow-800' },
      CALLED: { label: 'Đã gọi', color: 'bg-blue-100 text-blue-800' },
      IN_PROGRESS: { label: 'Đang khám', color: 'bg-purple-100 text-purple-800' },
    };
    const info = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${info.color}`}>
        {info.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FaClipboardList className="text-5xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Chưa có lịch nào để theo dõi
          </h2>
          <p className="text-gray-600 mb-6">
            Bạn chưa có lịch khám nào đang trong trạng thái chờ hoặc đang khám.
          </p>
          <Link
            to="/patient/appointments"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Xem tất cả lịch đã đặt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaClipboardList className="text-blue-600" />
          Theo Dõi Số Thứ Tự
        </h1>
        <p className="text-gray-600 mt-2">
          Chọn lịch khám để theo dõi số thứ tự theo thời gian thực
        </p>
      </div>

      <div className="space-y-4">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaClock className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {appointment.doctor?.full_name || 'Bác sĩ'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {appointment.doctor?.department?.name || appointment.department?.name}
                    </p>
                  </div>
                </div>

                <div className="ml-16 space-y-1 text-sm text-gray-600">
                  <p>
                    <strong>Ngày giờ:</strong> {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                  </p>
                  {appointment.room && (
                    <p>
                      <strong>Phòng:</strong> {appointment.room.room_code} - {appointment.room.room_name}
                    </p>
                  )}
                  <p className="text-blue-600 font-medium">
                    <strong>Số thứ tự:</strong> {appointment.queue_number}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                {getStatusBadge(appointment.status)}
                <Link
                  to={`/patient/queue/${appointment.id}`}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  Theo dõi
                  <FaArrowRight />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/patient/appointments"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Quay lại lịch đã đặt
        </Link>
      </div>
    </div>
  );
}

export default QueueTrackingList;

