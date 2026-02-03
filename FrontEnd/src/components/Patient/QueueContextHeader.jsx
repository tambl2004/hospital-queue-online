import { FaUserMd, FaHospital, FaDoorOpen, FaCalendarAlt, FaClock } from 'react-icons/fa';

/**
 * QueueContextHeader - Hiển thị thông tin lịch đang theo dõi
 */
function QueueContextHeader({ appointment }) {
  if (!appointment) return null;

  const getStatusBadge = (status) => {
    const statusMap = {
      WAITING: { label: 'Đang chờ', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      CALLED: { label: 'Đã gọi', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      IN_PROGRESS: { label: 'Đang khám', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      DONE: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800 border-green-300' },
      CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800 border-red-300' },
      SKIPPED: { label: 'Bỏ qua', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    };

    const info = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300' };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${info.color}`}>
        {info.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    return timeStr.substring(0, 5);
  };

  // Ưu tiên lấy ảnh bác sĩ nếu có, fallback icon
  const doctorAvatar =
    appointment.doctor?.avatar_url ||
    appointment.doctor?.profile_image ||
    appointment.doctor?.image_url ||
    appointment.doctor?.avatar;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
      <div className="flex items-start gap-4">
        {/* Avatar bác sĩ */}
        <div className="w-14 h-14 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center flex-shrink-0">
          {doctorAvatar ? (
            <img
              src={doctorAvatar}
              alt={appointment.doctor?.full_name || 'Bác sĩ'}
              className="w-full h-full object-cover"
            />
          ) : (
            <FaUserMd className="text-white text-2xl" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {appointment.doctor?.full_name || 'Bác sĩ'}
              </h2>
              <div className="flex items-center gap-2 text-gray-600">
                <FaHospital className="text-sm" />
                <span className="text-sm">{appointment.doctor?.department?.name || appointment.department?.name || 'Chuyên khoa'}</span>
              </div>
            </div>
            {getStatusBadge(appointment.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            {appointment.room && (
              <div className="flex items-center gap-2 text-gray-600">
                <FaDoorOpen className="text-blue-600" />
                <span>Phòng: {appointment.room.room_name || appointment.room.room_code || 'N/A'}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <FaCalendarAlt className="text-blue-600" />
              <span>{formatDate(appointment.appointment_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FaClock className="text-blue-600" />
              <span>Giờ: {formatTime(appointment.appointment_time)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QueueContextHeader;

