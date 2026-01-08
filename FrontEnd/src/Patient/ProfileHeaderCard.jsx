import { FaUser, FaEnvelope, FaCheckCircle } from 'react-icons/fa';

/**
 * ProfileHeaderCard Component
 * Hiển thị thông tin tóm tắt hồ sơ (Khu A)
 */
function ProfileHeaderCard({ user }) {
  if (!user) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white mb-6">
      <div className="flex items-center gap-4">
        <div className="bg-white bg-opacity-20 rounded-full p-4">
          <FaUser className="text-3xl" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-1">{user.full_name || 'Chưa cập nhật'}</h2>
          <div className="flex items-center gap-2 text-blue-100">
            <FaEnvelope className="text-sm" />
            <span className="text-sm">{user.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full">
          <FaCheckCircle className="text-green-300" />
          <span className="text-sm font-medium">
            {user.is_active ? 'Tài khoản hoạt động' : 'Tài khoản bị khóa'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeaderCard;

