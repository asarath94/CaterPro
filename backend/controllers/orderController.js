const EventOrder = require('../models/EventOrder');

// @desc    Get all orders (with optional ?filter=upcoming|past)
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res, next) => {
  try {
    const { filter, customerId } = req.query;
    
    // Fetch all non-deleted orders (or just all)
    // Populate to send complete objects
    let query = {};
    if (customerId) {
        query.customer = customerId;
    }
    
    const orders = await EventOrder.find(query)
      .populate('customer')
      .populate('subEvents.selectedMenuItems')
      .sort({ createdAt: -1 });

    const now = new Date();
    // Normalize now to start of day for comparison purposes
    now.setHours(0, 0, 0, 0);

    let filteredOrders = orders;

    if (filter === 'upcoming') {
      filteredOrders = orders.filter(order => {
        // Upcoming if ANY subEvent date is >= today
        return order.subEvents.some(event => {
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= now;
        });
      });
    } else if (filter === 'past') {
      filteredOrders = orders.filter(order => {
        // Past if NO subEvent date is >= today (meaning ALL are past)
        if (!order.subEvents || order.subEvents.length === 0) return true; // empty subEvents are past

        return order.subEvents.every(event => {
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate < now;
        });
      });
    }

    res.status(200).json(filteredOrders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await EventOrder.findById(req.params.id)
      .populate('customer')
      .populate('subEvents.selectedMenuItems');

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { customer, subEvents, status, notes } = req.body;

    if (!customer || !subEvents || !Array.isArray(subEvents) || subEvents.length === 0) {
      res.status(400);
      throw new Error('Please provide a customer and at least one subEvent');
    }

    const order = await EventOrder.create({
      customer,
      subEvents,
      status: status || 'Pending',
      notes,
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = async (req, res, next) => {
  try {
    const order = await EventOrder.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const updatedOrder = await EventOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate('customer')
      .populate('subEvents.selectedMenuItems');

    res.status(200).json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res, next) => {
  try {
    const order = await EventOrder.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    await order.deleteOne();

    res.status(200).json({ id: req.params.id, message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};
