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
import DoctorDashboard from './Doctor/DoctorDashboard';
import DoctorQueue from './Doctor/DoctorQueue';
import DoctorSchedule from './Doctor/DoctorSchedule';
import DoctorAppointments from './Doctor/DoctorAppointments';
import DoctorProfile from './Doctor/DoctorProfile';
import DoctorRatings from './Doctor/DoctorRatings';
// Patient Public Routes
import DepartmentList from './Patient/DepartmentList';
import DoctorList from './Patient/DoctorList';
import DoctorDetail from './Patient/DoctorDetail';
// Patient Protected Routes
import Layout from './Patient/Layout';
import BookAppointment from './Patient/BookAppointment';
import MyAppointments from './Patient/MyAppointments';
import AppointmentDetail from './Patient/AppointmentDetail';
import QueueTracker from './Patient/QueueTracker';
import QueueTrackingList from './Patient/QueueTrackingList';
import PatientProfile from './Patient/PatientProfile';
import DoctorReview from './Patient/DoctorReview';
import { authService } from './services/authService';

function App() {
  return (
    <Router>
      <Routes>
        {/* Root - Redirect to Login */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        
        {/* Auth Routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        
        {/* Auth Routes (alias) */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/register" replace />} />
        
        {/* Public Patient Routes (only accessible after login or for browsing) */}
        <Route path="/departments" element={<DepartmentList />} />
        <Route path="/departments/:departmentId/doctors" element={<DoctorList />} />
        <Route path="/doctors" element={<DoctorList />} />
        <Route path="/doctors/:id" element={<DoctorDetail />} />
        
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
        
        
        {/* Doctor Routes */}
        <Route path="/doctor/dashboard" element={<ProtectedRoute role="DOCTOR"><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/queue" element={<ProtectedRoute role="DOCTOR"><DoctorQueue /></ProtectedRoute>} />
        <Route path="/doctor/schedule" element={<ProtectedRoute role="DOCTOR"><DoctorSchedule /></ProtectedRoute>} />
        <Route path="/doctor/appointments" element={<ProtectedRoute role="DOCTOR"><DoctorAppointments /></ProtectedRoute>} />
        <Route path="/doctor/profile" element={<ProtectedRoute role="DOCTOR"><DoctorProfile /></ProtectedRoute>} />
        <Route path="/doctor/ratings" element={<ProtectedRoute role="DOCTOR"><DoctorRatings /></ProtectedRoute>} />
        <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
        
        {/* Patient Protected Routes */}
        <Route
          path="/patient/book"
          element={
            <ProtectedRoute>
              <Layout>
                <BookAppointment />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute>
              <Layout>
                <MyAppointments />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-appointments"
          element={
            <ProtectedRoute>
              <Layout>
                <MyAppointments />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <AppointmentDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/queue/:appointmentId"
          element={
            <ProtectedRoute>
              <Layout>
                <QueueTracker />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/queue"
          element={
            <ProtectedRoute>
              <Layout>
                <QueueTrackingList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/queue/:appointmentId"
          element={
            <ProtectedRoute>
              <Layout>
                <QueueTracker />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <PatientProfile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/review/:appointmentId"
          element={
            <ProtectedRoute>
              <Layout>
                <DoctorReview />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/patient" element={<Navigate to="/my-appointments" replace />} />
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
      if (userRoles.includes('DOCTOR')) {
        return <Navigate to="/doctor/dashboard" replace />;
      } else {
        return <Navigate to="/auth/login" replace />;
      }
    }
  }
  
  return children;
}

export default App;
