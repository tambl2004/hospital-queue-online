import { useState, useEffect } from 'react';
import Layout from './Layout';
import { doctorService } from '../services/doctorService';
import { authService } from '../services/authService';
import {
  FaUserMd,
  FaHospital,
  FaDoorOpen,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaSync,
  FaStar,
} from 'react-icons/fa';

/**
 * DOCTOR PROFILE PAGE
 * Trang xem hồ sơ bác sĩ
 * 
 * Features:
 * - Xem thông tin cá nhân
 * - Xem chuyên khoa, phòng
 * - Xem điểm đánh giá trung bình
 * - Không cho sửa (read-only)
 */

const DoctorProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await doctorService.getProfile();
      if (response.success) {
        setProfileData(response.data);
      } else {
        setError('Không thể tải thông tin hồ sơ');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Dung lượng ảnh tối đa 2MB');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      setUploadError('');
      await doctorService.uploadAvatar(formData);
      await fetchProfile();
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setUploadError(err.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </Layout>
    );
  }

  const doctorInfo = profileData?.doctor_info || {};
  const avatarUrl = doctorInfo.avatar_url;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Hồ sơ bác sĩ</h1>
            <p className="text-gray-600 mt-1">Thông tin cá nhân và chuyên môn</p>
          </div>
          <button
            onClick={fetchProfile}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {/* Avatar + summary */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row items-start gap-6">
          <div className="w-24 h-24 bg-blue-100 rounded-lg overflow-hidden flex items-center justify-center text-3xl font-semibold text-blue-700 flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={doctorInfo.full_name || 'Ảnh bác sĩ'}
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUserMd className="text-blue-600" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tên bác sĩ</p>
              <p className="font-semibold text-gray-800 text-lg">{doctorInfo.full_name || '--'}</p>
            </div>
            <p className="text-sm text-gray-500">
              Ảnh hồ sơ sẽ được hiển thị với bệnh nhân và quản trị viên.
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <label className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 cursor-pointer text-sm">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                Chọn ảnh hồ sơ
              </label>
              {uploading && (
                <span className="text-sm text-gray-500">Đang tải ảnh...</span>
              )}
              {uploadError && (
                <span className="text-sm text-red-600">{uploadError}</span>
              )}
            </div>
          </div>
        </div>

        {/* Thông tin & liên hệ + chỉnh sửa + mật khẩu trong một card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Thông tin & liên hệ</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tên bác sĩ */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaUserMd className="text-blue-600 text-xl" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Tên bác sĩ</p>
                <p className="font-semibold text-gray-800 text-lg">{doctorInfo.full_name || '--'}</p>
              </div>
            </div>

            {/* Chuyên khoa */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaHospital className="text-green-600 text-xl" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Chuyên khoa</p>
                <p className="font-semibold text-gray-800 text-lg">{doctorInfo.department_name || '--'}</p>
              </div>
            </div>

            {/* Phòng khám */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaDoorOpen className="text-purple-600 text-xl" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Phòng khám</p>
                <p className="font-semibold text-gray-800 text-lg">
                  {doctorInfo.room_name || '--'} 
                  {doctorInfo.room_code && ` (${doctorInfo.room_code})`}
                </p>
              </div>
            </div>

            {/* Điểm đánh giá */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FaStar className="text-orange-600 text-xl" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Điểm đánh giá trung bình</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800 text-lg">
                    {doctorInfo.rating_avg ? parseFloat(doctorInfo.rating_avg).toFixed(1) : '0.0'}
                  </p>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`text-sm ${
                          star <= Math.round(parseFloat(doctorInfo.rating_avg || 0))
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form chỉnh sửa thông tin liên hệ (gộp chung trong card) */}
          <EditableDoctorUserInfo
            saving={profileSaving}
            setSaving={setProfileSaving}
            message={profileMessage}
            setMessage={setProfileMessage}
          />
        </div>
      </div>
    </Layout>
  );
};

// Form cập nhật thông tin user cơ bản dùng chung cho bác sĩ
const EditableDoctorUserInfo = ({ saving, setSaving, message, setMessage }) => {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authService.getMe();
        if (res.success && res.user) {
          const u = res.user;
          setForm({
            full_name: u.full_name || '',
            phone: u.phone || '',
            gender: u.gender || '',
            date_of_birth: u.date_of_birth || '',
            current_password: '',
            new_password: '',
            confirm_password: '',
          });
        }
      } catch (e) {
        console.error('Error loading user profile for doctor:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const { full_name, phone, gender, date_of_birth, current_password, new_password, confirm_password } =
        form;

      // 1. Cập nhật thông tin cơ bản
      const profileRes = await authService.updateProfile({
        full_name,
        phone,
        gender,
        date_of_birth,
      });

      let messages = [];

      if (profileRes.success) {
        if (profileRes.user) {
          localStorage.setItem('user', JSON.stringify(profileRes.user));
        }
        messages.push('Cập nhật thông tin thành công');
      } else if (profileRes.message) {
        messages.push(profileRes.message);
      }

      // 2. Nếu user nhập mật khẩu thì xử lý đổi mật khẩu
      if (current_password || new_password || confirm_password) {
        if (!current_password || !new_password || !confirm_password) {
          setMessage('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới');
          setSaving(false);
          return;
        }

        if (new_password !== confirm_password) {
          setMessage('Mật khẩu mới và xác nhận không khớp');
          setSaving(false);
          return;
        }

        const pwRes = await authService.changePassword(current_password, new_password);
        if (pwRes.success) {
          messages.push('Đổi mật khẩu thành công');
          setForm((prev) => ({
            ...prev,
            current_password: '',
            new_password: '',
            confirm_password: '',
          }));
        } else if (pwRes.message) {
          messages.push(pwRes.message);
        }
      }

      if (messages.length === 0) {
        messages.push('Cập nhật thành công');
      }

      setMessage(messages.join(' · '));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin / mật khẩu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-sm text-gray-500">Đang tải thông tin tài khoản...</p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Chỉnh sửa thông tin & mật khẩu</h3>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
          <select
            name="gender"
            value={form.gender || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Chọn --</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
          <input
            type="date"
            name="date_of_birth"
            value={form.date_of_birth || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Mật khẩu */}
        <div className="md:col-span-2 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Đổi mật khẩu</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
              <input
                type="password"
                name="current_password"
                value={form.current_password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
              <input
                type="password"
                name="new_password"
                value={form.new_password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex items-center justify-between mt-2">
          {message && (
            <p className="text-sm text-green-600">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorProfile;

