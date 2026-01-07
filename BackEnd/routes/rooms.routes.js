const express = require('express');
const { getRooms } = require('../controllers/rooms.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Tất cả routes đều yêu cầu xác thực và role ADMIN
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// Routes
router.get('/', getRooms);

module.exports = router;

