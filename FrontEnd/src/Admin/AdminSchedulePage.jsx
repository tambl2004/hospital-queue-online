import { useState, useEffect } from 'react';
import Layout from './Layout';
import ScheduleSlotRow from '../components/Admin/ScheduleSlotRow';
import ConfirmToggleStatusModal from '../components/Admin/ConfirmToggleStatusModal';
import { adminService } from '../services/adminService';
import { FaCalendarAlt, FaUserMd, FaPlus, FaSync, FaExclamationCircle } from 'react-icons/fa';

const AdminSchedulePage = () => {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState(null);

  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Bulk create form
  const [bulkForm, setBulkForm] = useState({
    shift_type: 'morning',
    max_patients: 1,
  });

  // Confirm modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'toggle', 'delete'
  const [targetSlot, setTargetSlot] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchDoctors();
    } else {
      setDoctors([]);
      setSelectedDoctorId('');
    }
  }, [selectedDepartmentId]);

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      fetchSchedules();
      setCurrentPage(1); // Reset về trang 1 khi thay đổi bác sĩ/ngày
    } else {
      setSchedules([]);
      setDoctorInfo(null);
      setCurrentPage(1);
    }
  }, [selectedDoctorId, selectedDate]);

  const fetchDepartments = async () => {
    try {
      const response = await adminService.getDepartments({ limit: 1000 });
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDoctors({
        department_id: selectedDepartmentId,
        status: 'active',
        limit: 1000,
      });
      if (response.success) {
        setDoctors(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Không thể tải danh sách bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    if (!selectedDoctorId || !selectedDate) return;

    try {
      setLoading(true);
      setError('');
      const response = await adminService.getSchedules({
        doctor_id: selectedDoctorId,
        work_date: selectedDate,
      });

      if (response.success) {
        setSchedules(response.data || []);
        setDoctorInfo(response.doctor || null);
      } else {
        setError('Không thể tải lịch khám');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tải lịch khám');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCreate = async () => {
    if (!selectedDoctorId || !selectedDate) {
      setError('Vui lòng chọn bác sĩ và ngày khám');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const response = await adminService.createBulkSchedules({
        doctor_id: selectedDoctorId,
        work_date: selectedDate,
        shift_type: bulkForm.shift_type,
        max_patients: parseInt(bulkForm.max_patients),
      });

      if (response.success) {
        setSuccess(response.message || 'Tạo lịch thành công');
        fetchSchedules();
        // Reset bulk form
        setBulkForm({
          shift_type: 'morning',
          max_patients: 1,
        });
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tạo lịch');
      }
    } catch (error) {
      console.error('Error creating bulk schedules:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo lịch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = (slotId, newStatus) => {
    const slot = schedules.find((s) => s.id === slotId);
    if (!slot) return;

    setTargetSlot(slot);
    setActionType('toggle');
    setIsConfirmModalOpen(true);
  };

  const handleUpdateMaxPatients = async (slotId, maxPatients) => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const response = await adminService.updateSchedule(slotId, {
        max_patients: maxPatients,
      });

      if (response.success) {
        setSuccess('Cập nhật số lượng tối đa thành công');
        fetchSchedules();
      } else {
        setError(response.message || 'Có lỗi xảy ra khi cập nhật');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (slotId) => {
    const slot = schedules.find((s) => s.id === slotId);
    if (!slot) return;

    setTargetSlot(slot);
    setActionType('delete');
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!targetSlot) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      if (actionType === 'toggle') {
        const response = await adminService.updateSchedule(targetSlot.id, {
          is_active: !targetSlot.is_active,
        });

        if (response.success) {
          setSuccess('Cập nhật trạng thái thành công');
          fetchSchedules();
        } else {
          setError(response.message || 'Có lỗi xảy ra');
        }
      } else if (actionType === 'delete') {
        const response = await adminService.deleteSchedule(targetSlot.id);

        if (response.success) {
          setSuccess('Xóa slot thành công');
          fetchSchedules();
        } else {
          setError(response.message || 'Có lỗi xảy ra');
        }
      }

      setIsConfirmModalOpen(false);
      setTargetSlot(null);
      setActionType('');
    } catch (error) {
      console.error('Error performing action:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // Set today as default date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(schedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSchedules = schedules.slice(startIndex, endIndex);

  return (
    <Layout>
      <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý lịch khám</h1>
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
            <FaExclamationCircle className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Khu A: Bộ chọn bác sĩ/ngày */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Chọn bác sĩ và ngày khám</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUserMd className="inline mr-2" />
                Chuyên khoa
              </label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => {
                  setSelectedDepartmentId(e.target.value);
                  setSelectedDoctorId('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn chuyên khoa</option>
                {departments
                  .filter((dept) => dept.is_active)
                  .map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUserMd className="inline mr-2" />
                Bác sĩ
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                disabled={!selectedDepartmentId || loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Chọn bác sĩ</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-2" />
                Ngày khám
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Doctor info */}
          {doctorInfo && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Bác sĩ:</span> {doctorInfo.name} |{' '}
                <span className="font-semibold">Chuyên khoa:</span> {doctorInfo.department?.name} |{' '}
                {doctorInfo.room && (
                  <>
                    <span className="font-semibold">Phòng:</span> {doctorInfo.room.name} ({doctorInfo.room.code})
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Khu B: Công cụ tạo lịch nhanh */}
        {selectedDoctorId && selectedDate && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Tạo lịch tự động</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Shift type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mẫu ca làm</label>
                <select
                  value={bulkForm.shift_type}
                  onChange={(e) => setBulkForm({ ...bulkForm, shift_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                >
                  <option value="morning">Ca sáng (08:00-12:00)</option>
                  <option value="afternoon">Ca chiều (13:30-17:30)</option>
                  <option value="full">Cả ngày (08:00-17:30)</option>
                </select>
              </div>

              {/* Max patients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng tối đa</label>
                <input
                  type="number"
                  value={bulkForm.max_patients}
                  onChange={(e) => setBulkForm({ ...bulkForm, max_patients: e.target.value })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
              </div>

              {/* Button */}
              <div className="flex items-end">
                <button
                  onClick={handleBulkCreate}
                  disabled={submitting || !selectedDoctorId || !selectedDate}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FaPlus />
                  <span>{submitting ? 'Đang tạo...' : 'Tạo slot tự động'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Khu C: Danh sách slot */}
        {selectedDoctorId && selectedDate && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Danh sách slot trong ngày</h2>
              <button
                onClick={fetchSchedules}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <FaSync className={loading ? 'animate-spin' : ''} />
                <span>Tải lại</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Chưa có slot nào. Vui lòng tạo lịch tự động ở trên.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Khung giờ
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số lượng tối đa
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đã đặt
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedSchedules.map((slot) => (
                        <ScheduleSlotRow
                          key={slot.id}
                          slot={slot}
                          onToggleActive={handleToggleActive}
                          onUpdateMaxPatients={handleUpdateMaxPatients}
                          onDelete={handleDelete}
                          loading={submitting}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
                    <div className="text-sm text-gray-700">
                      Hiển thị {startIndex + 1} đến {Math.min(endIndex, schedules.length)} của{' '}
                      {schedules.length} slot
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Trước
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Trang {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Confirm Modal */}
        <ConfirmToggleStatusModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setTargetSlot(null);
            setActionType('');
          }}
          onConfirm={handleConfirmAction}
          item={targetSlot}
          itemType="slot"
          actionType={actionType}
          loading={submitting}
        />
      </div>
    </Layout>
  );
};

export default AdminSchedulePage;

