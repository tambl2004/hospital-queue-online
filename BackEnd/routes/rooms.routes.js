const express = require('express');
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  toggleRoomStatus,
} = require('../controllers/rooms.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Tất cả routes đều yêu cầu xác thực và role ADMIN
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// Routes
router.get('/', getRooms);
router.get('/:id', getRoomById);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.patch('/:id/status', toggleRoomStatus);

module.exports = router;

