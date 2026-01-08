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
 * - DOCTOR: Chỉ quản lý queue của chính mình
 */

/**
 * @route   GET /api/queue/state
 * @desc    Lấy trạng thái queue theo doctor + date
 * @access  Admin, Doctor (chỉ xem queue của chính mình), Patient (chỉ xem queue của appointment của mình)
 * @query   doctor_id, date (YYYY-MM-DD), appointment_id (cho PATIENT)
 */
router.get(
  '/state',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR', 'PATIENT']),
  queueController.getQueueState
);

/**
 * @route   POST /api/queue/call-next
 * @desc    Gọi số tiếp theo (WAITING → CALLED)
 * @access  Admin, Doctor (chỉ gọi số của chính mình)
 * @body    doctor_id, date
 */
router.post(
  '/call-next',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR']),
  queueController.callNext
);

/**
 * @route   POST /api/queue/start
 * @desc    Bắt đầu khám (CALLED/SKIPPED → IN_PROGRESS)
 * @access  Admin, Doctor (chỉ bắt đầu khám của chính mình)
 * @body    appointment_id, doctor_id, date
 */
router.post(
  '/start',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR']),
  queueController.startAppointment
);

/**
 * @route   POST /api/queue/finish
 * @desc    Kết thúc khám (IN_PROGRESS → DONE)
 * @access  Admin, Doctor (chỉ kết thúc khám của chính mình)
 * @body    appointment_id, doctor_id, date
 */
router.post(
  '/finish',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR']),
  queueController.finishAppointment
);

/**
 * @route   POST /api/queue/skip
 * @desc    Bỏ qua số (CALLED → SKIPPED)
 * @access  Admin, Doctor (chỉ bỏ qua số của chính mình)
 * @body    appointment_id, doctor_id, date, reason (optional)
 */
router.post(
  '/skip',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR']),
  queueController.skipAppointment
);

/**
 * @route   POST /api/queue/recall
 * @desc    Gọi lại số (SKIPPED → CALLED)
 * @access  Admin, Doctor (chỉ gọi lại số của chính mình)
 * @body    appointment_id, doctor_id, date
 */
router.post(
  '/recall',
  authenticate,
  requireRole(['ADMIN', 'DOCTOR']),
  queueController.recallAppointment
);

module.exports = router;

