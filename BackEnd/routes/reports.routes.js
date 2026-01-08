const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

/**
 * REPORTS ROUTES
 * Báo cáo thống kê appointments
 * 
 * Quyền truy cập:
 * - ADMIN: Full access
 */

/**
 * @route   GET /api/admin/reports
 * @desc    Lấy báo cáo thống kê appointments
 * @access  Admin
 * @query   from (YYYY-MM-DD), to (YYYY-MM-DD), department_id (optional), doctor_id (optional), status (optional)
 */
router.get(
  '/',
  authenticate,
  requireRole(['ADMIN']),
  reportsController.getReports
);

module.exports = router;

