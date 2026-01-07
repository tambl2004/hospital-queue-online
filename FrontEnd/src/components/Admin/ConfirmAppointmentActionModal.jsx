import { useState } from 'react';
import { 
  FaTimes, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaPlay, 
  FaForward, 
  FaPhone 
} from 'react-icons/fa';
import appointmentService from '../../services/appointmentService';

/**
 * CONFIRM APPOINTMENT ACTION MODAL
 * Modal xác nhận thao tác với appointment (Hủy, Bắt đầu khám, Bỏ qua, Kết thúc, Gọi lại)
 * 
 * Props:
 * - appointment: Object - Thông tin appointment
 * - action: String - Loại action ('cancel', 'start', 'skip', 'complete', 'recall')
 * - onConfirm: Function - Callback khi xác nhận (reason)
 * - onClose: Function - Callback khi đóng modal
 */

const ConfirmAppointmentActionModal = ({ appointment, action, onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!appointment || !action) return null;

  // Lấy thông tin action
  const actionInfo = appointmentService
    .getAvailableActions(appointment.status)
    .find(a => a.key === action);

  if (!actionInfo) return null;

  // Xác định xem action này có cần lý do không
  const needsReason = ['cancel', 'skip'].includes(action);

  // Xác định icon và màu sắc
  const getIcon = () => {
    switch (action) {
      case 'cancel':
        return <FaTimesCircle className="w-12 h-12 text-red-500" />;
      case 'start':
        return <FaPlay className="w-12 h-12 text-blue-500" />;
      case 'skip':
        return <FaForward className="w-12 h-12 text-gray-500" />;
      case 'complete':
        return <FaCheckCircle className="w-12 h-12 text-green-500" />;
      case 'recall':
        return <FaPhone className="w-12 h-12 text-blue-500" />;
      default:
        return <FaExclamationTriangle className="w-12 h-12 text-yellow-500" />;
    }
  };

  const getTitle = () => {
    switch (action) {
      case 'cancel':
        return 'Xác nhận hủy lịch khám';
      case 'start':
        return 'Xác nhận bắt đầu khám';
      case 'skip':
        return 'Xác nhận bỏ qua lượt';
      case 'complete':
        return 'Xác nhận kết thúc khám';
      case 'recall':
        return 'Xác nhận gọi lại';
      default:
        return 'Xác nhận thao tác';
    }
  };

  const getMessage = () => {
    switch (action) {
      case 'cancel':
        return `Bạn có chắc chắn muốn hủy lịch khám của bệnh nhân "${appointment.patient_name}"?`;
      case 'start':
        return `Bắt đầu khám bệnh nhân "${appointment.patient_name}" (Số thứ tự: ${appointment.queue_number})?`;
      case 'skip':
        return `Bỏ qua lượt khám của bệnh nhân "${appointment.patient_name}" (Số thứ tự: ${appointment.queue_number})?`;
      case 'complete':
        return `Xác nhận hoàn thành khám bệnh nhân "${appointment.patient_name}"?`;
      case 'recall':
        return `Gọi lại bệnh nhân "${appointment.patient_name}" (Số thứ tự: ${appointment.queue_number})?`;
      default:
        return 'Bạn có chắc chắn muốn thực hiện thao tác này?';
    }
  };

  const handleConfirm = async () => {
    // Validate lý do nếu cần
    if (needsReason && !reason.trim()) {
      alert('Vui lòng nhập lý do');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason.trim() || null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !needsReason) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {getTitle()}
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Icon */}
            <div className="flex justify-center">
              {getIcon()}
            </div>

            {/* Message */}
            <p className="text-center text-gray-700">
              {getMessage()}
            </p>

            {/* Appointment Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Bệnh nhân:</span>
                <span className="font-medium text-gray-900">{appointment.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số điện thoại:</span>
                <span className="font-medium text-gray-900">{appointment.patient_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bác sĩ:</span>
                <span className="font-medium text-gray-900">{appointment.doctor_name}</span>
              </div>
              {appointment.queue_number && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Số thứ tự:</span>
                  <span className="font-bold text-blue-600 text-lg">{appointment.queue_number}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái hiện tại:</span>
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                  appointmentService.getStatusColor(appointment.status)
                }`}>
                  {appointmentService.getStatusLabel(appointment.status)}
                </span>
              </div>
            </div>

            {/* Reason Input (nếu cần) */}
            {needsReason && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do {action === 'cancel' ? 'hủy' : 'bỏ qua'} 
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`Nhập lý do ${action === 'cancel' ? 'hủy lịch' : 'bỏ qua lượt'}...`}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={loading}
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lý do sẽ được ghi lại trong hệ thống
                </p>
              </div>
            )}

            {/* Warning (cho action quan trọng) */}
            {['cancel', 'complete'].includes(action) && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <FaExclamationTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  {action === 'cancel' 
                    ? 'Sau khi hủy, lịch khám sẽ không thể khôi phục và bệnh nhân cần đặt lịch mới.'
                    : 'Sau khi hoàn thành, không thể thay đổi trạng thái của lượt khám này.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || (needsReason && !reason.trim())}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                action === 'cancel'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : action === 'complete'
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                actionInfo.label
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmAppointmentActionModal;

