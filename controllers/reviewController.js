const Review = require('../models/Review');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, status = 'approved' } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'user', select: 'name email avatar' },
        { path: 'product', select: 'name images' }
      ]
    };

    // Build query based on status
    let query = { product: productId };
    if (status !== 'all') {
      query.status = status;
    }

    const reviews = await Review.find(query)
      .populate(options.populate)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);

    const total = await Review.countDocuments(query);

    // Calculate average rating - fix ObjectId constructor
    const ratingStats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0, ratingDistribution: [] };

    // Calculate rating distribution
    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: stats.ratingDistribution.filter(r => r === rating).length,
      percentage: stats.totalReviews > 0 ? (stats.ratingDistribution.filter(r => r === rating).length / stats.totalReviews * 100).toFixed(1) : '0'
    }));

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      },
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10 || 0,
        totalReviews: stats.totalReviews || 0,
        distribution
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name email avatar')
      .populate('product', 'name images');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private (User must be logged in)
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const firebaseUid = req.user?.uid; // Firebase token has 'uid'

    // Validate required fields
    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, rating, title, and comment are required'
      });
    }

    // Find the MongoDB user by Firebase UID
    const User = require('../models/User');
    const mongoUser = await User.findOne({ uid: firebaseUid });
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: mongoUser._id // Use MongoDB ObjectId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Check if user purchased this product (optional - for verified purchase)
    // This would require an Order model and checking purchase history
    const isVerifiedPurchase = false; // Implement purchase verification logic

    // Create review
    const review = await Review.create({
      product: productId,
      user: mongoUser._id, // Use MongoDB ObjectId
      rating: parseInt(rating),
      title,
      comment,
      isVerifiedPurchase
    });

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name email avatar')
      .populate('product', 'name images');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and is pending approval',
      data: populatedReview
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Review owner or Admin)
exports.updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const firebaseUid = req.user?.uid;
    const userRole = req.user?.dbUser?.role; // Role is in the MongoDB user document
    const updates = req.body;

    // Find the MongoDB user by Firebase UID
    const User = require('../models/User');
    const mongoUser = await User.findOne({ uid: firebaseUid });
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check permissions - user can only update their own reviews, admin can update any
    if (review.user.toString() !== mongoUser._id.toString() && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Prevent updating certain fields if not admin
    if (userRole !== 'admin') {
      delete updates.status;
      delete updates.adminResponse;
    }

    // Convert numeric fields
    if (updates.rating) updates.rating = parseInt(updates.rating);

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'name email avatar')
     .populate('product', 'name images');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Review owner or Admin)
exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const firebaseUid = req.user?.uid;
    const userRole = req.user?.dbUser?.role;

    // Find the MongoDB user by Firebase UID
    const User = require('../models/User');
    const mongoUser = await User.findOne({ uid: firebaseUid });
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check permissions
    if (review.user.toString() !== mongoUser._id.toString() && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Approve/Reject review
// @route   PUT /api/reviews/:id/status
// @access  Private (Admin only)
exports.updateReviewStatus = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { status, adminComment } = req.body;
    const adminId = req.user?.uid;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, or pending'
      });
    }

    const updateData = {
      status,
      adminResponse: adminComment ? {
        comment: adminComment,
        respondedAt: new Date(),
        respondedBy: adminId
      } : undefined
    };

    const review = await Review.findByIdAndUpdate(
      reviewId,
      updateData,
      { new: true }
    ).populate('user', 'name email avatar')
     .populate('product', 'name images')
     .populate('adminResponse.respondedBy', 'name');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Review ${status} successfully`,
      data: review
    });
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private (Logged in users)
exports.markHelpful = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const firebaseUid = req.user?.uid;

    // Find the MongoDB user by Firebase UID
    const User = require('../models/User');
    const mongoUser = await User.findOne({ uid: firebaseUid });
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already marked as helpful
    const isHelpful = review.helpful.includes(mongoUser._id);

    if (isHelpful) {
      // Remove from helpful
      review.helpful = review.helpful.filter(id => id.toString() !== mongoUser._id.toString());
    } else {
      // Add to helpful
      review.helpful.push(mongoUser._id);
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: isHelpful ? 'Removed from helpful' : 'Marked as helpful',
      data: {
        helpfulCount: review.helpful.length,
        isHelpful: !isHelpful
      }
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all reviews (Admin only)
// @route   GET /api/reviews
// @access  Private (Admin only)
exports.getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'user', select: 'name email avatar' },
        { path: 'product', select: 'name images' },
        { path: 'adminResponse.respondedBy', select: 'name' }
      ]
    };

    // Build query
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
        { 'product.name': { $regex: search, $options: 'i' } }
      ];
    }

    const reviews = await Review.find(query)
      .populate(options.populate)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);

    const total = await Review.countDocuments(query);

    // Get stats - convert to plain objects for JSON serialization
    const stats = await Review.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert MongoDB objects to plain JavaScript objects
    const plainStats = stats.map(stat => ({
      _id: stat._id,
      count: stat.count
    }));

    const statusStats = {
      total: plainStats.reduce((acc, curr) => acc + curr.count, 0),
      pending: plainStats.find(s => s._id === 'pending')?.count || 0,
      approved: plainStats.find(s => s._id === 'approved')?.count || 0,
      rejected: plainStats.find(s => s._id === 'rejected')?.count || 0,
    };

    res.status(200).json({
      success: true,
      data: reviews,
      stats: statusStats,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Report review
// @route   POST /api/reviews/:id/report
// @access  Private (Logged in users)
exports.reportReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const firebaseUid = req.user?.uid;
    const { reason } = req.body;

    // Find the MongoDB user by Firebase UID
    const User = require('../models/User');
    const mongoUser = await User.findOne({ uid: firebaseUid });
    if (!mongoUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already reported
    const alreadyReported = review.reported.includes(mongoUser._id);

    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }

    // Add to reported list
    review.reported.push(mongoUser._id);
    await review.save();

    // Here you could also create a separate Report model for more detailed tracking

    res.status(200).json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
