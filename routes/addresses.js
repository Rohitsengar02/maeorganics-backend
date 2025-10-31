const express = require('express');
const router = express.Router();
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/addressController');
const { verifyToken } = require('../middleware/auth');

// All routes are protected and require authentication
router.use(verifyToken);

// Get all addresses for the logged-in user
router.get('/', getAddresses);

// Add a new address
router.post('/', addAddress);

// Update an address
router.put('/:id', updateAddress);

// Delete an address
router.delete('/:id', deleteAddress);

// Set default address
router.patch('/:id/set-default', setDefaultAddress);

module.exports = router;
