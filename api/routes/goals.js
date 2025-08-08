/**
 * Goal API Routes
 * Handles all goal-related endpoints
 */

import express from 'express';
import { GoalService } from '../../services/goalService.js';
import { validateGoal, validateGoalUpdate } from '../../utils/validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = express.Router();
const goalService = new GoalService();

/**
 * @route   GET /api/goals
 * @desc    Get all goals with pagination
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, customer_id, status } = req.query;
  const goals = await goalService.getAllGoals({
    page: parseInt(page),
    limit: parseInt(limit),
    customer_id: customer_id ? parseInt(customer_id) : null,
    status
  });
  
  res.json({
    success: true,
    data: goals.data,
    pagination: goals.pagination
  });
}));

/**
 * @route   GET /api/goals/:id
 * @desc    Get goal by ID
 * @access  Private
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const goal = await goalService.getGoalById(id);
  
  if (!goal) {
    return res.status(404).json({
      success: false,
      error: 'Goal not found'
    });
  }
  
  res.json({
    success: true,
    data: goal
  });
}));

/**
 * @route   POST /api/goals
 * @desc    Create a new goal
 * @access  Private
 */
router.post('/', validateGoal, asyncHandler(async (req, res) => {
  const goalData = req.body;
  const goal = await goalService.createGoal(goalData);
  
  res.status(201).json({
    success: true,
    data: goal
  });
}));

/**
 * @route   PUT /api/goals/:id
 * @desc    Update goal
 * @access  Private
 */
router.put('/:id', validateGoalUpdate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const goal = await goalService.updateGoal(id, updateData);
  
  if (!goal) {
    return res.status(404).json({
      success: false,
      error: 'Goal not found'
    });
  }
  
  res.json({
    success: true,
    data: goal
  });
}));

/**
 * @route   DELETE /api/goals/:id
 * @desc    Delete goal
 * @access  Private
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await goalService.deleteGoal(id);
  
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: 'Goal not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Goal deleted successfully'
  });
}));

/**
 * @route   GET /api/goals/:id/progress
 * @desc    Get goal progress
 * @access  Private
 */
router.get('/:id/progress', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const progress = await goalService.getGoalProgress(id);
  
  res.json({
    success: true,
    data: progress
  });
}));

/**
 * @route   POST /api/goals/:id/contribute
 * @desc    Contribute to a goal
 * @access  Private
 */
router.post('/:id/contribute', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, account_id, description } = req.body;
  
  const contribution = await goalService.contributeToGoal(id, {
    amount: parseFloat(amount),
    account_id: parseInt(account_id),
    description
  });
  
  res.json({
    success: true,
    data: contribution
  });
}));

export default router; 