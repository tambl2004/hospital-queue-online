import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import {
  FaChartBar,
  FaCalendarAlt,
  FaSignOutAlt,
  FaBars,
  FaList,
  FaClipboardList,
  FaUser,
  FaStar,
} from 'react-icons/fa';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  const menuItems = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: FaChartBar },
    { path: '/doctor/queue', label: 'Theo dõi hàng chờ', icon: FaList },
    { path: '/doctor/appointments', label: 'Lịch khám của tôi', icon: FaClipboardList },
    { path: '/doctor/schedule', label: 'Lịch làm việc', icon: FaCalendarAlt },
    { path: '/doctor/profile', label: 'Hồ sơ', icon: FaUser },
    { path: '/doctor/ratings', label: 'Đánh giá', icon: FaStar },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 text-gray-800 transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200">
          <img 
            src="/image/logobenhvien.png" 
            alt="Logo Bệnh viện" 
            className={`object-contain transition-all ${
              sidebarOpen ? 'h-14 w-auto' : 'h-14 w-14'
            }`}
          />
        </div>

        {/* Menu Items */}
        <nav className="p-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <item.icon className={`text-xl ${isActive ? 'text-white' : 'text-gray-600'}`} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            title={!sidebarOpen ? 'Đăng xuất' : ''}
          >
            <FaSignOutAlt className="text-xl" />
            {sidebarOpen && <span className="font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <FaBars className="text-xl" />
              </button>
              <h2 className="text-2xl font-bold text-gray-800">
                {menuItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">
                {user?.full_name || 'Bác sĩ'}
              </p>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

