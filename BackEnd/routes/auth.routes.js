// backend/routes/auth.routes.js
const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  changePassword,
} = require('../controllers/auth.controller');
const {
  googleAuth,
  googleCallback,
  googleDebug,
  exchangeTempToken,
} = require('../controllers/googleAuth.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

// Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.post('/google/exchange-token', exchangeTempToken);
router.get('/google/debug', googleDebug); // Debug endpoint - remove in production

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;

