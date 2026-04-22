const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuController');
const {
  getSubCategories,
  createSubCategory,
  deleteSubCategory,
} = require('../controllers/subCategoryController');

router.route('/categories')
  .get(protect, getSubCategories)
  .post(protect, createSubCategory);

router.route('/categories/:id')
  .delete(protect, deleteSubCategory);

router.route('/')
  .get(protect, getMenuItems)
  .post(protect, createMenuItem);

router.route('/:id')
  .put(protect, updateMenuItem)
  .delete(protect, deleteMenuItem);

module.exports = router;
