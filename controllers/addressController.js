const Address = require('../models/Address');

// @desc    Get all addresses for a user
// @route   GET /api/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add a new address
// @route   POST /api/addresses
// @access  Private
exports.addAddress = async (req, res) => {
  try {
    const { isDefault, ...addressData } = req.body;
    
    // If setting as default, unset any existing default address
    if (isDefault) {
      await Address.updateMany(
        { userId: req.user.id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const newAddress = await Address.create({
      ...addressData,
      userId: req.user.id,
      isDefault: isDefault || false,
    });

    res.status(201).json({ success: true, data: newAddress });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update an address
// @route   PUT /api/addresses/:id
// @access  Private
exports.updateAddress = async (req, res) => {
  try {
    const { isDefault, ...updateData } = req.body;
    
    // If setting as default, unset any existing default address
    if (isDefault) {
      await Address.updateMany(
        { userId: req.user.id, isDefault: true, _id: { $ne: req.params.id } },
        { $set: { isDefault: false } }
      );
    }

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...updateData, isDefault: isDefault || false },
      { new: true, runValidators: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.status(200).json({ success: true, data: updatedAddress });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete an address
// @route   DELETE /api/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
  try {
    const deletedAddress = await Address.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deletedAddress) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Set default address
// @route   PATCH /api/addresses/:id/set-default
// @access  Private
exports.setDefaultAddress = async (req, res) => {
  try {
    // Unset current default
    await Address.updateMany(
      { userId: req.user.id, isDefault: true },
      { $set: { isDefault: false } }
    );

    // Set new default
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { isDefault: true } },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
