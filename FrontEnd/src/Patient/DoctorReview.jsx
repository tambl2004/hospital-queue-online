import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { patientService } from '../services/patientService';
import { FaStar, FaCheckCircle, FaExclamationCircle, FaArrowLeft } from 'react-icons/fa';

function DoctorReview() {
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await patientService.getAppointmentById(appointmentId);
      if (response.success) {
        setAppointment(response.data);
        // Kiểm tra xem đã đánh giá chưa
        if (response.data.review) {
          setRating(response.data.review.rating || 0);
          setComment(response.data.review.comment || '');
        }
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      setError('Không thể tải thông tin lịch khám');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await patientService.reviewDoctor(appointmentId, rating, comment);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          window.history.back();
        }, 2000);
      } else {
        setError(response.message || 'Đánh giá thất bại');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-red-600 mb-4">Không tìm thấy thông tin lịch khám</p>
        <Link
          to="/patient/appointments"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Quay lại
        </Link>
      </div>
    );
  }

  if (appointment.status !== 'DONE') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600 mb-4">
          Chỉ có thể đánh giá sau khi hoàn thành khám bệnh
        </p>
        <Link
          to="/patient/appointments"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Quay lại
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Cảm Ơn Bạn Đã Đánh Giá!</h2>
        <p className="text-gray-600 mb-4">Đánh giá của bạn đã được ghi nhận.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <Link
          to="/patient/appointments"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <FaArrowLeft className="mr-2" />
          Quay lại
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 mb-6">Đánh Giá Bác Sĩ</h1>

        {/* Appointment Info */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {appointment.doctor?.full_name || 'Bác sĩ'}
          </h2>
          <p className="text-gray-600">{appointment.doctor?.department?.name}</p>
          <p className="text-sm text-gray-500 mt-2">
            Ngày khám:{' '}
            {new Date(appointment.appointment_date).toLocaleDateString('vi-VN')} lúc{' '}
            {appointment.appointment_time?.substring(0, 5)}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <FaExclamationCircle className="text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Đánh giá <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <FaStar
                    className={`text-4xl transition-colors ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {rating === 0
                ? 'Chọn số sao'
                : rating === 1
                ? 'Rất không hài lòng'
                : rating === 2
                ? 'Không hài lòng'
                : rating === 3
                ? 'Bình thường'
                : rating === 4
                ? 'Hài lòng'
                : 'Rất hài lòng'}
            </p>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhận xét (Tùy chọn)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ khám bệnh..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link
              to="/patient/appointments"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {submitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DoctorReview;

