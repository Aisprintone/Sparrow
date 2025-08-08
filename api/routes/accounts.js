/**
 * Account API Routes
 * Handles all account-related endpoints
 */

import express from 'express';
import { AccountService } from '../../services/accountService.js';
import { validateAccount, validateAccountUpdate } from '../../utils/validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = express.Router();
const accountService = new AccountService();

/**
 * @route   GET /api/accounts
 * @desc    Get all accounts with pagination
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, customer_id, account_type } = req.query;
  const accounts = await accountService.getAllAccounts({
    page: parseInt(page),
    limit: parseInt(limit),
    customer_id: customer_id ? parseInt(customer_id) : null,
    account_type
  });
  
  res.json({
    success: true,
    data: accounts.data,
    pagination: accounts.pagination
  });
}));

/**
 * @route   GET /api/accounts/:id
 * @desc    Get account by ID
 * @access  Private
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const account = await accountService.getAccountById(id);
  
  if (!account) {
    return res.status(404).json({
      success: false,
      error: 'Account not found'
    });
  }
  
  res.json({
    success: true,
    data: account
  });
}));

/**
 * @route   POST /api/accounts
 * @desc    Create a new account
 * @access  Private
 */
router.post('/', validateAccount, asyncHandler(async (req, res) => {
  const accountData = req.body;
  const account = await accountService.createAccount(accountData);
  
  res.status(201).json({
    success: true,
    data: account
  });
}));

/**
 * @route   PUT /api/accounts/:id
 * @desc    Update account
 * @access  Private
 */
router.put('/:id', validateAccountUpdate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const account = await accountService.updateAccount(id, updateData);
  
  if (!account) {
    return res.status(404).json({
      success: false,
      error: 'Account not found'
    });
  }
  
  res.json({
    success: true,
    data: account
  });
}));

/**
 * @route   DELETE /api/accounts/:id
 * @desc    Delete account
 * @access  Private
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await accountService.deleteAccount(id);
  
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: 'Account not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
}));

/**
 * @route   GET /api/accounts/:id/transactions
 * @desc    Get account transactions
 * @access  Private
 */
router.get('/:id/transactions', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const transactions = await accountService.getAccountTransactions(id, {
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
 * @route   GET /api/accounts/:id/balance
 * @desc    Get account balance and summary
 * @access  Private
 */
router.get('/:id/balance', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const balance = await accountService.getAccountBalance(id);
  
  res.json({
    success: true,
    data: balance
  });
}));

export default router; 