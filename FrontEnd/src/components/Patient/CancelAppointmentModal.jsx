import { useState } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

function CancelAppointmentModal({ isOpen, onClose, onConfirm, appointment, loading }) {
  const [reason, setReason] = useState('');

  if (!isOpen || !appointment) return null;

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

  const handleConfirm = () => {
    onConfirm(appointment.id, reason || null);
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaExclamationTriangle className="text-yellow-500" />
            Xác Nhận Hủy Lịch
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Bạn có chắc chắn muốn hủy lịch khám này?
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">
              <strong>Bác sĩ:</strong> {appointment.doctor?.full_name || 'N/A'}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Chuyên khoa:</strong> {appointment.department?.name || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Thời gian:</strong> {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
            </p>
          </div>

          {/* Reason input (optional) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do hủy (Tùy chọn)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Nhập lý do hủy lịch..."
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Lưu ý:</strong> Sau khi hủy, bạn sẽ không thể khôi phục lịch khám này.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Không
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang hủy...
              </>
            ) : (
              'Xác nhận hủy'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelAppointmentModal;

