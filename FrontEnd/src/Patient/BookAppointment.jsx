import PatientBookPage from './PatientBookPage';

function BookAppointment() {
  return <PatientBookPage />;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const doctorIdFromUrl = searchParams.get('doctor_id');
  const scheduleIdFromUrl = searchParams.get('schedule_id');
  const dateFromUrl = searchParams.get('date');

  const [formData, setFormData] = useState({
    doctor_id: doctorIdFromUrl || '',
    schedule_id: scheduleIdFromUrl || '',
    appointment_date: dateFromUrl || '',
    appointment_time: '',
    symptoms: '',
  });

  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchDoctors();
    if (doctorIdFromUrl && dateFromUrl) {
      fetchSchedules();
    }
  }, []);

  useEffect(() => {
    if (formData.doctor_id && formData.appointment_date) {
      fetchSchedules();
    }
  }, [formData.doctor_id, formData.appointment_date]);

  useEffect(() => {
    if (formData.schedule_id) {
      const schedule = schedules.find((s) => s.id === parseInt(formData.schedule_id));
      if (schedule) {
        setFormData((prev) => ({
          ...prev,
          appointment_time: schedule.start_time,
        }));
      }
    }
  }, [formData.schedule_id, schedules]);

  const fetchDoctors = async () => {
    try {
      const response = await patientService.getDoctors({ status: 'active', limit: 1000 });
      if (response.success) {
        setDoctors(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchSchedules = async () => {
    if (!formData.doctor_id || !formData.appointment_date) return;
    try {
      setLoading(true);
      const response = await patientService.getDoctorSchedules(
        formData.doctor_id,
        formData.appointment_date
      );
      if (response.success) {
        const availableSchedules = (response.data || []).filter(
          (s) => s.is_active && s.current_patients < s.max_patients
        );
        setSchedules(availableSchedules);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Reset schedule_id khi đổi doctor hoặc date
      if (name === 'doctor_id' || name === 'appointment_date') {
        newData.schedule_id = '';
        newData.appointment_time = '';
      }
      return newData;
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validation
      if (!formData.doctor_id || !formData.schedule_id || !formData.appointment_date) {
        setError('Vui lòng điền đầy đủ thông tin');
        setSubmitting(false);
        return;
      }

      const response = await patientService.bookAppointment({
        doctor_id: parseInt(formData.doctor_id),
        schedule_id: parseInt(formData.schedule_id),
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        symptoms: formData.symptoms || null,
      });

      if (response.success) {
        setSuccess(true);
        const appointmentId = response.data?.id || response.data?.appointment?.id;
        setTimeout(() => {
          if (appointmentId) {
            navigate(`/appointments/${appointmentId}`);
          } else {
            navigate('/my-appointments');
          }
        }, 2000);
      } else {
        setError(response.message || 'Đặt lịch thất bại');
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (time) => {
    return time.substring(0, 5);
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
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
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <FaCalendarCheck className="text-blue-600" />
          Đặt Lịch Khám
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <FaExclamationCircle className="text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Doctor Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn Bác Sĩ <span className="text-red-500">*</span>
            </label>
            <select
              name="doctor_id"
              value={formData.doctor_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Chọn bác sĩ --</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name} - {doctor.department?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn Ngày Khám <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="appointment_date"
              value={formData.appointment_date}
              onChange={handleChange}
              min={getMinDate()}
              max={getMaxDate()}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Time Slot Selection */}
          {formData.doctor_id && formData.appointment_date && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn Giờ Khám <span className="text-red-500">*</span>
              </label>
              {loading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : schedules.length === 0 ? (
                <p className="text-gray-600 py-4">
                  Không có khung giờ trống vào ngày này. Vui lòng chọn ngày khác.
                </p>
              ) : (
                <select
                  name="schedule_id"
                  value={formData.schedule_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Chọn giờ khám --</option>
                  {schedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)} (
                      {schedule.max_patients - schedule.current_patients} chỗ trống)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Symptoms */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Triệu Chứng / Mô Tả (Tùy chọn)
            </label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              rows={4}
              placeholder="Mô tả triệu chứng hoặc vấn đề sức khỏe của bạn..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/patient/appointments')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.doctor_id || !formData.schedule_id}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {submitting ? 'Đang xử lý...' : 'Đặt Lịch Khám'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookAppointment;

