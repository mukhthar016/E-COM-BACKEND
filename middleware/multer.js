const multer = require("multer");

// Use memory storage for direct Cloudinary upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
