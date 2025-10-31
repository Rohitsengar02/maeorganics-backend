const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts
} = require('../controllers/productController');

// Import middleware
const { verifyToken } = require('../middleware/auth');

// Public routes
router.get('/search', searchProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes (Admin only) - Temporarily removed auth for testing
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Middleware to get product by ID
router.param('id', async (req, res, next, id) => {
  try {
    const Product = require('../models/Product');
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    req.product = product;
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
