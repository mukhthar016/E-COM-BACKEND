const express = require('express');
const router = express.Router();
const { addCategory, listCategories } = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/', listCategories);
router.post('/', authMiddleware, adminMiddleware, addCategory);

module.exports = router;
