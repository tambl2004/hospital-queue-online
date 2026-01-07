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
const appointmentsRoutes = require('./appointments.routes');

router.use('/auth', authRoutes);
router.use('/admin/users', usersRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/devices', devicesRoutes);
router.use('/system', systemRoutes);
router.use('/admin/departments', departmentsRoutes);
router.use('/admin/doctors', doctorsRoutes);
router.use('/admin/rooms', roomsRoutes);
router.use('/admin/schedules', schedulesRoutes);
router.use('/appointments', appointmentsRoutes);

module.exports = router;

