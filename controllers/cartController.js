const Cart = require('../models/Cart');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.dbUser._id }).populate('items.product');
    if (!cart) {
      return res.status(200).json({ success: true, data: { items: [] } });
    }
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addItemToCart = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ user: req.user.dbUser._id });

    if (cart) {
      // Cart exists for user
      let itemIndex = cart.items.findIndex(p => p.product == productId);

      if (itemIndex > -1) {
        // Product exists in the cart, update the quantity
        let productItem = cart.items[itemIndex];
        productItem.quantity = quantity;
        cart.items[itemIndex] = productItem;
      } else {
        // Product does not exists in cart, add new item
        cart.items.push({ product: productId, quantity });
      }
      cart = await cart.save();
      await cart.populate('items.product');
      return res.status(200).json({ success: true, data: cart });
    } else {
      // No cart for user, create new cart
      const newCart = await Cart.create({
        user: req.user.dbUser._id,
        items: [{ product: productId, quantity }]
      });
      await newCart.populate('items.product');
      return res.status(201).json({ success: true, data: newCart });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeItemFromCart = async (req, res) => {
  const { productId } = req.params;

  try {
    let cart = await Cart.findOne({ user: req.user.dbUser._id });

    if (cart) {
      cart.items = cart.items.filter(p => p.product != productId);
      cart = await cart.save();
      await cart.populate('items.product');
      return res.status(200).json({ success: true, data: cart });
    }

    res.status(404).json({ success: false, message: 'Cart not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
