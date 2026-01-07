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

// Tất cả routes đều yêu cầu xác thực và role ADMIN
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// Routes
router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.post('/', createDoctor);
router.put('/:id', updateDoctor);
router.patch('/:id/status', updateDoctorStatus);

module.exports = router;

