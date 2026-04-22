const mongoose = require('mongoose');

const subEventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true, // e.g., 'Sangeet', 'Wedding Reception', 'Breakfast'
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  guestCount: {
    type: Number,
    required: true,
    min: 1,
  },
  selectedMenuItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterMenu',
  }],
});

const eventOrderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  subEvents: [subEventSchema], // Array of nested sub-events
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  notes: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('EventOrder', eventOrderSchema);
