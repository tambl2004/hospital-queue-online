import { Link } from 'react-router-dom';
import { FaUserMd, FaCalendarAlt, FaClock, FaDoorOpen, FaEye, FaTimes, FaListOl } from 'react-icons/fa';

function AppointmentCard({ appointment, onCancel }) {
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
    const statusInfo = {
      WAITING: { label: 'Đang chờ', color: 'bg-yellow-100 text-yellow-800' },
      CALLED: { label: 'Đã gọi', color: 'bg-blue-100 text-blue-800' },
      IN_PROGRESS: { label: 'Đang khám', color: 'bg-purple-100 text-purple-800' },
      DONE: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
      SKIPPED: { label: 'Bỏ qua', color: 'bg-gray-100 text-gray-800' },
    };
    const info = statusInfo[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${info.color}`}>
        {info.label}
      </span>
    );
  };

  const canCancel = (status) => {
    return status === 'WAITING';
  };

  const canTrackQueue = (status) => {
    return ['WAITING', 'CALLED', 'IN_PROGRESS'].includes(status);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Appointment Info */}
        <div className="flex-1">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaUserMd className="text-blue-600 text-2xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-1">
                {appointment.doctor?.full_name || 'Bác sĩ'}
              </h3>
              <p className="text-gray-600 mb-2">
                {appointment.department?.name || 'Chuyên khoa'}
              </p>
              
              {/* Room */}
              {appointment.room && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <FaDoorOpen className="text-gray-400" />
                  <span>
                    Phòng: {appointment.room.room_code} - {appointment.room.room_name}
                  </span>
                </div>
              )}

              {/* Date/Time */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <FaCalendarAlt className="text-gray-400" />
                <span>
                  {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                </span>
              </div>

              {/* Queue Number */}
              {appointment.queue_number && (
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  <FaListOl />
                  <span>Số thứ tự: {appointment.queue_number}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status & Actions */}
        <div className="flex flex-col items-end gap-3">
          {getStatusBadge(appointment.status)}
          
          <div className="flex gap-2 flex-wrap">
            {/* Xem chi tiết */}
            <Link
              to={`/appointments/${appointment.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <FaEye />
              Xem chi tiết
            </Link>

            {/* Theo dõi số */}
            {canTrackQueue(appointment.status) && appointment.queue_number && (
              <Link
                to={`/patient/queue/${appointment.id}`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <FaClock />
                Theo dõi số
              </Link>
            )}

            {/* Hủy lịch */}
            {canCancel(appointment.status) && (
              <button
                onClick={() => onCancel(appointment)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <FaTimes />
                Hủy lịch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppointmentCard;

