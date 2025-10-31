const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree
} = require('../controllers/categoryController');

// Import middleware
const { verifyToken } = require('../middleware/auth');

// Public routes
router.get('/tree', getCategoryTree);
router.get('/', getCategories);
router.get('/:id', getCategory);

// Protected routes (Admin only) - Temporarily removed auth for testing
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

// Middleware to get category by ID
router.param('id', async (req, res, next, id) => {
  try {
    const Category = require('../models/Category');
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    req.category = category;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
