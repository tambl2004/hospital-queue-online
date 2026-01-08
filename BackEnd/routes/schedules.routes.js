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

// GET schedules: Cho phép ADMIN, DOCTOR và PATIENT (để xem lịch trống)
router.get('/', requireRole(['ADMIN', 'DOCTOR', 'PATIENT']), getSchedules);

// POST, PATCH, DELETE: Chỉ ADMIN
router.post('/bulk', requireRole(['ADMIN']), createBulkSchedules);
router.patch('/:id', requireRole(['ADMIN']), updateSchedule);
router.delete('/:id', requireRole(['ADMIN']), deleteSchedule);

module.exports = router;

