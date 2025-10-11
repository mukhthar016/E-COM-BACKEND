// models/addressModel.js
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: {
     type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
       required: true 
    }, // owner
  label: {
     type: String 
    }, // e.g. "Home", "Work"
  line1: {
     type: String,
      required: true
     },
  line2: {
     type: String 
    },
  city: {
     type: String,
      required: true 
    },
  state: {
     type: String 
    },
  country: {
     type: String,
      default: 'India' 
    },
  postalCode: {
     type: String 
    },
  phone: {
     type: String 
    },
  isDefault: {
     type: Boolean,
      default: false 
    }
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);
