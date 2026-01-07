import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const RoomEditModal = ({
  isOpen,
  onClose,
  onSubmit,
  room = null,
  departments = [],
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    room_name: '',
    department_id: '',
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (room) {
      setFormData({
        room_name: room.room_name || '',
        department_id: room.department?.id || '',
        is_active: room.is_active !== undefined ? room.is_active : true,
      });
    } else {
      setFormData({
        room_name: '',
        department_id: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [room, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error khi user nhập
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Validate department_id
    if (!formData.department_id) {
      newErrors.department_id = 'Chuyên khoa không được để trống';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const submitData = {
        room_name: formData.room_name.trim() || null,
        department_id: parseInt(formData.department_id),
        is_active: formData.is_active,
      };
      onSubmit(submitData);
    }
  };

  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">Chỉnh sửa phòng khám</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <FaTimes className="text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Thông tin không thể sửa */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Thông tin không thể sửa</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Mã phòng:</span> {room.room_code}
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              * Mã phòng không thể chỉnh sửa để đảm bảo tính ổn định dữ liệu và thống kê
            </p>
          </div>

          {/* Tên phòng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên phòng</label>
            <input
              type="text"
              name="room_name"
              value={formData.room_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên phòng"
              disabled={loading}
            />
          </div>

          {/* Chuyên khoa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chuyên khoa <span className="text-red-500">*</span>
            </label>
            <select
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.department_id ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              <option value="">Chọn chuyên khoa</option>
              {departments
                .filter((dept) => dept.is_active)
                .map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
            </select>
            {errors.department_id && (
              <p className="mt-1 text-sm text-red-500">{errors.department_id}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              * Không thể đổi chuyên khoa nếu phòng đã có bác sĩ được gán
            </p>
          </div>

          {/* Trạng thái */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              id="is_active"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
              Kích hoạt phòng khám
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomEditModal;

