const mongoose = require('mongoose');

const offlineOrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  pincode: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: '' },
  landmark: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
});

const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
});

const paymentSchema = new mongoose.Schema({
  method: { type: String, enum: ['cash', 'upi', 'card', 'other'], default: 'cash' },
  status: { type: String, enum: ['paid', 'pending'], default: 'paid' },
  notes: { type: String, default: '' },
});

const amountsSchema = new mongoose.Schema({
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, min: 0, default: 0 },
  shipping: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
});

const offlineOrderSchema = new mongoose.Schema(
  {
    items: { type: [offlineOrderItemSchema], required: true },
    customer: { type: customerSchema, required: true },
    shippingAddress: { type: addressSchema, required: true },
    deliveryAddress: { type: addressSchema, required: true },
    payment: { type: paymentSchema, required: true },
    amounts: { type: amountsSchema, required: true },
    status: { type: String, enum: ['created', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'created' },
    source: { type: String, default: 'offline' },
    notes: { type: String, default: '' },
    createdBy: { type: String, default: '' }, // admin email/uid
  },
  { timestamps: true }
);

module.exports = mongoose.model('OfflineOrder', offlineOrderSchema);
