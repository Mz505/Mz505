const express = require('express');
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  markReviewHelpful,
  getAllReviews,
  updateReviewApproval,
  addAdminResponse
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes
router.post('/', protect, createReview);
router.get('/my-reviews', protect, getMyReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id/helpful', protect, markReviewHelpful);

// Admin routes
router.get('/', protect, authorize('admin'), getAllReviews);
router.put('/:id/approve', protect, authorize('admin'), updateReviewApproval);
router.put('/:id/respond', protect, authorize('admin'), addAdminResponse);

module.exports = router;