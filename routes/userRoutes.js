const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile, listUsers } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware')
// Public or anyone without logging in can access
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected only logged in users can access 
router.get('/profile', authMiddleware, getProfile);

// Admin-only only admin access this 
router.get('/ALL', authMiddleware, adminMiddleware, listUsers);

module.exports = router;
