const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const { uploadImage } = require('../utils/cloudinary');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new admin (TEMPORARY - REMOVE/SECURE BEFORE PROD)
// @route   POST /api/auth/register
// @access  Public
const registerAdmin = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error('Please add all fields');
    }

    // Check if admin exists
    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      res.status(400);
      throw new Error('Admin already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin
    const admin = await Admin.create({
      username,
      email,
      password: hashedPassword,
    });

    if (admin) {
      res.status(201).json({
        _id: admin.id,
        username: admin.username,
        email: admin.email,
        token: generateToken(admin._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid admin data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate an admin
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for admin email
    const admin = await Admin.findOne({ email });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      res.json({
        _id: admin.id,
        username: admin.username,
        email: admin.email,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    res.status(200).json(admin);
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin business profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { businessName, proprietorName, address, email, phones, contactEmails } = req.body;

    const updateData = {
      businessName: businessName || '',
      proprietorName: proprietorName || '',
      address: address || '',
      // Arrays are JSON-stringified from FormData on the frontend
      phones: phones ? JSON.parse(phones) : [],
      contactEmails: contactEmails ? JSON.parse(contactEmails) : [],
    };

    // Only update login email if provided
    if (email) updateData.email = email;

    // If a new logo file was uploaded, push it to Cloudinary
    if (req.file) {
      const logoUrl = await uploadImage(req.file.buffer);
      updateData.businessLogo = logoUrl;
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.status(200).json(updatedAdmin);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getMe,
  updateProfile,
};
