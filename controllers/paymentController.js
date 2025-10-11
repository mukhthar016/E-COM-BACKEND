
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});



//  Razorpay test order for fake payment 
const createRazorpayOrder = async (req, res) => {
  console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
  try {
    const { amount } = req.body; 

    const options = {
      amount: amount * 100, 
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

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;
    console.log("Verification input:", req.body);
console.log("Generated signature:", expectedSignature);
console.log("Razorpay signature:", razorpay_signature);


    if (isValid) {
      return res.json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.json({ success: false, message: "Invalid signature" });
    }
    
  } catch (err) {
    console.error("verifyPayment error:", err);
    res.status(500).json({ success: false, message: "Server error during verification" });
  }
};

// dummy upi for testing purpose ill remove it later
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

module.exports = { createRazorpayOrder, upiPayment,verifyPayment };
