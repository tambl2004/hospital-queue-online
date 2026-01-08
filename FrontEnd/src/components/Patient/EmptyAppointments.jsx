import { Link } from 'react-router-dom';
import { FaCalendarAlt } from 'react-icons/fa';

function EmptyAppointments() {
  return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <FaCalendarAlt className="text-5xl text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600 text-lg mb-4">Bạn chưa có lịch khám nào</p>
      <Link
        to="/patient/book"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Đặt Lịch Ngay
      </Link>
    </div>
  );
}

export default EmptyAppointments;

