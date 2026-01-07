const express = require('express');
const {
  getSchedules,
  createBulkSchedules,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/schedules.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Tất cả routes đều yêu cầu xác thực và role ADMIN hoặc STAFF
router.use(authenticate);
router.use(requireRole(['ADMIN', 'STAFF']));

// Routes
router.get('/', getSchedules);
router.post('/bulk', createBulkSchedules);
router.patch('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

module.exports = router;

