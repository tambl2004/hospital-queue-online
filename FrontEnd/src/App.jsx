import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Auth/Login';
import Register from './Auth/Register';
import ForgotPassword from './Auth/ForgotPassword';
import Dashboard from './Admin/Dashboard';
import AdminDepartmentList from './Admin/AdminDepartmentList';
import AdminDoctorList from './Admin/AdminDoctorList';
import AdminRoomList from './Admin/AdminRoomList';
import AdminSchedulePage from './Admin/AdminSchedulePage';
import { authService } from './services/authService';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        
        {/* Protected Routes */}
        <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/departments" element={<ProtectedRoute><AdminDepartmentList /></ProtectedRoute>} />
        <Route path="/admin/doctors" element={<ProtectedRoute><AdminDoctorList /></ProtectedRoute>} />
        <Route path="/admin/rooms" element={<ProtectedRoute><AdminRoomList /></ProtectedRoute>} />
        <Route path="/admin/schedules" element={<ProtectedRoute><AdminSchedulePage /></ProtectedRoute>} />
        <Route path="/admin/appointments" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Quản lý lượt đăng ký</h1><p className="mt-4 text-gray-600">Chức năng đang được phát triển...</p></div></ProtectedRoute>} />
        <Route path="/admin/queue" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Queue & gọi số (Realtime)</h1><p className="mt-4 text-gray-600">Chức năng đang được phát triển...</p></div></ProtectedRoute>} />
        <Route path="/admin/statistics" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Thống kê</h1><p className="mt-4 text-gray-600">Chức năng đang được phát triển...</p></div></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute><div>Doctor Dashboard</div></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><div>Staff Dashboard</div></ProtectedRoute>} />
        <Route path="/patient" element={<ProtectedRoute><div>Patient Dashboard</div></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  
  return children;
}

export default App;
