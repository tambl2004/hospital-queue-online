const express = require('express');
const {
  getFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
} = require('../controllers/faqs.controller');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Public route - không cần auth
router.get('/public', getFAQs);

// Admin routes - yêu cầu auth và role ADMIN
router.use(authenticate);
router.get('/', requireRole(['ADMIN']), getFAQs);
router.get('/:id', requireRole(['ADMIN']), getFAQById);
router.post('/', requireRole(['ADMIN']), createFAQ);
router.put('/:id', requireRole(['ADMIN']), updateFAQ);
router.delete('/:id', requireRole(['ADMIN']), deleteFAQ);

module.exports = router;

