import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Auth/Login';
import Register from './Auth/Register';
import ForgotPassword from './Auth/ForgotPassword';
import Dashboard from './Admin/Dashboard';
import AdminDepartmentList from './Admin/AdminDepartmentList';
import AdminDoctorList from './Admin/AdminDoctorList';
import AdminRoomList from './Admin/AdminRoomList';
import AdminSchedulePage from './Admin/AdminSchedulePage';
import AdminUserList from './Admin/AdminUserList';
import AdminAppointmentList from './Admin/AdminAppointmentList';
import AdminQueueDashboard from './Admin/AdminQueueDashboard';
import AdminReports from './Admin/AdminReports';
import StaffDashboard from './Staff/StaffDashboard';
import StaffAppointmentList from './Staff/StaffAppointmentList';
import StaffQueueDashboard from './Staff/StaffQueueDashboard';
import DoctorDashboard from './Doctor/DoctorDashboard';
import DoctorQueue from './Doctor/DoctorQueue';
import DoctorSchedule from './Doctor/DoctorSchedule';
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
        <Route path="/admin/users" element={<ProtectedRoute><AdminUserList /></ProtectedRoute>} />
        <Route path="/admin/departments" element={<ProtectedRoute><AdminDepartmentList /></ProtectedRoute>} />
        <Route path="/admin/doctors" element={<ProtectedRoute><AdminDoctorList /></ProtectedRoute>} />
        <Route path="/admin/rooms" element={<ProtectedRoute><AdminRoomList /></ProtectedRoute>} />
        <Route path="/admin/schedules" element={<ProtectedRoute><AdminSchedulePage /></ProtectedRoute>} />
        <Route path="/admin/appointments" element={<ProtectedRoute><AdminAppointmentList /></ProtectedRoute>} />
        <Route path="/admin/queue" element={<ProtectedRoute><AdminQueueDashboard /></ProtectedRoute>} />
        <Route path="/admin/statistics" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
        
        {/* Staff Routes */}
        <Route path="/staff/dashboard" element={<ProtectedRoute role="STAFF"><StaffDashboard /></ProtectedRoute>} />
        <Route path="/staff/appointments" element={<ProtectedRoute role="STAFF"><StaffAppointmentList /></ProtectedRoute>} />
        <Route path="/staff/queue" element={<ProtectedRoute role="STAFF"><StaffQueueDashboard /></ProtectedRoute>} />
        <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
        
        {/* Doctor Routes */}
        <Route path="/doctor/dashboard" element={<ProtectedRoute role="DOCTOR"><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/queue" element={<ProtectedRoute role="DOCTOR"><DoctorQueue /></ProtectedRoute>} />
        <Route path="/doctor/schedule" element={<ProtectedRoute role="DOCTOR"><DoctorSchedule /></ProtectedRoute>} />
        <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
        
        {/* Patient Routes */}
        <Route path="/patient" element={<ProtectedRoute><div>Bệnh nhân Dashboard</div></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

// Protected Route Component
function ProtectedRoute({ children, role }) {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // Check role if specified
  if (role) {
    const user = authService.getCurrentUser();
    const userRoles = user?.roles || [];
    
    if (!userRoles.includes(role) && !userRoles.includes('ADMIN')) {
      // Redirect based on user's role
      if (userRoles.includes('STAFF')) {
        return <Navigate to="/staff/dashboard" replace />;
      } else if (userRoles.includes('DOCTOR')) {
        return <Navigate to="/doctor/dashboard" replace />;
      } else {
        return <Navigate to="/auth/login" replace />;
      }
    }
  }
  
  return children;
}

export default App;
