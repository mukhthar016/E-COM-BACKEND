const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    feedbackText: {
      type: String,
      required: true,
    },
   
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
