const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  }
}, { _id: false });

const heroSlideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  baseBackground: {
    type: String,
    required: true,
  },
  accentBackground: {
    type: String,
    required: true,
  },
  baseIngredients: [ingredientSchema],
  extras: [ingredientSchema],
}, { _id: true });

const navLinkSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  href: {
    type: String,
    required: true,
  }
}, { _id: false });

const homePageSettingsSchema = new mongoose.Schema({
  // General Settings
  siteName: {
    type: String,
    required: true,
    default: 'Maeorganics',
  },
  logo: {
    type: String,
    default: '',
  },

  // Hero Section
  heroSlides: [heroSlideSchema],
  navLinks: [navLinkSchema],

  // Featured Products (store product IDs)
  featuredProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],

  // Product Grid (store product IDs)
  productGrid: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],

  // Metadata
  isActive: {
    type: Boolean,
    default: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Ensure only one active settings document exists
homePageSettingsSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

const HomePageSettings = mongoose.model('HomePageSettings', homePageSettingsSchema);

module.exports = HomePageSettings;
