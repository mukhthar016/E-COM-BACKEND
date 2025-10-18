const express = require("express");
const router = express.Router();
const { submitFeedback, getAllFeedback,withdrawFeedback } = require("../controllers/feedbackController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/:orderId", authMiddleware, submitFeedback); // user submits feedback
router.get("/",authMiddleware, adminMiddleware, getAllFeedback);         // admin reads all
router.delete("/:orderId", authMiddleware, withdrawFeedback);

module.exports = router;
