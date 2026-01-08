import { useState } from 'react';
import { FaStar, FaTimes, FaSpinner } from 'react-icons/fa';

/**
 * DoctorRatingModal Component
 * Modal đánh giá bác sĩ (Khu B)
 */
function DoctorRatingModal({ isOpen, onClose, onSubmit, loading = false, error = '' }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      return;
    }
    onSubmit(rating, comment.trim() || null);
  };

  const handleClose = () => {
    if (!loading) {
      setRating(0);
      setHoveredRating(0);
      setComment('');
      onClose();
    }
  };

  const handleStarClick = (value) => {
    if (!loading) {
      setRating(value);
    }
  };

  const handleStarHover = (value) => {
    if (!loading) {
      setHoveredRating(value);
    }
  };

  const handleStarLeave = () => {
    if (!loading) {
      setHoveredRating(0);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Đánh giá bác sĩ</h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <FaTimes className="text-gray-600" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Đánh giá sao <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    onMouseLeave={handleStarLeave}
                    disabled={loading}
                    className="focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-110"
                  >
                    <FaStar
                      className={`text-4xl ${
                        star <= displayRating
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {rating} / 5
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Nhấp vào sao để chọn đánh giá
              </p>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhận xét (tùy chọn)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={loading}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Chia sẻ trải nghiệm của bạn về bác sĩ..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length} / 500 ký tự
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={loading || rating < 1}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  'Gửi đánh giá'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default DoctorRatingModal;

