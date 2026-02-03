import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      
      // Lưu token vào localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      // Redirect dựa trên role (roles là array)
      const user = response.user;
      const roles = user.roles || [];
      
      if (roles.includes('ADMIN')) {
        navigate('/admin');
      } else if (roles.includes('DOCTOR')) {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient');
      }
      toast.success('Đăng nhập thành công');
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-teal-100 flex items-center justify-center px-4">
      {/* Login Form - Centered */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex">
          {/* Left Side - Image */}
          <div className="hidden lg:flex lg:w-1/2 bg-gray-100 items-center justify-center">
            <img 
              src="/image/login.png" 
              alt="Login illustration" 
              className="w-full h-full object-cover rounded-l-3xl"
              style={{ minHeight: '500px' }}
            />
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 p-10 flex flex-col justify-center">
            {/* Header */}
            <div className="mb-8">
              <Link to="/" className="inline-block mb-4">
                <span className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-2">
                  ← Về trang chủ
                </span>
              </Link>
              <h1 className="text-4xl font-bold text-gray-900">
                Xin chào
              </h1>
              <p className="text-gray-600 text-base">
                Chào mừng đến với Hệ thống Bệnh viện
               </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Mật khẩu"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">hoặc</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={() => authService.loginWithGoogle()}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập bằng Google
            </button>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            {/* Sign up link */}
            <div className="text-center">
              <span className="text-sm text-gray-500">
                Chưa có tài khoản?{' '}
                <Link
                  to="/auth/register"
                  className="font-medium text-gray-900 hover:text-orange-600 transition-colors"
                >
                  Đăng ký
                </Link>
              </span>
            </div>
            </form>
          </div>
        </div>
      </div>
   
  );
}

export default Login;

