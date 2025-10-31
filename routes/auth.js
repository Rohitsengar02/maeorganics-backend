const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyToken, isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/auth/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', verifyToken, isAuthenticated, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select('-__v');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/auth/me
// @desc    Update user profile
// @access  Private
router.put('/me', verifyToken, isAuthenticated, async (req, res) => {
  const { displayName, phoneNumber, address } = req.body;
  
  try {
    const updateFields = {};
    
    if (displayName) updateFields.displayName = displayName;
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (address) {
      updateFields.address = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || ''
      };
    }
    
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/auth/admin/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/admin/users', verifyToken, isAuthenticated, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findOne({ uid: req.user.uid });
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/auth/admin/users/:userId/role
// @desc    Update user role (admin only)
// @access  Private/Admin
router.put('/admin/users/:userId/role', verifyToken, isAuthenticated, async (req, res) => {
  try {
    // Check if requester is admin
    const adminUser = await User.findOne({ uid: req.user.uid });
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { role } = req.body;
    const { userId } = req.params;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { role } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
