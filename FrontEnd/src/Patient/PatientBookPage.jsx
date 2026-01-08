import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';
import BookingFilterForm from '../components/Patient/BookingFilterForm';
import SlotResultPanel from '../components/Patient/SlotResultPanel';
import BookingConfirmModal from '../components/Patient/BookingConfirmModal';
import { FaCalendarCheck, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

function PatientBookPage() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Filter state
  const [filterData, setFilterData] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);

  const handleSearch = async (filter) => {
    setError('');
    setLoading(true);
    setSlots([]);
    setFilterData(filter);

    try {
      // Lấy thông tin bác sĩ và chuyên khoa
      const [doctorResponse, departmentResponse] = await Promise.all([
        patientService.getDoctorById(filter.doctor_id),
        patientService.getDepartmentById(filter.department_id),
      ]);

      if (!doctorResponse.success || !departmentResponse.success) {
        setError('Không thể tải thông tin bác sĩ hoặc chuyên khoa');
        setLoading(false);
        return;
      }

      setSelectedDoctor(doctorResponse.data);
      setSelectedDepartment(departmentResponse.data);

      // Lấy danh sách slot
      const scheduleResponse = await patientService.getDoctorSchedules(
        filter.doctor_id,
        filter.appointment_date
      );

      if (scheduleResponse.success) {
        // Backend trả về schedules với booked_count hoặc current_patients
        const schedules = scheduleResponse.data || [];
        setSlots(schedules);
      } else {
        setError('Không thể tải danh sách lịch trống');
      }
    } catch (error) {
      console.error('Error searching slots:', error);
      setError(
        error.response?.data?.message || 'Có lỗi xảy ra khi tìm lịch trống. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = (slot) => {
    // Kiểm tra slot còn hợp lệ không
    const isClosed = !slot.is_active;
    const bookedCount = slot.booked_count !== undefined ? slot.booked_count : (slot.current_patients || 0);
    const isFull = bookedCount >= slot.max_patients;

    if (isClosed) {
      setError('Slot này đã bị đóng. Vui lòng chọn slot khác.');
      return;
    }

    if (isFull) {
      setError('Slot này đã hết chỗ. Vui lòng chọn slot khác.');
      return;
    }

    setSelectedSlot(slot);
    setBookingInfo({
      department: selectedDepartment,
      doctor: selectedDoctor,
      schedule: slot,
      appointment_date: filterData.appointment_date,
      appointment_time: slot.start_time,
    });
    setShowModal(true);
    setError('');
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !filterData) return;

    setSubmitting(true);
    setError('');

    try {
      // Gửi schedule_id và các thông tin cần thiết
      // Backend có thể tự suy ra từ schedule, nhưng gửi thêm để đảm bảo
      const response = await patientService.bookAppointment({
        schedule_id: selectedSlot.id,
        doctor_id: filterData.doctor_id,
        appointment_date: filterData.appointment_date,
        appointment_time: selectedSlot.start_time,
      });

      if (response.success) {
        setSuccess(true);
        setShowModal(false);
        
        // Redirect sau 1.5 giây
        setTimeout(() => {
          const appointmentId = response.data?.id || response.data?.appointment?.id;
          if (appointmentId) {
            navigate(`/appointments/${appointmentId}`);
          } else {
            navigate('/my-appointments');
          }
        }, 1500);
      } else {
        setError(response.message || 'Đặt lịch thất bại');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.';
      setError(errorMessage);
      
      // Nếu slot full hoặc slot đóng, reload danh sách slot
      if (
        errorMessage.includes('hết chỗ') ||
        errorMessage.includes('đã đóng') ||
        errorMessage.includes('full') ||
        errorMessage.includes('closed')
      ) {
        setTimeout(() => {
          handleSearch(filterData);
        }, 2000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setShowModal(false);
      setSelectedSlot(null);
      setBookingInfo(null);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đặt Lịch Thành Công!</h2>
        <p className="text-gray-600 mb-4">
          Lịch khám của bạn đã được đặt thành công. Đang chuyển đến trang lịch đã đặt...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaCalendarCheck className="text-blue-600" />
          Đặt Lịch Khám
        </h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <FaExclamationCircle className="text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Khu A: Form chọn nhanh */}
      <BookingFilterForm onSearch={handleSearch} loading={loading} />

      {/* Khu B: Danh sách slot */}
      {(slots.length > 0 || loading) && (
        <SlotResultPanel
          slots={slots}
          loading={loading}
          onBookSlot={handleBookSlot}
          doctor={selectedDoctor}
          date={filterData?.appointment_date}
        />
      )}

      {/* Khu C: Modal xác nhận */}
      <BookingConfirmModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmBooking}
        bookingInfo={bookingInfo}
        loading={submitting}
      />
    </div>
  );
}

export default PatientBookPage;

