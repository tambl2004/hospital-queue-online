const express = require('express');
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  updateDoctorStatus,
} = require('../controllers/doctors.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Tất cả routes đều yêu cầu xác thực
router.use(authenticate);

// GET routes: Cho phép ADMIN, STAFF và PATIENT (chỉ đọc - public info)
router.get('/', requireRole(['ADMIN', 'STAFF', 'PATIENT']), getDoctors);
router.get('/:id', requireRole(['ADMIN', 'STAFF', 'PATIENT']), getDoctorById);

// POST, PUT, PATCH routes: Chỉ ADMIN
router.post('/', requireRole(['ADMIN']), createDoctor);
router.put('/:id', requireRole(['ADMIN']), updateDoctor);
router.patch('/:id/status', requireRole(['ADMIN']), updateDoctorStatus);

module.exports = router;

