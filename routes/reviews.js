const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  updateReviewStatus,
  markHelpful,
  reportReview,
  getAllReviews
} = require('../controllers/reviewController');

// Import auth middleware
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public routes (no auth required)
router.get('/product/:productId', getProductReviews);
router.get('/:id', getReview);

// Protected routes (require authentication)
router.post('/', verifyToken, createReview);
router.put('/:id', verifyToken, updateReview);
router.delete('/:id', verifyToken, deleteReview);
router.post('/:id/helpful', verifyToken, markHelpful);
router.post('/:id/report', verifyToken, reportReview);

// Admin routes (require authentication - temporarily allowing logged-in users for testing)
router.get('/', verifyToken, getAllReviews); // Removed isAdmin for testing
router.put('/:id/status', verifyToken, updateReviewStatus); // Removed isAdmin for user access

module.exports = router;
