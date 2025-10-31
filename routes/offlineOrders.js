const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  createOfflineOrder,
  getOfflineOrders,
  getOfflineOrderById,
  updateOfflineOrder,
  deleteOfflineOrder,
} = require('../controllers/offlineOrderController');

router.use(verifyToken);

router.post('/', createOfflineOrder);
router.get('/', getOfflineOrders);
router.get('/:id', getOfflineOrderById);
router.put('/:id', updateOfflineOrder);
router.delete('/:id', deleteOfflineOrder);

module.exports = router;
