import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';
import CancelAppointmentModal from '../components/Patient/CancelAppointmentModal';
import { FaUserMd, FaCalendarAlt, FaClock, FaArrowLeft, FaEye, FaTimes, FaListOl, FaDoorOpen, FaHospital } from 'react-icons/fa';

function PatientAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await patientService.getAppointmentById(id);
      if (response.success) {
        setAppointment(response.data);
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async (appointmentId, reason) => {
    try {
      setCancelling(true);
      await patientService.cancelAppointment(appointmentId, reason);
      alert('Đã hủy lịch khám thành công');
      navigate('/my-appointments');
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể hủy lịch khám');
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
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
      <span className={`px-4 py-2 rounded-full text-sm font-medium ${info.color}`}>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">Không tìm thấy thông tin lịch khám</p>
            <Link
              to="/my-appointments"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Quay lại lịch đã đặt
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link
          to="/my-appointments"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <FaArrowLeft className="mr-2" />
          Quay lại lịch đã đặt
        </Link>

        {/* Appointment Info Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Chi Tiết Lịch Khám</h1>
            {getStatusBadge(appointment.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Doctor Info */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                <FaUserMd className="text-blue-600" />
                Thông Tin Bác Sĩ
              </h2>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-800">
                  {appointment.doctor?.full_name || 'Bác sĩ'}
                </p>
                {appointment.doctor?.experience_years && (
                  <p className="text-sm text-gray-600">
                    Kinh nghiệm: {appointment.doctor.experience_years} năm
                  </p>
                )}
                {appointment.doctor?.rating_avg > 0 && (
                  <p className="text-sm text-gray-600">
                    Đánh giá: {appointment.doctor.rating_avg.toFixed(1)} / 5.0
                  </p>
                )}
              </div>
            </div>

            {/* Department Info */}
            <div className="bg-green-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                <FaHospital className="text-green-600" />
                Chuyên Khoa
              </h2>
              <p className="text-lg font-medium text-gray-800">
                {appointment.department?.name || 'N/A'}
              </p>
            </div>

            {/* Room Info */}
            {appointment.room && (
              <div className="bg-purple-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                  <FaDoorOpen className="text-purple-600" />
                  Phòng Khám
                </h2>
                <p className="text-lg font-medium text-gray-800">
                  {appointment.room.room_code} - {appointment.room.room_name}
                </p>
              </div>
            )}

            {/* Appointment Time */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                <FaCalendarAlt className="text-yellow-600" />
                Thời Gian Khám
              </h2>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-800">
                  {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                </p>
                {appointment.queue_number && (
                  <div className="mt-4 pt-4 border-t border-yellow-200">
                    <div className="flex items-center gap-3">
                      <FaListOl className="text-yellow-600 text-xl" />
                      <div>
                        <p className="text-sm text-gray-600">Số thứ tự</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {appointment.queue_number}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Symptoms */}
          {appointment.symptoms && (
            <div className="mt-6 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Triệu Chứng / Mô Tả</h3>
              <p className="text-gray-700">{appointment.symptoms}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-4 flex-wrap">
            {canTrackQueue(appointment.status) && appointment.queue_number && (
              <Link
                to={`/patient/queue/${appointment.id}`}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <FaEye />
                Theo dõi số thứ tự
              </Link>
            )}
            {canCancel(appointment.status) && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={cancelling}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
              >
                <FaTimes />
                {cancelling ? 'Đang hủy...' : 'Hủy lịch'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <CancelAppointmentModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        appointment={appointment}
        loading={cancelling}
      />
    </div>
  );
}

export default PatientAppointmentDetail;

