/**
 * Transaction API Routes
 * Handles all transaction-related endpoints
 */

import express from 'express';
import { TransactionService } from '../../services/transactionService.js';
import { validateTransaction, validateTransactionUpdate } from '../../utils/validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = express.Router();
const transactionService = new TransactionService();

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions with filtering and pagination
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    account_id, 
    category_id, 
    start_date, 
    end_date,
    is_debit,
    is_bill,
    is_subscription,
    min_amount,
    max_amount
  } = req.query;
  
  const filters = {
    account_id: account_id ? parseInt(account_id) : null,
    category_id: category_id ? parseInt(category_id) : null,
    start_date,
    end_date,
    is_debit: is_debit === 'true',
    is_bill: is_bill === 'true',
    is_subscription: is_subscription === 'true',
    min_amount: min_amount ? parseFloat(min_amount) : null,
    max_amount: max_amount ? parseFloat(max_amount) : null
  };
  
  const transactions = await transactionService.getTransactions({
    page: parseInt(page),
    limit: parseInt(limit),
    filters
  });
  
  res.json({
    success: true,
    data: transactions.data,
    pagination: transactions.pagination,
    summary: transactions.summary
  });
}));

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transaction = await transactionService.getTransactionById(id);
  
  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found'
    });
  }
  
  res.json({
    success: true,
    data: transaction
  });
}));

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post('/', validateTransaction, asyncHandler(async (req, res) => {
  const transactionData = req.body;
  const transaction = await transactionService.createTransaction(transactionData);
  
  res.status(201).json({
    success: true,
    data: transaction
  });
}));

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update transaction
 * @access  Private
 */
router.put('/:id', validateTransactionUpdate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const transaction = await transactionService.updateTransaction(id, updateData);
  
  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found'
    });
  }
  
  res.json({
    success: true,
    data: transaction
  });
}));

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction
 * @access  Private
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await transactionService.deleteTransaction(id);
  
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Transaction deleted successfully'
  });
}));

/**
 * @route   GET /api/transactions/account/:accountId/summary
 * @desc    Get transaction summary for an account
 * @access  Private
 */
router.get('/account/:accountId/summary', asyncHandler(async (req, res) => {
  const { accountId } = req.params;
  const { period = 'month' } = req.query;
  
  const summary = await transactionService.getAccountSummary(accountId, period);
  
  res.json({
    success: true,
    data: summary
  });
}));

/**
 * @route   GET /api/transactions/category/:categoryId
 * @desc    Get transactions by category
 * @access  Private
 */
router.get('/category/:categoryId', asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const transactions = await transactionService.getTransactionsByCategory(categoryId, {
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
 * @route   POST /api/transactions/bulk
 * @desc    Create multiple transactions
 * @access  Private
 */
router.post('/bulk', asyncHandler(async (req, res) => {
  const { transactions } = req.body;
  
  if (!Array.isArray(transactions)) {
    return res.status(400).json({
      success: false,
      error: 'Transactions must be an array'
    });
  }
  
  const results = await transactionService.createBulkTransactions(transactions);
  
  res.status(201).json({
    success: true,
    data: results
  });
}));

/**
 * @route   GET /api/transactions/analytics/spending
 * @desc    Get spending analytics
 * @access  Private
 */
router.get('/analytics/spending', asyncHandler(async (req, res) => {
  const { 
    account_id, 
    start_date, 
    end_date, 
    group_by = 'category' 
  } = req.query;
  
  const analytics = await transactionService.getSpendingAnalytics({
    account_id: account_id ? parseInt(account_id) : null,
    start_date,
    end_date,
    group_by
  });
  
  res.json({
    success: true,
    data: analytics
  });
}));

export default router; 