const OfflineOrder = require('../models/OfflineOrder');

// Create offline order
exports.createOfflineOrder = async (req, res) => {
  try {
    const payload = req.body;
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }
    if (!payload.customer || !payload.shippingAddress || !payload.deliveryAddress || !payload.amounts || !payload.payment) {
      return res.status(400).json({ success: false, message: 'Customer, addresses, payment and amounts are required' });
    }

    const doc = await OfflineOrder.create({
      ...payload,
      createdBy: req.user?.email || req.user?.uid || 'unknown',
      source: 'offline',
    });
    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    console.error('Create offline order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// List offline orders
exports.getOfflineOrders = async (req, res) => {
  try {
    const list = await OfflineOrder.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: list });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get offline order by id
exports.getOfflineOrderById = async (req, res) => {
  try {
    const order = await OfflineOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update status/fields
exports.updateOfflineOrder = async (req, res) => {
  try {
    const order = await OfflineOrder.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete
exports.deleteOfflineOrder = async (req, res) => {
  try {
    const order = await OfflineOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: {} });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
