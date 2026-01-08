import PatientAppointmentsPage from './PatientAppointmentsPage';

function MyAppointments() {
  return <PatientAppointmentsPage />;
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, waiting, in_progress, done, cancelled
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const params = {
        patient_id: user.id,
        limit: 100,
      };
      
      if (filter !== 'all') {
        params.status = filter.toUpperCase();
      }

      const response = await patientService.getMyAppointments(params);
      if (response.success) {
        setAppointments(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch khám này?')) {
      return;
    }

    try {
      setCancellingId(id);
      await patientService.cancelAppointment(id, 'Bệnh nhân hủy');
      fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể hủy lịch khám');
    } finally {
      setCancellingId(null);
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${info.color}`}>
        {info.label}
      </span>
    );
  };

  const canCancel = (status) => {
    return status === 'WAITING';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaList className="text-blue-600" />
          Lịch Đã Đặt Của Tôi
        </h1>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {['all', 'waiting', 'in_progress', 'done', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f === 'all'
              ? 'Tất cả'
              : f === 'waiting'
              ? 'Đang chờ'
              : f === 'in_progress'
              ? 'Đang khám'
              : f === 'done'
              ? 'Hoàn thành'
              : 'Đã hủy'}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FaCalendarAlt className="text-5xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">Bạn chưa có lịch khám nào</p>
          <Link
            to="/departments"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đặt Lịch Ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaUserMd className="text-blue-600 text-2xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        {appointment.doctor?.full_name || 'Bác sĩ'}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {appointment.doctor?.department?.name || 'Chuyên khoa'}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt />
                          <span>
                            {formatDateTime(
                              appointment.appointment_date,
                              appointment.appointment_time
                            )}
                          </span>
                        </div>
                        {appointment.queue_number && (
                          <div className="flex items-center gap-2">
                            <FaClock />
                            <span>Số thứ tự: {appointment.queue_number}</span>
                          </div>
                        )}
                      </div>
                      {appointment.symptoms && (
                        <p className="text-gray-600 text-sm mt-2">
                          <strong>Triệu chứng:</strong> {appointment.symptoms}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  {getStatusBadge(appointment.status)}
                  <div className="flex gap-2">
                    <Link
                      to={`/appointments/${appointment.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <FaEye />
                      Xem chi tiết
                    </Link>
                    {appointment.status === 'WAITING' && appointment.queue_number && (
                      <Link
                        to={`/queue/${appointment.id}`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <FaEye />
                        Theo dõi số
                      </Link>
                    )}
                    {canCancel(appointment.status) && (
                      <button
                        onClick={() => handleCancel(appointment.id)}
                        disabled={cancellingId === appointment.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <FaTimes />
                        {cancellingId === appointment.id ? 'Đang hủy...' : 'Hủy lịch'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyAppointments;

