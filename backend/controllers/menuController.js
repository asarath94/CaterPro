const MasterMenu = require('../models/MasterMenu');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Private
const getMenuItems = async (req, res, next) => {
  try {
    const menuItems = await MasterMenu.find().sort({ category: 1, subCategory: 1, itemName: 1 });
    res.status(200).json(menuItems);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a menu item
// @route   POST /api/menu
// @access  Private
const createMenuItem = async (req, res, next) => {
  try {
    const { category, subCategory, itemName } = req.body;

    if (!category || !subCategory || !itemName) {
      res.status(400);
      throw new Error('Please add all fields');
    }

    const menuItem = await MasterMenu.create({
      category,
      subCategory,
      itemName,
    });

    res.status(201).json(menuItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a menu item
// @route   PUT /api/menu/:id
// @access  Private
const updateMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MasterMenu.findById(req.params.id);

    if (!menuItem) {
      res.status(404);
      throw new Error('Menu item not found');
    }

    const updatedMenuItem = await MasterMenu.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedMenuItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
// @access  Private
const deleteMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MasterMenu.findById(req.params.id);

    if (!menuItem) {
      res.status(404);
      throw new Error('Menu item not found');
    }

    await menuItem.deleteOne();

    res.status(200).json({ id: req.params.id, message: 'Menu item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
