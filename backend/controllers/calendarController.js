const EventOrder = require('../models/EventOrder');

// @desc    Get all calendar events
// @route   GET /api/calendar
// @access  Private
const getCalendarEvents = async (req, res, next) => {
  try {
    // Exclude cancelled orders from the calendar
    const orders = await EventOrder.find({ status: { $ne: 'Cancelled' } })
      .populate('customer', 'name');

    // Flatten all subEvents into an array of simple calendar event objects
    const calendarData = orders.reduce((acc, order) => {
      
      const orderEvents = order.subEvents.map(event => {
        const customerName = order.customer ? order.customer.name : 'Unknown Customer';
        
        return {
          id: event._id,
          orderId: order._id,
          title: `${customerName} - ${event.eventName}`, // Used by react-big-calendar
          start: event.date, // Used by react-big-calendar
          end: event.date, // Single day event format for simplicity
          customerName: customerName,
          location: event.location,
          guestCount: event.guestCount,
          status: order.status
        };
      });

      return acc.concat(orderEvents);
    }, []);

    res.status(200).json(calendarData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCalendarEvents,
};
