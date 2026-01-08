// backend/routes/auth.routes.js
const express = require('express');
const { register, login, getMe, updateProfile, forgotPassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

module.exports = router;

