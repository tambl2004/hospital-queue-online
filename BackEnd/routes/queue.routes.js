const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queue.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

/**
 * QUEUE ROUTES
 * Quản lý hàng đợi & gọi số realtime
 * 
 * Quyền truy cập:
 * - ADMIN: Full access
 * - STAFF: Full access
 */

/**
 * @route   GET /api/queue/state
 * @desc    Lấy trạng thái queue theo doctor + date
 * @access  Admin, Staff, Doctor (chỉ xem queue của chính mình)
 * @query   doctor_id, date (YYYY-MM-DD)
 */
router.get(
  '/state',
  authenticate,
  requireRole(['ADMIN', 'STAFF', 'DOCTOR']),
  queueController.getQueueState
);

/**
 * @route   POST /api/queue/call-next
 * @desc    Gọi số tiếp theo (WAITING → CALLED)
 * @access  Admin, Staff
 * @body    doctor_id, date
 */
router.post(
  '/call-next',
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  queueController.callNext
);

/**
 * @route   POST /api/queue/start
 * @desc    Bắt đầu khám (CALLED/SKIPPED → IN_PROGRESS)
 * @access  Admin, Staff
 * @body    appointment_id, doctor_id, date
 */
router.post(
  '/start',
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  queueController.startAppointment
);

/**
 * @route   POST /api/queue/finish
 * @desc    Kết thúc khám (IN_PROGRESS → DONE)
 * @access  Admin, Staff
 * @body    appointment_id, doctor_id, date
 */
router.post(
  '/finish',
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  queueController.finishAppointment
);

/**
 * @route   POST /api/queue/skip
 * @desc    Bỏ qua số (CALLED → SKIPPED)
 * @access  Admin, Staff
 * @body    appointment_id, doctor_id, date, reason (optional)
 */
router.post(
  '/skip',
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  queueController.skipAppointment
);

/**
 * @route   POST /api/queue/recall
 * @desc    Gọi lại số (SKIPPED → CALLED)
 * @access  Admin, Staff
 * @body    appointment_id, doctor_id, date
 */
router.post(
  '/recall',
  authenticate,
  requireRole(['ADMIN', 'STAFF']),
  queueController.recallAppointment
);

module.exports = router;

