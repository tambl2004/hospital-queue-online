import { FaStar, FaComment } from 'react-icons/fa';

/**
 * MyRatingView Component
 * Hiển thị đánh giá đã gửi (Khu C)
 */
function MyRatingView({ rating }) {
  if (!rating) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <FaStar className="text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-800">Đánh giá của bạn</h3>
      </div>

      {/* Stars */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              className={`text-xl ${
                star <= rating.rating
                  ? 'text-yellow-500 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {rating.rating} / 5
        </span>
      </div>

      {/* Comment */}
      {rating.comment && (
        <div className="mb-3">
          <div className="flex items-start gap-2">
            <FaComment className="text-gray-500 mt-1 flex-shrink-0" />
            <p className="text-gray-700 text-sm">{rating.comment}</p>
          </div>
        </div>
      )}

      {/* Created Date */}
      <p className="text-xs text-gray-500">
        Đánh giá vào: {formatDate(rating.created_at)}
      </p>
    </div>
  );
}

export default MyRatingView;

