const express = require('express');
const router = express.Router();
const {
  placeOrder,
  cancelOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// ================= USER ROUTES =================

// 🛒 Place a new order (only logged-in users)
router.post('/', authMiddleware, placeOrder);

// 📦 Get logged-in user's orders
router.get('/myorders', authMiddleware, getUserOrders);

// ❌ Cancel a specific order (only logged-in users)
router.put('/:id/cancel', authMiddleware, cancelOrder);

// ================= ADMIN ROUTES =================

// 👑 View all orders (admin only)
router.get('/', authMiddleware, adminMiddleware, getAllOrders);

// 🚚 Update order status (admin only)
router.put('/:id', authMiddleware, adminMiddleware, updateOrderStatus);

module.exports = router;
