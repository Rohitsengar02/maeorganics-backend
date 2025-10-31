const express = require('express');
const router = express.Router();
const {
  syncUserToMongoDB,
  getUserByFirebaseUID,
  updateUserProfile,
  getAllUsers,
  getUserById,
  deleteUser
} = require('../controllers/userController');

const { verifyToken, isAdmin, isAuthenticated } = require('../middleware/auth');

// @route   POST /api/users/sync
// @desc    Sync Firebase user to MongoDB
// @access  Private
router.post('/sync', verifyToken, syncUserToMongoDB);

// @route   GET /api/users/firebase/:uid
// @desc    Get user by Firebase UID
// @access  Private
router.get('/firebase/:uid', verifyToken, getUserByFirebaseUID);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', verifyToken, updateUserProfile);

// @route   GET /api/users
// @desc    Get all users (any authenticated user)
// @access  Private
router.get('/', verifyToken, getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by mongo id (any authenticated user)
// @access  Private
router.get('/:id', verifyToken, getUserById);

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', verifyToken, isAdmin, deleteUser);

module.exports = router;
