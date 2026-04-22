const mongoose = require('mongoose');

const masterMenuSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Veg', 'Non-Veg'],
  },
  subCategory: {
    type: String,
    required: true,
    trim: true, // e.g., 'Starters', 'Main Course', 'Desserts'
  },
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('MasterMenu', masterMenuSchema);
