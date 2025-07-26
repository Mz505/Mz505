const express = require('express');
const {
  createContact,
  getContactById,
  getContacts,
  updateContactStatus,
  respondToContact,
  deleteContact,
  getContactStats
} = require('../controllers/contactController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/', createContact);

// Admin routes
router.get('/stats', protect, authorize('admin'), getContactStats);
router.get('/', protect, authorize('admin'), getContacts);
router.get('/:id', protect, authorize('admin'), getContactById);
router.put('/:id/status', protect, authorize('admin'), updateContactStatus);
router.put('/:id/respond', protect, authorize('admin'), respondToContact);
router.delete('/:id', protect, authorize('admin'), deleteContact);

module.exports = router;