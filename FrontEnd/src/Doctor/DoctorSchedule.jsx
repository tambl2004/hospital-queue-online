import { useState, useEffect } from 'react';
import Layout from './Layout';
import { doctorService } from '../services/doctorService';
import {
  FaCalendarAlt,
  FaClock,
  FaSync,
  FaExclamationCircle,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';

/**
 * DOCTOR SCHEDULE PAGE
 * Trang xem lịch khám của bác sĩ
 * 
 * Features:
 * - Xem lịch khám theo ngày
 * - Hiển thị slot giờ, số đã đặt/max, trạng thái
 * - Phân trang 10 slot/trang
 */

const DoctorSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch doctor info and schedules
  useEffect(() => {
    fetchDoctorInfo();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchSchedules();
      setCurrentPage(1); // Reset về trang 1 khi thay đổi ngày
    }
  }, [selectedDate]);

  const fetchDoctorInfo = async () => {
    try {
      const response = await doctorService.getDashboardData();
      if (response.success) {
        setDoctorInfo(response.data.doctor_info);
      }
    } catch (err) {
      console.error('Error fetching doctor info:', err);
      setError('Không thể tải thông tin bác sĩ');
    }
  };

  const fetchSchedules = async () => {
    if (!selectedDate) return;

    try {
      setLoading(true);
      setError(null);
      const response = await doctorService.getSchedules({
        work_date: selectedDate,
      });

      if (response.success) {
        setSchedules(response.data || []);
        if (response.doctor) {
          setDoctorInfo({
            doctor_id: response.doctor.id,
            full_name: response.doctor.name,
            department_name: response.doctor.department?.name || '',
          });
        }
      } else {
        setError('Không thể tải lịch khám');
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải lịch khám');
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(schedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSchedules = schedules.slice(startIndex, endIndex);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Lịch khám</h1>
            <p className="text-gray-600 mt-1">
              Xem lịch khám theo ngày
            </p>
          </div>
          <button
            onClick={fetchSchedules}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaExclamationCircle />
            {error}
          </div>
        )}

        {/* Date Selector */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Chọn ngày:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {doctorInfo && (
              <div className="ml-auto text-sm text-gray-600">
                <span className="font-medium">{doctorInfo.full_name}</span>
                {' - '}
                <span>{doctorInfo.department_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Schedule List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Lịch khám {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          ) : currentSchedules.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Không có lịch khám cho ngày đã chọn
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {currentSchedules.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-lg border ${
                      slot.booked_count >= slot.max_patients
                        ? 'bg-red-50 border-red-200'
                        : slot.booked_count > 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <FaClock className="text-gray-400" />
                        <span className="font-semibold text-gray-800">
                          {slot.start_time ? slot.start_time.toString().slice(0, 5) : '--'}
                          {slot.end_time && ` - ${slot.end_time.toString().slice(0, 5)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          slot.booked_count >= slot.max_patients
                            ? 'bg-red-100 text-red-800'
                            : slot.booked_count > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {slot.booked_count >= slot.max_patients ? 'Đầy' : slot.booked_count > 0 ? 'Có lịch' : 'Trống'}
                        </span>
                        {!slot.is_active && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Tạm ngưng
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{slot.booked_count}</span> / {slot.max_patients} bệnh nhân
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-700">
                    Hiển thị {startIndex + 1} - {Math.min(endIndex, schedules.length)} / {schedules.length} slot
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaChevronLeft />
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Trang {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DoctorSchedule;

