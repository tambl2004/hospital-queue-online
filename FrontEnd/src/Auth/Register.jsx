import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

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
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
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
      navigate('/patient');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full Screen Cosmic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-black">
        {/* Stars */}
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                opacity: Math.random() * 0.8 + 0.2,
                animation: `twinkle ${Math.random() * 3 + 2}s infinite`
              }}
            />
          ))}
        </div>
        
        {/* Moon */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 opacity-60 blur-xl" />
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full bg-blue-300 opacity-40" />
        
        {/* Mountains/Planets */}
        <div className="absolute bottom-0 left-0 right-0 h-64">
          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-gray-900 via-gray-800 to-transparent opacity-60">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gray-900 transform rotate-45 origin-bottom-left opacity-80" />
            <div className="absolute bottom-0 left-24 w-40 h-40 bg-gray-800 transform rotate-45 origin-bottom-left opacity-70" />
            <div className="absolute bottom-0 right-32 w-36 h-36 bg-gray-900 transform rotate-45 origin-bottom-right opacity-80" />
          </div>
        </div>
        
        {/* Large Planet */}
        <div className="absolute top-32 right-16 w-48 h-48 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 opacity-50 blur-sm" />
      </div>

      {/* Register Form - Centered */}
      <div className="relative min-h-screen flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex">
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

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default Register;

