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
 * @access  Admin, Staff, Patient (chỉ xem appointments của chính mình)
 * @query   date, doctor_id, department_id, room_id, status, search, page, limit, patient_id
 */
router.get(
  '/',
  authenticate,
  requireRole(['ADMIN', 'STAFF', 'PATIENT']),
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
 * @access  Admin, Staff, Patient (chỉ xem appointments của chính mình)
 */
router.get(
  '/:id',
  authenticate,
  requireRole(['ADMIN', 'STAFF', 'PATIENT']),
  appointmentsController.getAppointmentById
);

/**
 * @route   POST /api/appointments
 * @desc    Tạo appointment mới
 * @access  Admin, Staff, Patient (Patient tự đặt lịch cho mình)
 * @body    doctor_id, schedule_id, appointment_date, appointment_time, patient_id (chỉ Admin/Staff)
 */
router.post(
  '/',
  authenticate,
  requireRole(['ADMIN', 'STAFF', 'PATIENT']),
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
 * @access  Admin, Staff, Patient (chỉ hủy appointments của chính mình)
 * @body    reason (optional)
 */
router.patch(
  '/:id/cancel',
  authenticate,
  requireRole(['ADMIN', 'STAFF', 'PATIENT']),
  appointmentsController.cancelAppointment
);

/**
 * @route   GET /api/appointments/:id/rating
 * @desc    Lấy đánh giá của appointment (nếu có)
 * @access  Admin, Staff, Patient (chỉ xem rating của chính mình)
 */
router.get(
  '/:id/rating',
  authenticate,
  requireRole(['ADMIN', 'STAFF', 'PATIENT']),
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

