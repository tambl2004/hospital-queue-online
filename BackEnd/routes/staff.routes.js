const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

/**
 * STAFF ROUTES
 * Quản lý vận hành cho nhân viên
 * 
 * Quyền truy cập:
 * - STAFF: Full access
 * - ADMIN: Full access (có thể xem)
 */

/**
 * @route   GET /api/staff/dashboard
 * @desc    Lấy dữ liệu dashboard cho Staff (KPI hôm nay + danh sách đang chờ)
 * @access  Staff, Admin
 */
router.get(
  '/dashboard',
  authenticate,
  requireRole(['STAFF', 'ADMIN']),
  staffController.getDashboardData
);

/**
 * @route   GET /api/staff/appointments
 * @desc    Lấy danh sách lượt đăng ký hôm nay
 * @access  Staff, Admin
 */
router.get(
  '/appointments',
  authenticate,
  requireRole(['STAFF', 'ADMIN']),
  staffController.getTodayAppointments
);

module.exports = router;

