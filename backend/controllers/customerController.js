const Customer = require('../models/Customer');
const { uploadImage } = require('../utils/cloudinary');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.status(200).json(customers);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }
    res.status(200).json(customer);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, location } = req.body;
    let photoURL = '';

    if (!name || !phone) {
      res.status(400);
      throw new Error('Please provide name and phone number');
    }

    if (req.file) {
      photoURL = await uploadImage(req.file.buffer);
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      location,
      photoURL,
    });

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }

    let photoURL = customer.photoURL;

    if (req.file) {
      photoURL = await uploadImage(req.file.buffer);
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, photoURL },
      { new: true }
    );

    res.status(200).json(updatedCustomer);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }

    await customer.deleteOne();

    res.status(200).json({ id: req.params.id, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
