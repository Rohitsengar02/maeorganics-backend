const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot be more than 200 characters']
  },
  longDescription: {
    type: String,
    maxlength: [2000, 'Long description cannot be more than 2000 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  images: [{
    type: String, // Cloudinary URLs
    required: true
  }],
  cloudinaryIds: [{
    type: String // Cloudinary public_ids for deletion
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'At least one category is required']
  }],
  regularPrice: {
    type: Number,
    required: [true, 'Regular price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountedPrice: {
    type: Number,
    min: [0, 'Discounted price cannot be negative'],
    validate: {
      validator: function(value) {
        // In 'update' operations, 'this' is the query. We need to get the document.
        const regularPrice = this.getUpdate ? this.getUpdate().$set.regularPrice || this.regularPrice : this.regularPrice;
        if (value === null || value === undefined) return true; // Allow null/undefined
        return value <= regularPrice;
      },
      message: 'Discounted price cannot be higher than regular price'
    }
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Draft', 'Inactive', 'Out of Stock'],
    default: 'Draft'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  delivery: {
    type: String,
    maxlength: [500, 'Delivery information cannot be more than 500 characters']
  },
  returns: {
    type: String,
    maxlength: [500, 'Returns information cannot be more than 500 characters']
  },
  seoTitle: {
    type: String,
    maxlength: [60, 'SEO title cannot be more than 60 characters']
  },
  seoDescription: {
    type: String,
    maxlength: [160, 'SEO description cannot be more than 160 characters']
  },
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  salesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.discountedPrice && this.discountedPrice < this.regularPrice) {
    return Math.round(((this.regularPrice - this.discountedPrice) / this.regularPrice) * 100);
  }
  return 0;
});

// Virtual for current price (discounted or regular)
productSchema.virtual('currentPrice').get(function() {
  return this.discountedPrice || this.regularPrice;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stockQuantity === 0) return 'Out of Stock';
  if (this.stockQuantity <= 10) return 'Low Stock';
  return 'In Stock';
});

// Indexes for better performance
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ categories: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ 'currentPrice': 1 });

// Pre-save middleware to set status based on stock
productSchema.pre('save', function(next) {
  if (this.stockQuantity === 0 && this.status === 'Active') {
    this.status = 'Out of Stock';
  } else if (this.stockQuantity > 0 && this.status === 'Out of Stock') {
    this.status = 'Active';
  }
  next();
});

// Static method to get active products
productSchema.statics.getActiveProducts = function(limit = 20) {
  return this.find({ status: 'Active' })
    .populate('categories', 'name slug image')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to search products
productSchema.statics.searchProducts = function(query, limit = 20) {
  return this.find({
    $and: [
      { status: 'Active' },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { shortDescription: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  })
  .populate('categories', 'name slug image')
  .limit(limit);
};

module.exports = mongoose.model('Product', productSchema);
