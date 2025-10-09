// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const { createRazorpayOrder, upiPayment } = require("../controllers/paymentController");

router.post("/upi", upiPayment); // Simulated
router.post("/razorpay/create-order", createRazorpayOrder); // Real test order

module.exports = router;
