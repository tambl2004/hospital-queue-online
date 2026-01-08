import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { patientService } from '../services/patientService';
import { authService } from '../services/authService';
import { FaUserMd, FaStar, FaCalendarAlt, FaClock, FaArrowLeft, FaCheck } from 'react-icons/fa';

function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateFromUrl = searchParams.get('date');
  
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dateFromUrl || '');
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  // Set selectedDate từ URL param khi component mount
  useEffect(() => {
    if (dateFromUrl) {
      setSelectedDate(dateFromUrl);
    }
  }, [dateFromUrl]);

  useEffect(() => {
    if (selectedDate && doctor) {
      fetchSchedules();
    }
  }, [selectedDate, doctor]);

  const fetchDoctor = async () => {
    try {
      setLoading(true);
      const response = await patientService.getDoctorById(id);
      if (response.success) {
        setDoctor(response.data);
      }
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    if (!selectedDate) return;
    try {
      setScheduleLoading(true);
      const response = await patientService.getDoctorSchedules(id, selectedDate);
      if (response.success) {
        setSchedules(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleBookAppointment = (scheduleId) => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { returnTo: `/doctors/${id}` } });
      return;
    }
    navigate(`/patient/book?doctor_id=${id}&schedule_id=${scheduleId}&date=${selectedDate}`);
  };

  // Lấy ngày hôm nay và các ngày tiếp theo (7 ngày)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-600">Không tìm thấy bác sĩ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link
          to={doctor.department?.id ? `/departments/${doctor.department.id}/doctors` : '/doctors'}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <FaArrowLeft className="mr-2" />
          Quay lại
        </Link>

        {/* Doctor Info Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaUserMd className="text-blue-600 text-5xl" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{doctor.full_name}</h1>
              <p className="text-lg text-gray-600 mb-4">{doctor.department?.name}</p>
              
              <div className="flex flex-wrap gap-4 mb-4">
                {doctor.experience_years && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaClock />
                    <span>Kinh nghiệm: {doctor.experience_years} năm</span>
                  </div>
                )}
                {doctor.rating_avg != null && Number(doctor.rating_avg) > 0 && (
                  <div className="flex items-center gap-2">
                    <FaStar className="text-yellow-400" />
                    <span className="font-medium text-gray-700">
                      {Number(doctor.rating_avg).toFixed(1)} / 5.0
                    </span>
                  </div>
                )}
                {doctor.room && (
                  <div className="text-gray-600">
                    Phòng: {doctor.room.room_code} - {doctor.room.room_name}
                  </div>
                )}
              </div>

              {doctor.bio && (
                <p className="text-gray-700 leading-relaxed">{doctor.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <FaCalendarAlt className="text-blue-600" />
            Đặt Lịch Khám
          </h2>

          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn ngày khám
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {getAvailableDates().map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedDate === date
                      ? 'border-blue-600 bg-blue-50 text-blue-600 font-semibold'
                      : 'border-gray-300 hover:border-blue-300 text-gray-700'
                  }`}
                >
                  <div className="text-sm">{formatDate(date)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Chọn giờ khám - {formatDate(selectedDate)}
              </h3>
              {scheduleLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : schedules.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Không có lịch khám vào ngày này
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {schedules
                    .filter((schedule) => schedule.is_active)
                    .map((schedule) => {
                      const isAvailable = schedule.current_patients < schedule.max_patients;
                      return (
                        <button
                          key={schedule.id}
                          onClick={() => isAvailable && handleBookAppointment(schedule.id)}
                          disabled={!isAvailable}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isAvailable
                              ? 'border-blue-300 hover:border-blue-600 hover:bg-blue-50 cursor-pointer'
                              : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-800">
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {schedule.current_patients} / {schedule.max_patients} người
                              </div>
                            </div>
                            {isAvailable && (
                              <FaCheck className="text-green-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {!selectedDate && (
            <p className="text-gray-600 text-center py-8">
              Vui lòng chọn ngày khám để xem các khung giờ có sẵn
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDetail;

