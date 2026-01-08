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
 * - DOCTOR: Xem và quản lý appointments của mình
 * - PATIENT: Xem và đặt appointments của mình
 */

// ===========================================
// ADMIN/DOCTOR ROUTES
// ===========================================

/**
 * @route   GET /api/appointments
 * @desc    Lấy danh sách appointments với filter
 * @access  Admin, Doctor (chỉ xem appointments của chính mình), Patient (chỉ xem appointments của chính mình)
 * @query   date, doctor_id, department_id, room_id, status, search, page, limit, patient_id
 */
router.get(
  '/',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR', 'PATIENT']),
  appointmentsController.getAppointments
);

/**
 * @route   GET /api/appointments/stats/daily
 * @desc    Lấy thống kê appointments theo ngày
 * @access  Admin, Doctor (chỉ xem stats của chính mình)
 * @query   date (YYYY-MM-DD)
 */
router.get(
  '/stats/daily',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR']),
  appointmentsController.getDailyStats
);

/**
 * @route   GET /api/appointments/doctor/:doctor_id/date/:date
 * @desc    Lấy danh sách appointments theo doctor và ngày (dùng cho Queue)
 * @access  Admin, Doctor (chỉ xem appointments của chính mình)
 */
router.get(
  '/doctor/:doctor_id/date/:date',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR']),
  appointmentsController.getAppointmentsByDoctorAndDate
);

/**
 * @route   GET /api/appointments/:id
 * @desc    Lấy chi tiết một appointment
 * @access  Admin, Doctor (chỉ xem appointments của chính mình), Patient (chỉ xem appointments của chính mình)
 */
router.get(
  '/:id',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR', 'PATIENT']),
  appointmentsController.getAppointmentById
);

/**
 * @route   POST /api/appointments
 * @desc    Tạo appointment mới
 * @access  Admin, Doctor (có thể đặt cho bệnh nhân), Patient (tự đặt lịch cho mình)
 * @body    doctor_id, schedule_id, appointment_date, appointment_time, patient_id (chỉ Admin/Doctor)
 */
router.post(
  '/',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR', 'PATIENT']),
  appointmentsController.createAppointment
);

/**
 * @route   PATCH /api/appointments/:id/status
 * @desc    Cập nhật trạng thái appointment (state machine)
 * @access  Admin, Doctor (chỉ cập nhật appointments của chính mình)
 * @body    status, reason (optional)
 */
router.patch(
  '/:id/status',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR']),
  appointmentsController.updateAppointmentStatus
);

/**
 * @route   PATCH /api/appointments/:id/cancel
 * @desc    Hủy appointment (chỉ khi WAITING)
 * @access  Admin, Doctor (chỉ hủy appointments của chính mình), Patient (chỉ hủy appointments của chính mình)
 * @body    reason (optional)
 */
router.patch(
  '/:id/cancel',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR', 'PATIENT']),
  appointmentsController.cancelAppointment
);

/**
 * @route   GET /api/appointments/:id/rating
 * @desc    Lấy đánh giá của appointment (nếu có)
 * @access  Admin, Doctor (chỉ xem ratings của appointments của chính mình), Patient (chỉ xem rating của chính mình)
 */
router.get(
  '/:id/rating',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR', 'PATIENT']),
  appointmentsController.getAppointmentRating
);

/**
 * @route   POST /api/appointments/:id/review
 * @desc    Đánh giá bác sĩ sau khi khám xong
 * @access  Patient (chỉ đánh giá appointments của chính mình)
 * @body    rating (1-5), comment (optional)
 */
router.post(
  '/:id/review',
  authenticate,
  requireRole(['PATIENT']),
  appointmentsController.reviewDoctor
);

module.exports = router;

