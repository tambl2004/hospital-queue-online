import { FaClock, FaCheckCircle, FaTimesCircle, FaLock } from 'react-icons/fa';

function SlotCard({ slot, onBook }) {
  const formatTime = (time) => {
    return time.substring(0, 5); // HH:mm
  };

  const isClosed = !slot.is_active;
  // Backend trả về booked_count hoặc current_patients
  const bookedCount = slot.booked_count !== undefined ? slot.booked_count : (slot.current_patients || 0);
  const isFull = bookedCount >= slot.max_patients;
  const isAvailable = !isClosed && !isFull;
  const remainingSlots = slot.max_patients - bookedCount;

  const getStatusBadge = () => {
    if (isClosed) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
          <FaLock className="text-xs" />
          Đã đóng
        </span>
      );
    }
    if (isFull) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 flex items-center gap-1">
          <FaTimesCircle className="text-xs" />
          Hết chỗ
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600 flex items-center gap-1">
        <FaCheckCircle className="text-xs" />
        Còn chỗ ({remainingSlots})
      </span>
    );
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 p-4 transition-all ${
        isAvailable
          ? 'border-blue-300 hover:border-blue-600 hover:shadow-md cursor-pointer'
          : 'border-gray-200 bg-gray-50 opacity-75 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaClock className={`text-lg ${isAvailable ? 'text-blue-600' : 'text-gray-400'}`} />
          <div>
            <div className="font-semibold text-gray-800">
              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {bookedCount} / {slot.max_patients} người
            </div>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {isAvailable && (
        <button
          onClick={() => onBook(slot)}
          className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Đặt lịch
        </button>
      )}

      {!isAvailable && (
        <div className="w-full mt-3 px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-center font-medium text-sm cursor-not-allowed">
          {isClosed ? 'Đã đóng' : 'Hết chỗ'}
        </div>
      )}
    </div>
  );
}

export default SlotCard;

