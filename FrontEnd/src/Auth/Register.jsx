import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: '',
    date_of_birth: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      const message = 'Mật khẩu xác nhận không khớp';
      setError(message);
      toast.error(message);
      return;
    }

    if (formData.password.length < 6) {
      const message = 'Mật khẩu phải có ít nhất 6 ký tự';
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authService.register(registerData);
      
      // Lưu token vào localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      // Redirect
      toast.success('Đăng ký thành công');
      navigate('/patient');
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-teal-100 flex items-center justify-center px-4">
      {/* Register Form - Centered */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex">
          {/* Left Side - Image */}
          <div className="hidden lg:flex lg:w-1/2 bg-gray-100 items-center justify-center">
            <img 
              src="/image/dangki.png" 
              alt="Register illustration" 
              className="w-full h-full object-cover rounded-l-3xl"
              style={{ minHeight: '600px' }}
            />
          </div>

          {/* Right Side - Register Form */}
          <div className="w-full lg:w-1/2 p-8 flex flex-col justify-center">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-4xl font-bold text-gray-900">
                Xin chào
              </h1>
              <p className="text-gray-600 text-base">
              Chào mừng đến với Hệ thống Bệnh viện
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Nhập họ và tên"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Nhập email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Nhập số điện thoại"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            {/* Gender and Date of Birth */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Giới tính
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày sinh
                </label>
                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>

            {/* Login link */}
            <div className="text-center pt-2">
              <span className="text-sm text-gray-500">
                Đã có tài khoản?{' '}
                <Link
                  to="/auth/login"
                  className="font-medium text-gray-900 hover:text-orange-600 transition-colors"
                >
                  Đăng nhập
                </Link>
              </span>
            </div>
            </form>
          </div>
        </div>
      </div>
    
  );
}

export default Register;

