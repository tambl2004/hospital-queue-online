import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { FaSearch, FaCalendarAlt, FaUserMd, FaHospital } from 'react-icons/fa';

function QuickBookingBar() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchDoctors();
    } else {
      setDoctors([]);
      setSelectedDoctor('');
    }
  }, [selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await patientService.getDepartments({ limit: 100 });
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchDoctors = async () => {
    if (!selectedDepartment) return;
    try {
      setLoadingDoctors(true);
      const response = await patientService.getDoctors({
        department_id: selectedDepartment,
        status: 'active',
        limit: 100,
      });
      if (response.success) {
        setDoctors(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleViewSchedule = () => {
    if (!selectedDoctor || !selectedDate) {
      alert('Vui lòng chọn đầy đủ: Chuyên khoa, Bác sĩ và Ngày khám');
      return;
    }
    // Redirect đến doctor detail với date query param
    navigate(`/doctors/${selectedDoctor}?date=${selectedDate}`);
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <FaSearch className="text-blue-600" />
        Đặt Lịch Nhanh
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Dropdown 1: Chuyên khoa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaHospital className="text-blue-600" />
            Chuyên khoa
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setSelectedDoctor('');
            }}
            disabled={loadingDepartments}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">-- Chọn chuyên khoa --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 2: Bác sĩ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaUserMd className="text-blue-600" />
            Bác sĩ
          </label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            disabled={!selectedDepartment || loadingDoctors}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">-- Chọn bác sĩ --</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaCalendarAlt className="text-blue-600" />
            Ngày khám
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Button */}
        <div className="flex items-end">
          <button
            onClick={handleViewSchedule}
            disabled={!selectedDoctor || !selectedDate}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <FaSearch />
            Xem lịch trống
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuickBookingBar;

