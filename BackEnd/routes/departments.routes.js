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

// GET routes: Cho phép ADMIN và STAFF (chỉ đọc)
router.get('/', requireRole(['ADMIN', 'STAFF']), getDepartments);
router.get('/:id', requireRole(['ADMIN', 'STAFF']), getDepartmentById);

// POST, PUT, PATCH routes: Chỉ ADMIN
router.post('/', requireRole(['ADMIN']), createDepartment);
router.put('/:id', requireRole(['ADMIN']), updateDepartment);
router.patch('/:id/status', requireRole(['ADMIN']), updateDepartmentStatus);

module.exports = router;

