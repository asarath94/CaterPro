const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  photoURL: {
    type: String,
  },
  location: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes for fast lookups
customerSchema.index({ name: 1 });
customerSchema.index({ phone: 1 });

module.exports = mongoose.model('Customer', customerSchema);
