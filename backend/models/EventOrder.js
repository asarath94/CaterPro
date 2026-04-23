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

// Indexes for fast order queries
eventOrderSchema.index({ customer: 1 });          // fetch orders by customer
eventOrderSchema.index({ 'subEvents.date': 1 });   // sort/filter by event date
eventOrderSchema.index({ status: 1 });             // filter by status

module.exports = mongoose.model('EventOrder', eventOrderSchema);
