const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
         type: mongoose.Schema.Types.ObjectId, 
         ref: 'User', 
         required: true 
        },
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product' },
            quantity: { type: Number, 
            default: 1 }
        }
    ],
    totalPrice: { type: Number, 
    required: true 
    },
    address: { 
        type: String, 
        required: true 
    },
    paymentMethod: {
         type: String, 
         enum: ['COD', 'UPI'], 
         default: 'COD' 
        },
    status: {
         type: String, 
         enum: ['Pending', 'Dispatched', 'Delivered', 'Cancelled'], 
         default: 'Pending' 
        }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
