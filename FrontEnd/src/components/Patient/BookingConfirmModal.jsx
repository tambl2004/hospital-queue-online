import { FaTimes, FaUserMd, FaCalendarAlt, FaClock, FaHospital, FaDoorOpen } from 'react-icons/fa';

function BookingConfirmModal({ isOpen, onClose, onConfirm, bookingInfo, loading }) {
  if (!isOpen) return null;

  const formatTime = (time) => {
    return time.substring(0, 5); // HH:mm
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!bookingInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Xác Nhận Đặt Lịch</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Chuyên khoa */}
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <FaHospital className="text-blue-600 text-xl mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Chuyên khoa</p>
                <p className="font-semibold text-gray-800">
                  {bookingInfo.department?.name || 'N/A'}
                </p>
              </div>
            </div>

            {/* Bác sĩ */}
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
              <FaUserMd className="text-green-600 text-xl mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Bác sĩ</p>
                <p className="font-semibold text-gray-800">
                  {bookingInfo.doctor?.full_name || 'N/A'}
                </p>
              </div>
            </div>

            {/* Phòng */}
            {bookingInfo.doctor?.room && (
              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
                <FaDoorOpen className="text-purple-600 text-xl mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phòng khám</p>
                  <p className="font-semibold text-gray-800">
                    {bookingInfo.doctor.room.room_code} - {bookingInfo.doctor.room.room_name}
                  </p>
                </div>
              </div>
            )}

            {/* Ngày/giờ */}
            <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg">
              <FaCalendarAlt className="text-yellow-600 text-xl mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Ngày khám</p>
                <p className="font-semibold text-gray-800 mb-3">
                  {formatDate(bookingInfo.appointment_date)}
                </p>
                <div className="flex items-center gap-2">
                  <FaClock className="text-yellow-600" />
                  <p className="font-semibold text-gray-800">
                    {formatTime(bookingInfo.schedule?.start_time || bookingInfo.appointment_time)} -{' '}
                    {formatTime(bookingInfo.schedule?.end_time || '')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang xử lý...
              </>
            ) : (
              'Xác nhận đặt lịch'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmModal;

