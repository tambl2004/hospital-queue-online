import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tempToken = searchParams.get('temp_token');
    const error = searchParams.get('error');

    if (error) {
      let errorMessage = 'Đăng nhập Google thất bại';
      switch (error) {
        case 'no_code':
          errorMessage = 'Không nhận được mã xác thực từ Google';
          break;
        case 'no_email':
          errorMessage = 'Google không cung cấp email';
          break;
        case 'account_locked':
          errorMessage = 'Tài khoản đã bị khóa';
          break;
        case 'callback_error':
          errorMessage = 'Lỗi xử lý đăng nhập Google';
          break;
        default:
          errorMessage = `Lỗi: ${error}`;
      }
      toast.error(errorMessage);
      navigate('/auth/login');
      return;
    }

    if (tempToken) {
      // Gọi API để đổi temp token lấy JWT token thực sự
      api.post('/auth/google/exchange-token', { temp_token: tempToken })
        .then((response) => {
          const { token, user } = response.data;

          if (token && user) {
            // Lưu token và user vào localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Redirect dựa trên role
            const roles = user.roles || [];
            if (roles.includes('ADMIN')) {
              navigate('/admin');
            } else if (roles.includes('DOCTOR')) {
              navigate('/doctor/dashboard');
            } else {
              navigate('/patient');
            }

            toast.success('Đăng nhập Google thành công');
          } else {
            toast.error('Không nhận được thông tin đăng nhập');
            navigate('/auth/login');
          }
        })
        .catch((err) => {
          console.error('Error exchanging token:', err);
          const message = err.response?.data?.message || 'Lỗi xử lý đăng nhập Google';
          toast.error(message);
          navigate('/auth/login');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      toast.error('Không nhận được thông tin đăng nhập');
      navigate('/auth/login');
      setLoading(false);
    }
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Đang xử lý đăng nhập Google...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default GoogleCallback;

