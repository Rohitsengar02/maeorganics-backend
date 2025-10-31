const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dntayojln',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      status = 'all',
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    let query = {};

    if (category && category !== 'all') {
      query.categories = category;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = {};
    sortObj[sort] = sortOrder;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortObj,
      populate: [
        { path: 'categories', select: 'name slug image' },
        { path: 'relatedProducts', select: 'name images currentPrice' }
      ]
    };

    const products = await Product.find(query)
      .populate(options.populate)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);

    const total = await Product.countDocuments(query);

    // Add virtual fields
    const productsWithVirtuals = products.map(product => ({
      ...product.toObject(),
      discountPercentage: product.discountPercentage,
      currentPrice: product.currentPrice,
      stockStatus: product.stockStatus
    }));

    res.status(200).json({
      success: true,
      data: productsWithVirtuals,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categories', 'name slug image description')
      .populate('relatedProducts', 'name images currentPrice status');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Add virtual fields
    const productWithVirtuals = {
      ...product.toObject(),
      discountPercentage: product.discountPercentage,
      currentPrice: product.currentPrice,
      stockStatus: product.stockStatus
    };

    res.status(200).json({
      success: true,
      data: productWithVirtuals
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      shortDescription,
      longDescription,
      sku,
      categories,
      regularPrice,
      discountedPrice,
      stockQuantity,
      status,
      tags,
      delivery,
      returns,
      seoTitle,
      seoDescription,
      relatedProducts,
      images
    } = req.body;

    // Validate required fields
    if (!name || !sku || !categories || categories.length === 0 || !images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name, SKU, categories, and at least one image are required'
      });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }

    // Upload images to Cloudinary
    let uploadedImages = [];
    let cloudinaryIds = [];

    try {
      if (Array.isArray(images)) {
        for (const image of images) {
          if (image.startsWith('data:image')) {
            const result = await cloudinary.uploader.upload(image, {
              folder: 'maeorganics/products',
              public_id: `product_${sku}_${Date.now()}_${uploadedImages.length}`,
              transformation: [
                { width: 800, height: 800, crop: 'fill' },
                { quality: 'auto' }
              ]
            });
            uploadedImages.push(result.secure_url);
            cloudinaryIds.push(result.public_id);
          } else {
            uploadedImages.push(image);
            cloudinaryIds.push('existing');
          }
        }
      }
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload images'
      });
    }

    // Create product
    const productData = {
      name,
      shortDescription,
      longDescription,
      sku: sku.toUpperCase(),
      images: uploadedImages,
      cloudinaryIds,
      categories,
      regularPrice: parseFloat(regularPrice),
      discountedPrice: discountedPrice ? parseFloat(discountedPrice) : undefined,
      stockQuantity: parseInt(stockQuantity),
      status: status || 'Draft',
      tags: tags || [],
      delivery,
      returns,
      seoTitle,
      seoDescription,
      relatedProducts: relatedProducts || [],
      createdBy: null // Will be set when auth is added
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        ...product.toObject(),
        discountPercentage: product.discountPercentage,
        currentPrice: product.currentPrice,
        stockStatus: product.stockStatus
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updates = req.body;

    // Handle image updates
    if (updates.images) {
      const existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const newImageUrls = [];
      const newCloudinaryIds = [];
      const oldCloudinaryIds = existingProduct.cloudinaryIds || [];
      const updatedCloudinaryIds = [];

      // Upload new base64 images
      for (const image of updates.images) {
        if (image.startsWith('data:image')) {
          const result = await cloudinary.uploader.upload(image, {
            folder: 'maeorganics/products',
            transformation: [{ width: 800, height: 800, crop: 'limit' }, { quality: 'auto' }]
          });
          newImageUrls.push(result.secure_url);
          newCloudinaryIds.push(result.public_id);
          updatedCloudinaryIds.push(result.public_id);
        } else {
          newImageUrls.push(image); // Keep existing URLs
          // Find the corresponding cloudinaryId
          const imageIndex = existingProduct.images.indexOf(image);
          if (imageIndex > -1 && oldCloudinaryIds[imageIndex]) {
            updatedCloudinaryIds.push(oldCloudinaryIds[imageIndex]);
          }
        }
      }

      // Identify and delete old images from Cloudinary
      const imagesToDelete = oldCloudinaryIds.filter(id => !updatedCloudinaryIds.includes(id) && id !== 'existing');
      if (imagesToDelete.length > 0) {
        for (const id of imagesToDelete) {
          await cloudinary.uploader.destroy(id);
        }
      }

      updates.images = newImageUrls;
      updates.cloudinaryIds = updatedCloudinaryIds;
    }

    // Update SKU to uppercase if provided
    if (updates.sku) {
      updates.sku = updates.sku.toUpperCase();

      // Check if new SKU conflicts with another product
      const existingProduct = await Product.findOne({
        sku: updates.sku,
        _id: { $ne: productId }
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Another product with this SKU already exists'
        });
      }
    }

    // Convert numeric fields
    if (updates.regularPrice) updates.regularPrice = parseFloat(updates.regularPrice);
    if (updates.discountedPrice) updates.discountedPrice = parseFloat(updates.discountedPrice);
    if (updates.stockQuantity) updates.stockQuantity = parseInt(updates.stockQuantity);

    const product = await Product.findByIdAndUpdate(
      productId,
      updates,
      { new: true, runValidators: true }
    ).populate('categories', 'name slug image')
     .populate('relatedProducts', 'name images currentPrice');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        ...product.toObject(),
        discountPercentage: product.discountPercentage,
        currentPrice: product.currentPrice,
        stockStatus: product.stockStatus
      }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete images from Cloudinary
    if (product.cloudinaryIds && product.cloudinaryIds.length > 0) {
      for (const cloudinaryId of product.cloudinaryIds) {
        if (cloudinaryId && cloudinaryId !== 'existing') {
          try {
            await cloudinary.uploader.destroy(cloudinaryId);
          } catch (cloudinaryError) {
            console.error('Cloudinary delete error:', cloudinaryError);
          }
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'categories', select: 'name slug image' },
        { path: 'relatedProducts', select: 'name images currentPrice' }
      ]
    };

    const products = await Product.find({
      categories: categoryId,
      status: 'Active'
    })
    .populate(options.populate)
    .sort(options.sort)
    .limit(options.limit)
    .skip((options.page - 1) * options.limit);

    const total = await Product.countDocuments({
      categories: categoryId,
      status: 'Active'
    });

    // Add virtual fields
    const productsWithVirtuals = products.map(product => ({
      ...product.toObject(),
      discountPercentage: product.discountPercentage,
      currentPrice: product.currentPrice,
      stockStatus: product.stockStatus
    }));

    res.status(200).json({
      success: true,
      data: productsWithVirtuals,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
exports.searchProducts = async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const products = await Product.searchProducts(query, parseInt(limit))
      .populate('categories', 'name slug image')
      .populate('relatedProducts', 'name images currentPrice');

    // Add virtual fields
    const productsWithVirtuals = products.map(product => ({
      ...product.toObject(),
      discountPercentage: product.discountPercentage,
      currentPrice: product.currentPrice,
      stockStatus: product.stockStatus
    }));

    res.status(200).json({
      success: true,
      data: productsWithVirtuals
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
