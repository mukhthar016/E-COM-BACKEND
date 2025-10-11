// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const { createRazorpayOrder, upiPayment,verifyPayment } = require("../controllers/paymentController");

router.post("/upi", upiPayment); // Simulated
router.post("/razorpay/create-order", createRazorpayOrder);
router.post("/razorpay/verify-payment", verifyPayment);


module.exports = router;
