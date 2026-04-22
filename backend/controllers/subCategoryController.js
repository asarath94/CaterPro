const SubCategory = require('../models/SubCategory');

// @desc    Get all sub categories
// @route   GET /api/menu/categories
// @access  Private
const getSubCategories = async (req, res, next) => {
  try {
    const categories = await SubCategory.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a sub category
// @route   POST /api/menu/categories
// @access  Private
const createSubCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Please append a category name');
    }

    // Check if exists
    const exists = await SubCategory.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (exists) {
      res.status(400);
      throw new Error('Category already exists');
    }

    const newCategory = await SubCategory.create({ name });
    res.status(201).json(newCategory);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a sub category
// @route   DELETE /api/menu/categories/:id
// @access  Private
const deleteSubCategory = async (req, res, next) => {
  try {
    const category = await SubCategory.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    await category.deleteOne();
    res.status(200).json({ id: req.params.id, message: 'Category removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubCategories,
  createSubCategory,
  deleteSubCategory,
};
