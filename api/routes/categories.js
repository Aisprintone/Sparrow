/**
 * Category API Routes
 * Handles all category-related endpoints
 */

import express from 'express';
import { CategoryService } from '../../services/categoryService.js';
import { validateCategory, validateCategoryUpdate } from '../../utils/validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = express.Router();
const categoryService = new CategoryService();

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  
  res.json({
    success: true,
    data: categories
  });
}));

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Private
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await categoryService.getCategoryById(id);
  
  if (!category) {
    return res.status(404).json({
      success: false,
      error: 'Category not found'
    });
  }
  
  res.json({
    success: true,
    data: category
  });
}));

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private
 */
router.post('/', validateCategory, asyncHandler(async (req, res) => {
  const categoryData = req.body;
  const category = await categoryService.createCategory(categoryData);
  
  res.status(201).json({
    success: true,
    data: category
  });
}));

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private
 */
router.put('/:id', validateCategoryUpdate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const category = await categoryService.updateCategory(id, updateData);
  
  if (!category) {
    return res.status(404).json({
      success: false,
      error: 'Category not found'
    });
  }
  
  res.json({
    success: true,
    data: category
  });
}));

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await categoryService.deleteCategory(id);
  
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: 'Category not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
}));

/**
 * @route   GET /api/categories/:id/transactions
 * @desc    Get transactions by category
 * @access  Private
 */
router.get('/:id/transactions', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const transactions = await categoryService.getTransactionsByCategory(id, {
    page: parseInt(page),
    limit: parseInt(limit)
  });
  
  res.json({
    success: true,
    data: transactions.data,
    pagination: transactions.pagination
  });
}));

/**
 * @route   GET /api/categories/:id/analytics
 * @desc    Get category analytics
 * @access  Private
 */
router.get('/:id/analytics', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { start_date, end_date } = req.query;
  
  const analytics = await categoryService.getCategoryAnalytics(id, {
    start_date,
    end_date
  });
  
  res.json({
    success: true,
    data: analytics
  });
}));

export default router; 