const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCalendarEvents } = require('../controllers/calendarController');

router.route('/')
  .get(protect, getCalendarEvents);

module.exports = router;
