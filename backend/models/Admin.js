const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  // Business Profile Fields
  businessName: { type: String, trim: true, default: '' },
  proprietorName: { type: String, trim: true, default: '' },
  businessLogo: { type: String, default: '' }, // Cloudinary URL
  address: { type: String, trim: true, default: '' },
  phones: { type: [String], default: [] },
  contactEmails: { type: [String], default: [] },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Admin', adminSchema);
