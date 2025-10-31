const User = require('../models/User');
const admin = require('firebase-admin');

// @desc    Sync Firebase user to MongoDB
// @route   POST /api/users/sync
// @access  Private
exports.syncUserToMongoDB = async (req, res) => {
  try {
    console.log('🔄 Backend: Received sync request');
    console.log('Request headers:', req.headers.authorization ? 'Token present' : 'No token');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user);

    const { uid, email, fullName, imageUrl, cloudinaryImageUrl, phoneNumber, emailVerified } = req.body;

    if (!uid || !email) {
      console.log('❌ Backend: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'User UID and email are required'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ uid });

    if (user) {
      // Update existing user
      user.email = email;
      user.displayName = fullName || user.displayName;
      user.fullName = fullName || user.fullName;
      user.photoURL = imageUrl || user.photoURL;
      user.imageUrl = imageUrl || user.imageUrl;
      user.cloudinaryImageUrl = cloudinaryImageUrl || user.cloudinaryImageUrl;
      user.phoneNumber = phoneNumber || user.phoneNumber;
      user.emailVerified = emailVerified !== undefined ? emailVerified : user.emailVerified;
      user.lastLogin = new Date();
      user.updatedAt = new Date();

      await user.save();

      console.log('✅ Backend: User updated successfully in MongoDB');
      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } else {
      // Create new user
      const newUser = new User({
        uid,
        email,
        displayName: fullName || '',
        fullName: fullName || '',
        photoURL: imageUrl || '',
        imageUrl: imageUrl || '',
        cloudinaryImageUrl: cloudinaryImageUrl || '',
        phoneNumber: phoneNumber || '',
        emailVerified: emailVerified || false
      });

      const savedUser = await newUser.save();

      console.log('✅ Backend: User created successfully in MongoDB');
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: savedUser
      });
    }
  } catch (error) {
    console.error('❌ Backend: Sync user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user by Mongo ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-__v');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get user by Firebase UID
// @route   GET /api/users/firebase/:uid
// @access  Private
exports.getUserByFirebaseUID = async (req, res) => {
  try {
    const { uid } = req.params;

    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by UID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, address } = req.body;
    const { uid } = req.user; // From Firebase token

    const updateFields = {};

    if (fullName !== undefined) updateFields.displayName = fullName;
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
    if (address !== undefined) {
      updateFields.address = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || ''
      };
    }

    updateFields.updatedAt = new Date();

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-__v').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Also delete from Firebase
    try {
      await admin.auth().deleteUser(user.uid);
    } catch (firebaseError) {
      console.warn('Firebase user deletion failed:', firebaseError);
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
