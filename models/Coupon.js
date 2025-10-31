const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Discount type is required'],
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative'],
  },
  minPurchase: {
    type: Number,
    default: 0,
  },
  expiryDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usageLimit: {
    type: Number,
    min: 0,
    default: null, // null means unlimited
  },
  usageCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Virtual to check if coupon is expired
couponSchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});

// Virtual to check if coupon has reached its usage limit
couponSchema.virtual('isUsageLimitReached').get(function() {
  return this.usageLimit !== null && this.usageCount >= this.usageLimit;
});

module.exports = mongoose.model('Coupon', couponSchema);
