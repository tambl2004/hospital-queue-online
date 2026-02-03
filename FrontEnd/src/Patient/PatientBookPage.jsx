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
  const [filterData, setFilterData] = useState(null); // { department_id, appointment_date }
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);

  // Bước 1: Chọn chuyên khoa + ngày -> load danh sách bác sĩ
  const handleSearch = async (filter) => {
    setError('');
    setLoading(true);
    setSlots([]);
    setDoctors([]);
    setFilterData(filter);

    try {
      // Lấy thông tin chuyên khoa
      const departmentResponse = await patientService.getDepartmentById(filter.department_id);
      if (!departmentResponse.success) {
        setError('Không thể tải thông tin chuyên khoa');
        setLoading(false);
        return;
      }

      setSelectedDepartment(departmentResponse.data);

      // Lấy danh sách bác sĩ trong khoa đó
      const doctorsResponse = await patientService.getDoctors({
        department_id: filter.department_id,
        status: 'active',
        limit: 100,
      });

      if (doctorsResponse.success) {
        const list = doctorsResponse.data || [];
        setDoctors(list);
        if (list.length === 0) {
          setError('Chuyên khoa này hiện chưa có bác sĩ hoạt động');
        }
      } else {
        setError('Không thể tải danh sách bác sĩ');
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

  // Bước 2: Chọn bác sĩ -> load danh sách slot
  const handleSelectDoctor = async (doctor) => {
    if (!filterData) return;
    setError('');
    setSelectedDoctor(doctor);
    setSlots([]);
    try {
      setLoading(true);
      const scheduleResponse = await patientService.getDoctorSchedules(
        doctor.id,
        filterData.appointment_date
      );
      if (scheduleResponse.success) {
        const schedules = scheduleResponse.data || [];
        setSlots(schedules);
      } else {
        setError('Không thể tải danh sách lịch trống');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setError(
        error.response?.data?.message || 'Có lỗi xảy ra khi tải lịch trống. Vui lòng thử lại.'
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
    if (!selectedSlot || !filterData || !selectedDoctor) return;

    setSubmitting(true);
    setError('');

    try {
      // Gửi schedule_id và các thông tin cần thiết
      // Backend có thể tự suy ra từ schedule, nhưng gửi thêm để đảm bảo
      const response = await patientService.bookAppointment({
        schedule_id: selectedSlot.id,
        doctor_id: selectedDoctor.id,
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

      {/* Khu A: Form chọn chuyên khoa + ngày */}
      <BookingFilterForm onSearch={handleSearch} loading={loading} />

      {/* Khu B: Danh sách bác sĩ trong khoa */}
      {filterData && selectedDepartment && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Chọn bác sĩ trong khoa {selectedDepartment.name}
          </h2>
          {doctors.length === 0 && !loading ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-gray-600">
              Hiện chưa có bác sĩ nào trong chuyên khoa này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => handleSelectDoctor(doctor)}
                  className={`text-left bg-white rounded-lg shadow-md p-4 border transition-all ${
                    selectedDoctor?.id === doctor.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-transparent hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                      {doctor.avatar_url ? (
                        <img
                          src={doctor.avatar_url}
                          alt={doctor.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUserMd className="text-blue-600 text-2xl" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{doctor.full_name}</div>
                      {doctor.experience_years && (
                        <div className="text-xs text-gray-500">
                          Kinh nghiệm: {doctor.experience_years} năm
                        </div>
                      )}
                      {doctor.rating_avg != null && (
                        <div className="text-xs text-gray-500">
                          Đánh giá: {Number(doctor.rating_avg).toFixed(1)} / 5.0
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-blue-700 font-medium">
                    Xem khung giờ trống ngày{' '}
                    {filterData?.appointment_date &&
                      new Date(filterData.appointment_date).toLocaleDateString('vi-VN')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Khu C: Danh sách slot của bác sĩ đã chọn */}
      {selectedDoctor && (slots.length > 0 || loading) && (
        <div className="mt-6">
          <SlotResultPanel
            slots={slots}
            loading={loading}
            onBookSlot={handleBookSlot}
            doctor={selectedDoctor}
            date={filterData?.appointment_date}
          />
        </div>
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

