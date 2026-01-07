import { 
  FaTimes, 
  FaUser, 
  FaStethoscope, 
  FaBuilding, 
  FaCalendarAlt, 
  FaClock, 
  FaHashtag,
  FaChartLine
} from 'react-icons/fa';
import appointmentService from '../../services/appointmentService';

/**
 * APPOINTMENT DETAIL DRAWER
 * Drawer hiển thị chi tiết thông tin lượt đăng ký khám
 * 
 * Props:
 * - appointment: Object - Thông tin appointment
 * - onClose: Function - Callback khi đóng drawer
 * - onRefresh: Function - Callback để reload danh sách
 */

const AppointmentDetailDrawer = ({ appointment, onClose, onRefresh }) => {
  if (!appointment) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.slice(0, 5);
  };

  const calculateAge = (dob) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getGenderLabel = (gender) => {
    const labels = {
      MALE: 'Nam',
      FEMALE: 'Nữ',
      OTHER: 'Khác'
    };
    return labels[gender] || '-';
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Chi tiết lượt đăng ký khám
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Mã: #{appointment.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaChartLine className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Trạng thái:</span>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              appointmentService.getStatusColor(appointment.status)
            }`}>
              {appointmentService.getStatusLabel(appointment.status)}
            </span>
          </div>

          {/* Queue Number */}
          {appointment.queue_number && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FaHashtag className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="text-sm text-blue-600 font-medium">Số thứ tự</div>
                  <div className="text-3xl font-bold text-blue-700">
                    {appointment.queue_number}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Thông tin bệnh nhân */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <FaUser className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Thông tin bệnh nhân</h3>
            </div>
            <div className="space-y-3">
              <InfoRow label="Họ và tên" value={appointment.patient_name} />
              <InfoRow label="Số điện thoại" value={appointment.patient_phone} />
              <InfoRow label="Email" value={appointment.patient_email} />
              {appointment.patient_gender && (
                <InfoRow 
                  label="Giới tính" 
                  value={getGenderLabel(appointment.patient_gender)} 
                />
              )}
              {appointment.patient_dob && (
                <InfoRow 
                  label="Ngày sinh / Tuổi" 
                  value={`${formatDate(appointment.patient_dob)} (${calculateAge(appointment.patient_dob)} tuổi)`}
                />
              )}
            </div>
          </div>

          {/* Thông tin bác sĩ */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <FaStethoscope className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Thông tin bác sĩ</h3>
            </div>
            <div className="space-y-3">
              <InfoRow label="Bác sĩ" value={appointment.doctor_name} />
              {appointment.doctor_email && (
                <InfoRow label="Email" value={appointment.doctor_email} />
              )}
              {appointment.doctor_phone && (
                <InfoRow label="Số điện thoại" value={appointment.doctor_phone} />
              )}
              {appointment.experience_years !== undefined && (
                <InfoRow 
                  label="Kinh nghiệm" 
                  value={`${appointment.experience_years} năm`} 
                />
              )}
              {appointment.rating_avg !== undefined && (
                <InfoRow 
                  label="Đánh giá" 
                  value={`⭐ ${parseFloat(appointment.rating_avg).toFixed(1)} / 5.0`} 
                />
              )}
            </div>
          </div>

          {/* Thông tin khám */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <FaBuilding className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Thông tin khám</h3>
            </div>
            <div className="space-y-3">
              <InfoRow label="Chuyên khoa" value={appointment.department_name} />
              <InfoRow 
                label="Phòng khám" 
                value={appointment.room_name || 'Chưa phân phòng'} 
              />
              <InfoRow 
                label="Ngày khám" 
                value={formatDate(appointment.appointment_date)} 
              />
              <InfoRow 
                label="Giờ khám" 
                value={formatTime(appointment.appointment_time)} 
              />
              {appointment.start_time && appointment.end_time && (
                <InfoRow 
                  label="Khung giờ" 
                  value={`${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}`} 
                />
              )}
              {appointment.max_patients && (
                <InfoRow 
                  label="Số bệnh nhân tối đa" 
                  value={appointment.max_patients} 
                />
              )}
            </div>
          </div>

          {/* Thông tin hệ thống */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <FaCalendarAlt className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Thông tin hệ thống</h3>
            </div>
            <div className="space-y-3">
              <InfoRow 
                label="Ngày tạo" 
                value={new Date(appointment.created_at).toLocaleString('vi-VN')} 
              />
              <InfoRow 
                label="Cập nhật lần cuối" 
                value={new Date(appointment.updated_at).toLocaleString('vi-VN')} 
              />
              <InfoRow label="ID Lịch khám" value={`#${appointment.schedule_id}`} />
            </div>
          </div>

          {/* Actions (nếu cần thêm) */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Info Row Component
 */
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start">
    <span className="text-sm text-gray-600 font-medium">{label}:</span>
    <span className="text-sm text-gray-900 text-right ml-4">{value || '-'}</span>
  </div>
);

export default AppointmentDetailDrawer;

