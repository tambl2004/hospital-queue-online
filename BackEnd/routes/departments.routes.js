const express = require('express');
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
} = require('../controllers/departments.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Tất cả routes đều yêu cầu xác thực
router.use(authenticate);

// GET routes: Cho phép ADMIN, DOCTOR và PATIENT (chỉ đọc - public info)
router.get('/', requireRole(['ADMIN', 'DOCTOR', 'PATIENT']), getDepartments);
router.get('/:id', requireRole(['ADMIN', 'DOCTOR', 'PATIENT']), getDepartmentById);

// POST, PUT, PATCH routes: Chỉ ADMIN
router.post('/', requireRole(['ADMIN']), createDepartment);
router.put('/:id', requireRole(['ADMIN']), updateDepartment);
router.patch('/:id/status', requireRole(['ADMIN']), updateDepartmentStatus);

module.exports = router;

