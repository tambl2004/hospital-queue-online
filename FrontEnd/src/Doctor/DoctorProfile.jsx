import { useState, useEffect } from 'react';
import Layout from './Layout';
import { doctorService } from '../services/doctorService';
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

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Thông tin cá nhân</h2>
          
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
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            <strong>Lưu ý:</strong> Thông tin hồ sơ chỉ để xem. Để thay đổi thông tin, vui lòng liên hệ quản trị viên.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default DoctorProfile;

