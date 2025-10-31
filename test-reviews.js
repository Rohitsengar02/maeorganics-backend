// Test script to create sample reviews for testing
const createSampleReviews = async () => {
  try {
    console.log('🧪 Creating sample reviews for testing...\n');

    const mongoose = require('mongoose');
    const Review = require('./models/Review');
    const Product = require('./models/Product');
    const User = require('./models/User');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maeorganics');
    console.log('✅ Connected to MongoDB');

    // Get first product and user for testing
    const product = await Product.findOne().limit(1);
    const user = await User.findOne().limit(1);

    if (!product || !user) {
      console.log('❌ No products or users found. Please create some first.');
      return;
    }

    console.log(`📦 Using product: ${product.name}`);
    console.log(`👤 Using user: ${user.email || user.uid}`);

    // Create sample reviews
    const sampleReviews = [
      {
        product: product._id,
        user: user._id,
        rating: 5,
        title: 'Excellent Product!',
        comment: 'This product exceeded my expectations. The quality is outstanding and it works perfectly. Highly recommended!',
        status: 'approved',
        isVerifiedPurchase: true,
        helpful: [],
        reported: []
      },
      {
        product: product._id,
        user: user._id,
        rating: 4,
        title: 'Very Good Quality',
        comment: 'Good product overall. The quality is great and it does what it promises. Only minor issue with packaging.',
        status: 'approved',
        isVerifiedPurchase: false,
        helpful: [],
        reported: []
      },
      {
        product: product._id,
        user: user._id,
        rating: 3,
        title: 'Decent but could be better',
        comment: 'It\'s okay, does the job but I\'ve seen better products in this price range. Delivery was fast though.',
        status: 'pending',
        isVerifiedPurchase: true,
        helpful: [],
        reported: []
      },
      {
        product: product._id,
        user: user._id,
        rating: 1,
        title: 'Very disappointed',
        comment: 'Terrible experience. Product arrived damaged and customer service was unhelpful. Would not recommend.',
        status: 'rejected',
        isVerifiedPurchase: true,
        helpful: [],
        reported: [],
        adminResponse: {
          comment: 'We apologize for this experience. We have reached out to resolve this issue.',
          respondedAt: new Date(),
          respondedBy: user._id
        }
      }
    ];

    // Clear existing reviews for this product
    await Review.deleteMany({ product: product._id });
    console.log('🧹 Cleared existing reviews for this product');

    // Create new sample reviews
    const createdReviews = await Review.insertMany(sampleReviews);
    console.log(`✅ Created ${createdReviews.length} sample reviews`);

    // Populate the reviews for display
    const populatedReviews = await Review.find({ product: product._id })
      .populate('user', 'name email')
      .populate('product', 'name');

    console.log('\n📋 Sample Reviews Created:');
    populatedReviews.forEach((review, index) => {
      console.log(`${index + 1}. ${review.title} (${review.rating}⭐) - ${review.status}`);
    });

    console.log('\n🎉 Sample reviews created successfully!');
    console.log('📊 You can now test the admin reviews page at /admin/reviews');

  } catch (error) {
    console.error('❌ Error creating sample reviews:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  createSampleReviews();
}

module.exports = { createSampleReviews };
