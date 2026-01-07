// backend/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const attendanceRoutes = require('./attendance.routes');
const devicesRoutes = require('./devices.routes');
const systemRoutes = require('./system.routes');
const departmentsRoutes = require('./departments.routes');
const doctorsRoutes = require('./doctors.routes');
const roomsRoutes = require('./rooms.routes');
const schedulesRoutes = require('./schedules.routes');

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/devices', devicesRoutes);
router.use('/system', systemRoutes);
router.use('/admin/departments', departmentsRoutes);
router.use('/admin/doctors', doctorsRoutes);
router.use('/admin/rooms', roomsRoutes);
router.use('/admin/schedules', schedulesRoutes);

module.exports = router;

