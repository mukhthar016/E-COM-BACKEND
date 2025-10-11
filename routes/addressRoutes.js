// routes/addressRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // your auth middleware
const { addAddress, getAddresses, updateAddress, deleteAddress } = require('../controllers/addressController');

// All routes protected — user must be logged in
router.post('/', authMiddleware, addAddress);       // POST /api/addresses
router.get('/', authMiddleware, getAddresses);      // GET  /api/addresses
router.put('/:id', authMiddleware, updateAddress);  // PUT  /api/addresses/:id
router.delete('/:id', authMiddleware, deleteAddress); // DELETE /api/addresses/:id

module.exports = router;
