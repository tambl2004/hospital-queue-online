const express = require('express');
const {
  getSchedules,
  createBulkSchedules,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/schedules.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Tất cả routes đều yêu cầu xác thực
router.use(authenticate);

// GET schedules: Cho phép ADMIN, STAFF và PATIENT (để xem lịch trống)
router.get('/', requireRole(['ADMIN', 'STAFF', 'PATIENT']), getSchedules);

// POST, PATCH, DELETE: Chỉ ADMIN và STAFF
router.post('/bulk', requireRole(['ADMIN', 'STAFF']), createBulkSchedules);
router.patch('/:id', requireRole(['ADMIN', 'STAFF']), updateSchedule);
router.delete('/:id', requireRole(['ADMIN', 'STAFF']), deleteSchedule);

module.exports = router;

