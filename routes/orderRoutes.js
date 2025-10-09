const express = require('express');
const router = express.Router();
const { placeOrder,cancelOrder, getUserOrders, getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

// User routes only logged in users can access
router.post('/', authMiddleware, placeOrder);
router.get('/myorders', authMiddleware, getUserOrders);
router.put('/:id/cancel', authMiddleware, cancelOrder);


// Admin protected routes only admins can access this 
router.get('/', authMiddleware, getAllOrders);
router.put('/:id', authMiddleware, updateOrderStatus);


module.exports = router;
