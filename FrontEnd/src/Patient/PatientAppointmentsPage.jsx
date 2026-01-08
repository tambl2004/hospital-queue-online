import { useState, useEffect } from 'react';
import { patientService } from '../services/patientService';
import AppointmentStatusTabs from '../components/Patient/AppointmentStatusTabs';
import AppointmentList from '../components/Patient/AppointmentList';
import EmptyAppointments from '../components/Patient/EmptyAppointments';
import CancelAppointmentModal from '../components/Patient/CancelAppointmentModal';
import { FaList } from 'react-icons/fa';

function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, activeTab]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await patientService.getMyAppointments({
        patient_id: user.id,
        limit: 1000, // Lấy tất cả để filter ở client
      });

      if (response.success) {
        // Sort: lịch sắp tới trước
        const sorted = (response.data || []).sort((a, b) => {
          const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
          const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
          return dateA - dateB;
        });
        setAppointments(sorted);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    if (activeTab === 'all') {
      setFilteredAppointments(appointments);
      return;
    }

    // Mapping status theo tab (theo yêu cầu)
    // Đang chờ: WAITING + CALLED (SKIPPED có thể gộp vào đây)
    // Đang khám: IN_PROGRESS
    // Hoàn thành: DONE
    // Đã hủy: CANCELLED
    const statusMap = {
      waiting: ['WAITING', 'CALLED', 'SKIPPED'], // Gộp SKIPPED vào "Đang chờ"
      in_progress: ['IN_PROGRESS'],
      done: ['DONE'],
      cancelled: ['CANCELLED'],
    };

    const statuses = statusMap[activeTab] || [];
    const filtered = appointments.filter((apt) => statuses.includes(apt.status));
    setFilteredAppointments(filtered);
  };

  const handleTabChange = (tabKey, statuses) => {
    setActiveTab(tabKey);
  };

  const handleCancel = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (appointmentId, reason) => {
    try {
      setCancelling(true);
      await patientService.cancelAppointment(appointmentId, reason);
      
      // Cập nhật local state
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: 'CANCELLED' } : apt
        )
      );
      
      setShowCancelModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể hủy lịch khám');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      {/* Khu A: Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaList className="text-blue-600" />
          Lịch Đã Đặt Của Tôi
        </h1>
      </div>

      {/* Khu B: Tabs trạng thái */}
      <AppointmentStatusTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Khu C: Danh sách lịch hoặc Empty state */}
      {!loading && filteredAppointments.length === 0 ? (
        <EmptyAppointments />
      ) : (
        <AppointmentList
          appointments={filteredAppointments}
          onCancel={handleCancel}
          loading={loading}
        />
      )}

      {/* Khu D: Modal xác nhận hủy */}
      <CancelAppointmentModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedAppointment(null);
        }}
        onConfirm={handleConfirmCancel}
        appointment={selectedAppointment}
        loading={cancelling}
      />
    </div>
  );
}

export default PatientAppointmentsPage;

