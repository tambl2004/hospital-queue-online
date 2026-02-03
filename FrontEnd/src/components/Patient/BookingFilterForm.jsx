import { useState, useEffect } from 'react';
import { patientService } from '../../services/patientService';
import { FaHospital, FaUserMd, FaCalendarAlt, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';

function BookingFilterForm({ onSearch, loading }) {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

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

  const handleSearch = () => {
    if (!selectedDepartment || !selectedDate) {
      toast.error('Vui lòng chọn đầy đủ: Chuyên khoa và Ngày khám');
      return;
    }
    onSearch({
      department_id: selectedDepartment,
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            disabled={!selectedDepartment || !selectedDate || loading}
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

