// backend/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const attendanceRoutes = require('./attendance.routes');
const devicesRoutes = require('./devices.routes');
const systemRoutes = require('./system.routes');

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/devices', devicesRoutes);
router.use('/system', systemRoutes);

module.exports = router;

