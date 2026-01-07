// backend/routes/devices.routes.js
const express = require('express');
const { getDevices, getDeviceById, createDevice, updateDevice, deleteDevice } = require('../controllers/devices.controller');

const router = express.Router();

router.get('/', getDevices);
router.get('/:id', getDeviceById);
router.post('/', createDevice);
router.put('/:id', updateDevice);
router.delete('/:id', deleteDevice);

module.exports = router;

