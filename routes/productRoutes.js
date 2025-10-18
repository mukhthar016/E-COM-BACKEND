const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer'); // multer middleware
const { addProduct, updateProduct, deleteProduct, getProducts, getProductById } = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin only
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), addProduct);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;
