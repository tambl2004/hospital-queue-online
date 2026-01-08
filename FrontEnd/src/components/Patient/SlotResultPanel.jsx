import SlotCard from './SlotCard';
import { FaCalendarAlt, FaExclamationCircle } from 'react-icons/fa';

function SlotResultPanel({ slots, loading, onBookSlot, doctor, date }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Đang tải danh sách lịch trống...</p>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <FaExclamationCircle className="text-5xl text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg mb-2">Không có lịch trống</p>
        <p className="text-gray-500 text-sm">
          Vui lòng chọn ngày khác hoặc bác sĩ khác
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <FaCalendarAlt className="text-blue-600" />
          Các khung giờ còn trống
        </h2>
        {doctor && date && (
          <div className="text-sm text-gray-600">
            <p>
              <strong>Bác sĩ:</strong> {doctor.full_name} - {doctor.department?.name}
            </p>
            <p>
              <strong>Ngày:</strong> {formatDate(date)}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {slots.map((slot) => (
          <SlotCard key={slot.id} slot={slot} onBook={onBookSlot} />
        ))}
      </div>
    </div>
  );
}

export default SlotResultPanel;

