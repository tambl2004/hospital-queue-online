import { FaStar } from 'react-icons/fa';

/**
 * RateDoctorButton Component
 * Nút đánh giá bác sĩ (Khu A)
 */
function RateDoctorButton({ onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
    >
      <FaStar />
      <span>Đánh giá bác sĩ</span>
    </button>
  );
}

export default RateDoctorButton;

