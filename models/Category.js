const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot be more than 50 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  image: {
    type: String, // Cloudinary URL
    required: [true, 'Category image is required']
  },
  cloudinaryId: {
    type: String, // Cloudinary public_id for deletion
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Draft', 'Inactive'],
    default: 'Draft'
  },
  displayOrder: {
    type: Number,
    default: 0,
    min: 0
  },
  productCount: {
    type: Number,
    default: 0
  },
  seoTitle: {
    type: String,
    maxlength: [60, 'SEO title cannot be more than 60 characters']
  },
  seoDescription: {
    type: String,
    maxlength: [160, 'SEO description cannot be more than 160 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
categorySchema.index({ status: 1, displayOrder: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Pre-save middleware to create slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Static method to get active categories
categorySchema.statics.getActiveCategories = function() {
  return this.find({ status: 'Active' }).sort({ displayOrder: 1 });
};

module.exports = mongoose.model('Category', categorySchema);
