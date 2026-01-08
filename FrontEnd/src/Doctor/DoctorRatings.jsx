import { useState, useEffect } from 'react';
import Layout from './Layout';
import { doctorService } from '../services/doctorService';
import {
  FaStar,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaSync,
  FaComment,
} from 'react-icons/fa';

/**
 * DOCTOR RATINGS PAGE
 * Trang xem đánh giá của bệnh nhân
 * 
 * Features:
 * - Xem điểm trung bình
 * - Danh sách đánh giá gần nhất
 * - Không sửa/xoá (read-only)
 */

const DoctorRatings = () => {
  const [ratingsData, setRatingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchRatings();
  }, [pagination.page]);

  const fetchRatings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await doctorService.getRatings({
        page: pagination.page,
        limit: pagination.limit
      });
      if (response.success) {
        setRatingsData(response.data);
        setPagination(response.data.pagination);
      } else {
        setError('Không thể tải danh sách đánh giá');
      }
    } catch (err) {
      console.error('Error fetching ratings:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <FaStar
        key={star}
        className={`text-lg ${
          star <= rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading && !ratingsData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const avgRating = ratingsData?.avg_rating || 0;
  const ratings = ratingsData?.ratings || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Đánh giá từ bệnh nhân</h1>
            <p className="text-gray-600 mt-1">Xem phản hồi và đánh giá của bệnh nhân</p>
          </div>
          <button
            onClick={fetchRatings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Average Rating Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">Điểm đánh giá trung bình</h2>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold">{avgRating.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                {renderStars(Math.round(avgRating))}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-blue-100 text-sm">
                Dựa trên {pagination.total} đánh giá từ bệnh nhân
              </p>
            </div>
          </div>
        </div>

        {/* Ratings List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Danh sách đánh giá</h2>

          {loading && ratings.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : ratings.length > 0 ? (
            <>
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div
                    key={rating.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FaUser className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{rating.patient_name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <FaCalendarAlt className="text-xs" />
                            <span>
                              {new Date(rating.appointment_date).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            {rating.appointment_time && (
                              <>
                                <FaClock className="text-xs ml-2" />
                                <span>{rating.appointment_time}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(rating.rating)}
                        <span className="ml-2 font-semibold text-gray-800">{rating.rating}/5</span>
                      </div>
                    </div>

                    {rating.comment && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FaComment className="text-gray-400 mt-1" />
                          <p className="text-gray-700 text-sm">{rating.comment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-700">
                    Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} đánh giá
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Trước
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Trang {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <FaStar className="text-4xl mx-auto mb-4 opacity-50" />
              <p>Chưa có đánh giá nào</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DoctorRatings;

