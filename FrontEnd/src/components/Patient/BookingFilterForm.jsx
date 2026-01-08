import { useState, useEffect } from 'react';
import { patientService } from '../../services/patientService';
import { FaHospital, FaUserMd, FaCalendarAlt, FaSearch } from 'react-icons/fa';

function BookingFilterForm({ onSearch, loading }) {
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
      const response = await patientService.getDepartments({ 
        is_active: true,
        limit: 100 
      });
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

  const handleSearch = () => {
    if (!selectedDoctor || !selectedDate) {
      alert('Vui lòng chọn đầy đủ: Chuyên khoa, Bác sĩ và Ngày khám');
      return;
    }
    onSearch({
      department_id: selectedDepartment,
      doctor_id: selectedDoctor,
      appointment_date: selectedDate,
    });
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
        <FaSearch className="text-blue-600" />
        Tìm Lịch Trống
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Dropdown 1: Chuyên khoa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FaHospital className="text-blue-600" />
            Chuyên khoa <span className="text-red-500">*</span>
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
            Bác sĩ <span className="text-red-500">*</span>
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
            Ngày khám <span className="text-red-500">*</span>
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
            onClick={handleSearch}
            disabled={!selectedDoctor || !selectedDate || loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang tìm...
              </>
            ) : (
              <>
                <FaSearch />
                Tìm lịch trống
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingFilterForm;

