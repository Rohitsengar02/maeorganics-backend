const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getAllOrders,
  adminUpdateOrderStatus,
  adminGetOrderById,
} = require('../controllers/orderController');

// All order routes require auth
router.use(verifyToken);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

// Previously admin-only; per request, allow any authenticated user
router.get('/admin/all', getAllOrders);
router.get('/admin/:id', adminGetOrderById);
router.put('/admin/:id/status', adminUpdateOrderStatus);

module.exports = router;
