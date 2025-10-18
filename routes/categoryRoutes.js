const express = require('express');
const router = express.Router();
const {
  addCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes
router.get('/', listCategories);
router.get('/:id', getCategory);

// Admin-only routes
router.post('/', authMiddleware, adminMiddleware, addCategory);
router.put('/:id', authMiddleware, adminMiddleware, updateCategory);
router.delete('/:id', authMiddleware, adminMiddleware, deleteCategory);

module.exports = router;
