import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Auth/Login';
import Register from './Auth/Register';
import ForgotPassword from './Auth/ForgotPassword';
import Dashboard from './Admin/Dashboard';
import AdminDepartmentList from './Admin/AdminDepartmentList';
import AdminDoctorList from './Admin/AdminDoctorList';
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
