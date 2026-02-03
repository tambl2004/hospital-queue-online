const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

/**
 * DOCTOR ROUTES
 * Quản lý dashboard và lịch cho bác sĩ
 * 
 * Quyền truy cập:
 * - DOCTOR: Full access
 * - ADMIN: Full access (có thể xem)
 */

/**
 * @route   GET /api/doctor/dashboard
 * @desc    Lấy dữ liệu dashboard cho Doctor (thông tin cá nhân, queue, lịch hôm nay)
 * @access  Doctor, Admin
 */
router.get(
  '/dashboard',
  authenticate,
  requireRole(['DOCTOR', 'ADMIN']),
  doctorController.getDashboardData
);

/**
 * @route   GET /api/doctor/schedules
 * @desc    Lấy danh sách lịch khám của Doctor theo ngày
 * @access  Doctor, Admin
 */
router.get(
  '/schedules',
  authenticate,
  requireRole(['DOCTOR', 'ADMIN']),
  doctorController.getSchedules
);

/**
 * @route   GET /api/doctor/appointments
 * @desc    Lấy danh sách lượt đăng ký hôm nay của Doctor
 * @access  Doctor, Admin
 * @query   status, page, limit
 */
router.get(
  '/appointments',
  authenticate,
  requireRole(['DOCTOR', 'ADMIN']),
  doctorController.getTodayAppointments
);

/**
 * @route   GET /api/doctor/ratings
 * @desc    Lấy danh sách đánh giá của Doctor (read-only)
 * @access  Doctor, Admin
 * @query   page, limit
 */
router.get(
  '/ratings',
  authenticate,
  requireRole(['DOCTOR', 'ADMIN']),
  doctorController.getRatings
);

// Upload config for doctor avatar
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'doctors');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `doctor_${req.user.id}_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const avatarFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('File không phải là ảnh'));
  }
  cb(null, true);
};

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

/**
 * @route   POST /api/doctor/profile/avatar
 * @desc    Cập nhật ảnh hồ sơ bác sĩ
 * @access  Doctor
 */
router.post(
  '/profile/avatar',
  authenticate,
  requireRole(['DOCTOR']),
  uploadAvatar.single('avatar'),
  doctorController.updateAvatar
);

module.exports = router;

