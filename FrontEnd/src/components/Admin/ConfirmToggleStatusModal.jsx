import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const ConfirmToggleStatusModal = ({
  isOpen,
  onClose,
  onConfirm,
  item = null,
  itemType = 'mục',
  loading = false,
}) => {
  if (!isOpen || !item) return null;

  const newStatus = !item.is_active;
  const action = newStatus ? 'kích hoạt' : 'ngừng hoạt động';
  const itemName = item.full_name || item.name || `#${item.id}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Xác nhận</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <FaTimes className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="text-yellow-500 text-2xl" />
            </div>
            <div className="flex-1">
              <p className="text-gray-700 mb-2">
                Bạn có chắc chắn muốn <span className="font-semibold">{action}</span> {itemType}:
              </p>
              <p className="text-lg font-semibold text-gray-900 mb-4">{itemName}</p>
              {!newStatus && (
                <p className="text-sm text-gray-500">
                  {itemType === 'bác sĩ' &&
                    'Bác sĩ sẽ không hiển thị trong danh sách đặt lịch mới, nhưng vẫn giữ lịch sử khám.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              newStatus
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmToggleStatusModal;

