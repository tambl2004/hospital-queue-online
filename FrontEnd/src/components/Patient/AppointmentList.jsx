import AppointmentCard from './AppointmentCard';

function AppointmentList({ appointments, onCancel, loading }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return null; // Empty state sẽ được render ở component cha
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}

export default AppointmentList;

