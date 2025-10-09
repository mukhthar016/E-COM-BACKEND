// controllers/paymentController.js
const Razorpay = require("razorpay");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay test order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body; // amount in INR

    const options = {
      amount: amount * 100, // Razorpay expects paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({
      success: true,
      message: "Razorpay test order created successfully",
      order
    });
  } catch (err) {
    console.error("Razorpay error:", err);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

// You can still keep your old dummy UPI simulation if needed
const upiPayment = async (req, res) => {
  try {
    const { amount, upiId } = req.body;
    return res.json({
      success: true,
      message: "UPI payment simulated successfully",
      amount,
      upiId,
      txnId: "TXN" + Date.now()
    });
  } catch (err) {
    console.error("UPI error:", err);
    res.status(500).json({ message: "Payment failed" });
  }
};

module.exports = { createRazorpayOrder, upiPayment };
