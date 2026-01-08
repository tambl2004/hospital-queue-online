const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

/**
 * DOCTOR ROUTES
 * Quản lý dashboard và lịch cho bác sĩ
 * 
 * Quyền truy cập:
 * - DOCTOR: Full access
 * - ADMIN: Full access (có thể xem)
 */

/**
 * @route   GET /api/doctor/dashboard
 * @desc    Lấy dữ liệu dashboard cho Doctor (thông tin cá nhân, queue, lịch hôm nay)
 * @access  Doctor, Admin
 */
router.get(
  '/dashboard',
  authenticate,
  requireRole(['DOCTOR', 'ADMIN']),
  doctorController.getDashboardData
);

/**
 * @route   GET /api/doctor/schedules
 * @desc    Lấy danh sách lịch khám của Doctor theo ngày
 * @access  Doctor, Admin
 */
router.get(
  '/schedules',
  authenticate,
  requireRole(['DOCTOR', 'ADMIN']),
  doctorController.getSchedules
);

/**
 * @route   GET /api/doctor/appointments
 * @desc    Lấy danh sách lượt đăng ký hôm nay của Doctor
 * @access  Doctor, Admin
 * @query   status, page, limit
 */
router.get(
  '/appointments',
  authenticate,
  requireRole(['DOCTOR', 'ADMIN']),
  doctorController.getTodayAppointments
);

/**
 * @route   GET /api/doctor/ratings
 * @desc    Lấy danh sách đánh giá của Doctor (read-only)
 * @access  Doctor, Admin
 * @query   page, limit
 */
router.get(
  '/ratings',
  authenticate,
  requireRole(['DOCTOR', 'ADMIN']),
  doctorController.getRatings
);

module.exports = router;

