const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true
     },
    email: { 
      type: String, 
      required: true, 
      unique: true
     },
    password: { 
      type: String, 
      required: true 
    },
    isAdmin: {
       type: Boolean, 
       default: false 
      },
    addresses: [{ 
      type: String 
    }] // optional multiple addresses
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
