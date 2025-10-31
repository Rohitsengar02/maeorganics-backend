const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const addressSnapshotSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  pincode: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: '' },
  landmark: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  addressType: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
});

const paymentSchema = new mongoose.Schema({
  method: { type: String, enum: ['upi', 'phonepe', 'paytm', 'cod'], required: true },
  status: { type: String, enum: ['pending', 'paid', 'cod'], default: 'pending' },
  provider: { type: String, default: '' },
  transactionId: { type: String, default: '' },
  upiId: { type: String, default: '' },
});

const amountsSchema = new mongoose.Schema({
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, min: 0, default: 0 },
  shipping: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
});

const couponSchema = new mongoose.Schema({
  code: { type: String },
  discountType: { type: String, enum: ['percentage', 'fixed'] },
  discountValue: { type: Number },
});

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    address: { type: addressSnapshotSchema, required: true },
    payment: { type: paymentSchema, required: true },
    amounts: { type: amountsSchema, required: true },
    coupon: { type: couponSchema, default: null },
    status: { type: String, enum: ['created', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'created' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
