const Category = require('../models/Category');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dntayojln',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const { status, parent, page = 1, limit = 20 } = req.query;

    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (parent === 'null' || parent === '') {
      query.parentCategory = null;
    } else if (parent) {
      query.parentCategory = parent;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { displayOrder: 1, createdAt: -1 },
      populate: {
        path: 'subcategories',
        select: 'name slug status'
      }
    };

    const categories = await Category.find(query)
      .sort(options.sort)
      .populate(options.populate.path, options.populate.select)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);

    const total = await Category.countDocuments(query);

    res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name slug')
      .populate('subcategories', 'name slug status productCount');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const { name, description, status, displayOrder, parentCategory, seoTitle, seoDescription, image } = req.body;

    // Validate required fields
    if (!name || !image) {
      return res.status(400).json({
        success: false,
        message: 'Category name and image are required'
      });
    }

    // Check if category with same name exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // Upload image to Cloudinary
    let cloudinaryResult;
    try {
      if (image.startsWith('data:image')) {
        // Base64 image
        cloudinaryResult = await cloudinary.uploader.upload(image, {
          folder: 'maeorganics/categories',
          public_id: `category_${Date.now()}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' }
          ]
        });
      } else {
        // URL - assuming it's already a Cloudinary URL
        cloudinaryResult = { secure_url: image, public_id: 'existing' };
      }
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      // For now, allow category creation without image if upload fails
      cloudinaryResult = { secure_url: 'https://via.placeholder.com/400x400?text=No+Image', public_id: null };
    }

    // Create category
    const categoryData = {
      name,
      description,
      status: status || 'Draft',
      displayOrder: displayOrder || 0,
      parentCategory: parentCategory || null,
      seoTitle,
      seoDescription,
      image: cloudinaryResult.secure_url,
      cloudinaryId: cloudinaryResult.public_id,
    };

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, status, displayOrder, parentCategory, seoTitle, seoDescription, image } = req.body;

    let updateData = {
      name,
      description,
      status,
      displayOrder,
      parentCategory: parentCategory || null,
      seoTitle,
      seoDescription
    };

    // Handle image update
    if (image && image !== req.category.image) {
      try {
        // Delete old image from Cloudinary
        if (req.category.cloudinaryId && req.category.cloudinaryId !== 'existing') {
          await cloudinary.uploader.destroy(req.category.cloudinaryId);
        }

        // Upload new image
        let cloudinaryResult;
        if (image.startsWith('data:image')) {
          cloudinaryResult = await cloudinary.uploader.upload(image, {
            folder: 'maeorganics/categories',
            public_id: `category_${Date.now()}`,
            transformation: [
              { width: 400, height: 400, crop: 'fill' },
              { quality: 'auto' }
            ]
          });
        } else {
          cloudinaryResult = { secure_url: image, public_id: 'existing' };
        }

        updateData.image = cloudinaryResult.secure_url;
        updateData.cloudinaryId = cloudinaryResult.public_id;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parentCategory', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const category = req.category;

    // Check if category has subcategories
    const subcategories = await Category.find({ parentCategory: category._id });
    if (subcategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Move or delete subcategories first.'
      });
    }

    // Check if category has products (this would need a Product model reference)
    // For now, we'll assume this check is done on the frontend

    // Delete image from Cloudinary
    if (category.cloudinaryId && category.cloudinaryId !== 'existing') {
      try {
        await cloudinary.uploader.destroy(category.cloudinaryId);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
        // Don't fail the whole operation for Cloudinary errors
      }
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get category tree (for navigation)
// @route   GET /api/categories/tree
// @access  Public
exports.getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find({ status: 'Active', parentCategory: null })
      .sort({ displayOrder: 1 })
      .populate({
        path: 'subcategories',
        match: { status: 'Active' },
        options: { sort: { displayOrder: 1 } },
        populate: {
          path: 'subcategories',
          match: { status: 'Active' },
          options: { sort: { displayOrder: 1 } }
        }
      });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
