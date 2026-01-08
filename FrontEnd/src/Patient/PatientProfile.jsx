import { useState, useEffect } from 'react';
import { patientService } from '../services/patientService';
import { authService } from '../services/authService';
import { FaUser } from 'react-icons/fa';
import ProfileHeaderCard from './ProfileHeaderCard';
import ProfileForm from './ProfileForm';

/**
 * PatientProfilePage Component
 * Trang hồ sơ cá nhân của bệnh nhân
 */
function PatientProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load user profile từ server
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Lấy từ server để đảm bảo dữ liệu mới nhất
      const response = await patientService.getProfile();
      if (response.success && response.user) {
        setUser(response.user);
        // Cập nhật localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
      } else {
        // Fallback: lấy từ localStorage nếu server fail
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      // Fallback: lấy từ localStorage
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        setError('Không thể tải thông tin hồ sơ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      const response = await patientService.updateProfile(formData);
      if (response.success && response.user) {
        // Cập nhật user state
        setUser(response.user);
        // Cập nhật localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        setSuccess(true);
        // Tự động ẩn message sau 3 giây
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <FaUser className="text-blue-600" />
        Hồ Sơ Cá Nhân
      </h1>

      {/* Khu A: Profile Summary */}
      <ProfileHeaderCard user={user} />

      {/* Khu B: Profile Form */}
      <ProfileForm
        initialData={user}
        onSubmit={handleSubmit}
        loading={saving}
        error={error}
        success={success}
      />
    </div>
  );
}

export default PatientProfile;

