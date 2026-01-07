const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointments.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

/**
 * APPOINTMENTS ROUTES
 * Quản lý lượt đăng ký khám bệnh
 * 
 * Quyền truy cập:
 * - ADMIN: Full access
 * - STAFF: Full access (hoặc có thể giới hạn theo ngày)
 * - DOCTOR: Xem appointments của mình
 * - PATIENT: Xem appointments của mình
 */

// ===========================================
// PUBLIC / PATIENT ROUTES (nếu cần)
// ===========================================
// TODO: Thêm routes cho Patient xem appointments của mình

// ===========================================
// ADMIN/STAFF ROUTES
// ===========================================

/**
 * @route   GET /api/appointments
 * @desc    Lấy danh sách appointments với filter
 * @access  Admin, Staff
 * @query   date, doctor_id, department_id, room_id, status, search, page, limit
 */
router.get(
  '/',
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  appointmentsController.getAppointments
);

/**
 * @route   GET /api/appointments/stats/daily
 * @desc    Lấy thống kê appointments theo ngày
 * @access  Admin, Staff
 * @query   date (YYYY-MM-DD)
 */
router.get(
  '/stats/daily',
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  appointmentsController.getDailyStats
);

/**
 * @route   GET /api/appointments/doctor/:doctor_id/date/:date
 * @desc    Lấy danh sách appointments theo doctor và ngày (dùng cho Queue)
 * @access  Admin, Staff, Doctor
 */
router.get(
  '/doctor/:doctor_id/date/:date',
  authenticate,
  requireRole(['ADMIN', 'STAFF', 'DOCTOR']),
  appointmentsController.getAppointmentsByDoctorAndDate
);

/**
 * @route   GET /api/appointments/:id
 * @desc    Lấy chi tiết một appointment
 * @access  Admin, Staff
 */
router.get(
  '/:id',
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  appointmentsController.getAppointmentById
);

/**
 * @route   POST /api/appointments
 * @desc    Tạo appointment mới (Admin/Staff tạo thủ công)
 * @access  Admin, Staff
 * @body    patient_id, doctor_id, schedule_id, appointment_date, appointment_time
 */
router.post(
  '/',
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  appointmentsController.createAppointment
);

/**
 * @route   PATCH /api/appointments/:id/status
 * @desc    Cập nhật trạng thái appointment (state machine)
 * @access  Admin, Staff
 * @body    status, reason (optional)
 */
router.patch(
  '/:id/status',
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  appointmentsController.updateAppointmentStatus
);

/**
 * @route   PATCH /api/appointments/:id/cancel
 * @desc    Hủy appointment (chỉ khi WAITING)
 * @access  Admin, Staff
 * @body    reason (optional)
 */
router.patch(
  '/:id/cancel',
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  appointmentsController.cancelAppointment
);

module.exports = router;

