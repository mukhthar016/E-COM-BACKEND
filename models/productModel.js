const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
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
        }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
