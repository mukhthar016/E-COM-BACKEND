const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { 
        type: String,
         required: true 
        },
    category: {
         type: mongoose.Schema.Types.ObjectId,
          ref: "Category" 
        },
    price: {
         type: Number,
          required: true 
        },
    stock: {
         type: Number,
          default: 0 
        },
    image: {
         type: String 
        },           // Cloudinary URL
    cloudinaryId: {
         type: String 
        }     // Cloudinary public_id for delete/update
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
