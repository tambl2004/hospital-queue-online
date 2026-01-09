import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
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

      {/* Forgot Password Form - Centered */}
      <div className="relative min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex">
          {/* Left Side - Image */}
          <div className="hidden lg:flex lg:w-1/2 bg-gray-100 items-center justify-center">
            <img 
              src="/image/login.png" 
              alt="Forgot password illustration" 
              className="w-full h-full object-cover rounded-l-3xl"
              style={{ minHeight: '500px' }}
            />
          </div>

          {/* Right Side - Forgot Password Form */}
          <div className="w-full lg:w-1/2 p-10 flex flex-col justify-center">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Quên mật khẩu
              </h1>
              <p className="text-gray-600 text-base">
                Nhập email của bạn để nhận link đặt lại mật khẩu
              </p>
            </div>

            {success ? (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm" role="alert">
                  <span className="block sm:inline">
                    Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn. 
                    Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
                  </span>
                </div>
                <div className="text-center">
                  <Link
                    to="/auth/login"
                    className="font-medium text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    Quay lại đăng nhập
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                    {error}
                  </div>
                )}

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
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
                  </button>
                </div>

                <div className="text-center">
                  <Link
                    to="/auth/login"
                    className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    Quay lại đăng nhập
                  </Link>
                </div>
              </form>
            )}
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

export default ForgotPassword;

