const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');

router.route('/')
  .get(protect, getCustomers)
  .post(protect, upload.single('photo'), createCustomer);

router.route('/:id')
  .get(protect, getCustomerById)
  .put(protect, upload.single('photo'), updateCustomer)
  .delete(protect, deleteCustomer);

module.exports = router;
