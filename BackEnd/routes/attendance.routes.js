// backend/routes/attendance.routes.js
const express = require('express');
const { getAttendance, getAttendanceById, createAttendance, updateAttendance, deleteAttendance } = require('../controllers/attendance.controller');

const router = express.Router();

router.get('/', getAttendance);
router.get('/:id', getAttendanceById);
router.post('/', createAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

module.exports = router;

