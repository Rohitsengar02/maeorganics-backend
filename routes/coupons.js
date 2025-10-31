const express = require('express');
const router = express.Router();
const {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public routes (no admin required)
router.get('/', verifyToken, getCoupons);
router.post('/', verifyToken, createCoupon);
router.route('/:id')
  .get(verifyToken, getCoupon)
  .put(verifyToken, updateCoupon);

// Admin-only delete operation
router.delete('/:id', verifyToken, isAdmin, deleteCoupon);

module.exports = router;
