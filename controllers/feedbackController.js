const Feedback = require("../models/FeedbackModel");
const Order = require("../models/orderModel");

// Customer submits feedback
const submitFeedback = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { feedbackText, rating } = req.body;

    console.log(" Incoming feedback:", feedbackText, "for order:", orderId);
    console.log(" Authenticated user:", req.user);

    const userId = req.user._id || req.user.id; 
    const order = await Order.findOne({ _id: orderId, user: userId });
    console.log(" Order search result:", order);

    if (!order) {
      console.log(" Order not found with:", { orderId, user: userId });
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ message: "Feedback allowed only for delivered orders" });
    }

    const existing = await Feedback.findOne({ order: order._id });
    if (existing) {
      return res.status(400).json({ message: "Feedback already submitted" });
    }

    const newFeedback = await Feedback.create({
      user: userId,
      order: order._id,
      feedbackText,
      rating,
    });

    order.feedbackSubmitted = true;
    await order.save();

    console.log(" Feedback created successfully");
    res.status(201).json({ message: "Feedback submitted successfully", feedback: newFeedback });
  } catch (err) {
    console.error("submitFeedback error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Admin reads all feedback
const getAllFeedback = async (req, res) => {
  console.log(res)
  try {
    const feedbacks = await Feedback.find()
      .populate("user", "name email")
      .populate("order", "_id totalPrice status")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: feedbacks.length, feedbacks });
  } catch (err) {
    console.error("getAllFeedback error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//delete feedback 

// Delete feedback (withdraw)
const withdrawFeedback = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id || req.user.id;

    const feedback = await Feedback.findOne({ order: orderId, user: userId });
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    await Feedback.deleteOne({ _id: feedback._id });

    // Update order to mark feedback as not submitted
    await Order.findByIdAndUpdate(orderId, { feedbackSubmitted: false });

    res.status(200).json({ message: "Feedback withdrawn successfully" });
  } catch (err) {
    console.error("withdrawFeedback error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { withdrawFeedback,submitFeedback, getAllFeedback };
