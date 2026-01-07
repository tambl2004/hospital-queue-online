import { useState } from 'react';
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaLock, FaUnlock } from 'react-icons/fa';

const ScheduleSlotRow = ({ slot, onToggleActive, onUpdateMaxPatients, onDelete, loading = false }) => {
  const [isEditingMaxPatients, setIsEditingMaxPatients] = useState(false);
  const [maxPatientsValue, setMaxPatientsValue] = useState(slot.max_patients);
  const [maxPatientsError, setMaxPatientsError] = useState('');

  const isFull = slot.booked_count >= slot.max_patients;
  const canDelete = slot.booked_count === 0;

  const handleMaxPatientsChange = (e) => {
    const value = parseInt(e.target.value);
    setMaxPatientsValue(value);
    setMaxPatientsError('');

    if (isNaN(value) || value < 1) {
      setMaxPatientsError('Số lượng phải >= 1');
    } else if (value < slot.booked_count) {
      setMaxPatientsError(`Không thể nhỏ hơn ${slot.booked_count} (số đã đặt)`);
    }
  };

  const handleSaveMaxPatients = () => {
    if (maxPatientsError || maxPatientsValue === slot.max_patients) {
      return;
    }

    onUpdateMaxPatients(slot.id, maxPatientsValue);
    setIsEditingMaxPatients(false);
  };

  const handleCancelEdit = () => {
    setMaxPatientsValue(slot.max_patients);
    setMaxPatientsError('');
    setIsEditingMaxPatients(false);
  };

  const formatTime = (time) => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  return (
    <tr className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${!slot.is_active ? 'bg-gray-100 opacity-75' : ''}`}>
      <td className="px-4 py-3 text-sm">
        <div className="font-medium text-gray-900">
          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
        </div>
      </td>

      <td className="px-4 py-3 text-sm">
        {slot.is_active ? (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
            <FaUnlock className="text-base" />
            Mở
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-50 text-red-700 border border-red-200">
            <FaLock className="text-base" />
            Đóng
          </span>
        )}
      </td>

      <td className="px-4 py-3 text-sm">
        {isEditingMaxPatients ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={maxPatientsValue}
              onChange={handleMaxPatientsChange}
              min={slot.booked_count || 1}
              className={`w-20 px-2 py-1 border rounded text-sm ${
                maxPatientsError ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={loading}
            />
            <button
              onClick={handleSaveMaxPatients}
              disabled={loading || !!maxPatientsError || maxPatientsValue === slot.max_patients}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lưu
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={loading}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Hủy
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-medium">{slot.max_patients}</span>
            <button
              onClick={() => setIsEditingMaxPatients(true)}
              disabled={loading}
              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              title="Sửa số lượng tối đa"
            >
              <FaEdit className="text-base" />
            </button>
          </div>
        )}
        {maxPatientsError && (
          <p className="mt-1 text-xs text-red-500">{maxPatientsError}</p>
        )}
      </td>

      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isFull ? 'text-red-600' : 'text-gray-900'}`}>
            {slot.booked_count}
          </span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-600">{slot.max_patients}</span>
          {isFull && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
              Đầy
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleActive(slot.id, !slot.is_active)}
            disabled={loading}
            className={`p-2.5 rounded-lg transition-colors ${
              slot.is_active
                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={slot.is_active ? 'Đóng slot' : 'Mở slot'}
          >
            {slot.is_active ? <FaToggleOn className="text-xl" /> : <FaToggleOff className="text-xl" />}
          </button>

          <button
            onClick={() => onDelete(slot.id)}
            disabled={loading || !canDelete}
            className={`p-2.5 rounded-lg transition-colors ${
              canDelete
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } disabled:opacity-50`}
            title={canDelete ? 'Xóa slot' : 'Không thể xóa slot đã có người đặt'}
          >
            <FaTrash className="text-base" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ScheduleSlotRow;

