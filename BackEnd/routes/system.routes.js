// backend/routes/system.routes.js
const express = require('express');
const { getSystemInfo, updateSystemInfo } = require('../controllers/system.controller');

const router = express.Router();

router.get('/', getSystemInfo);
router.put('/', updateSystemInfo);

module.exports = router;

