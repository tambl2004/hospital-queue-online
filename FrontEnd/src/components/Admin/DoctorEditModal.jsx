import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const DoctorEditModal = ({
  isOpen,
  onClose,
  onSubmit,
  doctor = null,
  departments = [],
  rooms = [],
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    department_id: '',
    room_id: '',
    experience_years: '',
    bio: '',
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (doctor) {
      setFormData({
        department_id: doctor.department?.id || '',
        room_id: doctor.room?.id || '',
        experience_years: doctor.experience_years || '',
        bio: doctor.bio || '',
        is_active: doctor.is_active !== undefined ? doctor.is_active : true,
      });
    } else {
      setFormData({
        department_id: '',
        room_id: '',
        experience_years: '',
        bio: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [doctor, isOpen]);

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

    if (!formData.department_id) {
      newErrors.department_id = 'Chuyên khoa không được để trống';
    }

    if (
      formData.experience_years &&
      (isNaN(formData.experience_years) || formData.experience_years < 0)
    ) {
      newErrors.experience_years = 'Số năm kinh nghiệm phải >= 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const submitData = {
        department_id: parseInt(formData.department_id),
        room_id: formData.room_id ? parseInt(formData.room_id) : null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : 0,
        bio: formData.bio || null,
        is_active: formData.is_active,
      };
      onSubmit(submitData);
    }
  };

  // Lọc rooms theo department đã chọn
  const filteredRooms = formData.department_id
    ? rooms.filter((room) => (room.department?.id || room.department_id) === parseInt(formData.department_id))
    : [];

  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">Chỉnh sửa bác sĩ</h2>
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
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Thông tin tài khoản</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Tên:</span> {doctor.full_name}
              </p>
              <p>
                <span className="font-medium">Email:</span> {doctor.email}
              </p>
              {doctor.phone && (
                <p>
                  <span className="font-medium">Số điện thoại:</span> {doctor.phone}
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              * Thông tin tài khoản không thể chỉnh sửa tại đây
            </p>
          </div>

          {/* Thông tin bác sĩ */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin bác sĩ</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Department */}
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
              </div>

              {/* Room */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phòng khám</label>
                <select
                  name="room_id"
                  value={formData.room_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading || !formData.department_id}
                >
                  <option value="">Chọn phòng khám</option>
                  {filteredRooms
                    .filter((room) => room.is_active)
                    .map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.room_name} ({room.room_code})
                      </option>
                    ))}
                </select>
                {!formData.department_id && (
                  <p className="mt-1 text-sm text-gray-500">Vui lòng chọn chuyên khoa trước</p>
                )}
              </div>

              {/* Experience years */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kinh nghiệm (năm)</label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.experience_years ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  disabled={loading}
                />
                {errors.experience_years && (
                  <p className="mt-1 text-sm text-red-500">{errors.experience_years}</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tiểu sử</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tiểu sử bác sĩ (không bắt buộc)"
                disabled={loading}
              />
            </div>
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
              Kích hoạt bác sĩ
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

export default DoctorEditModal;

