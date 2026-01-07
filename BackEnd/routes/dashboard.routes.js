const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

/**
 * DASHBOARD ROUTES
 * Trang tổng quan vận hành
 * 
 * Quyền truy cập:
 * - ADMIN: Full access
 * - STAFF: Full access
 */

/**
 * @route   GET /api/admin/dashboard
 * @desc    Lấy dữ liệu dashboard tổng quan (hôm nay + 7 ngày gần nhất)
 * @access  Admin, Staff
 */
router.get(
  '/',
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  dashboardController.getDashboardData
);

module.exports = router;

