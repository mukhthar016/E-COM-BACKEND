const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeCartItem,mergeGuestCart } = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require login
router.get('/', authMiddleware, getCart);
router.post('/', authMiddleware, addToCart);
router.put('/', authMiddleware, updateCartItem);
router.delete('/:productId', authMiddleware, removeCartItem);
router.post("/merge", authMiddleware, mergeGuestCart);

module.exports = router;
