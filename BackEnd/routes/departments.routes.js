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

// Tất cả routes đều yêu cầu xác thực và role ADMIN
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// Routes
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.patch('/:id/status', updateDepartmentStatus);

module.exports = router;

