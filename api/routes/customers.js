/**
 * Customer API Routes
 * Handles all customer-related endpoints
 */

import express from 'express';
import { CustomerService } from '../../services/customerService.js';
import { validateCustomer, validateCustomerUpdate } from '../../utils/validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = express.Router();
const customerService = new CustomerService();

/**
 * @route   GET /api/customers
 * @desc    Get all customers with pagination
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const customers = await customerService.getAllCustomers({
    page: parseInt(page),
    limit: parseInt(limit),
    search
  });
  
  res.json({
    success: true,
    data: customers.data,
    pagination: customers.pagination
  });
}));

/**
 * @route   GET /api/customers/:id
 * @desc    Get customer by ID
 * @access  Private
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customer = await customerService.getCustomerById(id);
  
  if (!customer) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found'
    });
  }
  
  res.json({
    success: true,
    data: customer
  });
}));

/**
 * @route   POST /api/customers
 * @desc    Create a new customer
 * @access  Private
 */
router.post('/', validateCustomer, asyncHandler(async (req, res) => {
  const customerData = req.body;
  const customer = await customerService.createCustomer(customerData);
  
  res.status(201).json({
    success: true,
    data: customer
  });
}));

/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer
 * @access  Private
 */
router.put('/:id', validateCustomerUpdate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const customer = await customerService.updateCustomer(id, updateData);
  
  if (!customer) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found'
    });
  }
  
  res.json({
    success: true,
    data: customer
  });
}));

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete customer
 * @access  Private
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await customerService.deleteCustomer(id);
  
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Customer deleted successfully'
  });
}));

/**
 * @route   GET /api/customers/:id/accounts
 * @desc    Get customer accounts
 * @access  Private
 */
router.get('/:id/accounts', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const accounts = await customerService.getCustomerAccounts(id);
  
  res.json({
    success: true,
    data: accounts
  });
}));

/**
 * @route   GET /api/customers/:id/goals
 * @desc    Get customer goals
 * @access  Private
 */
router.get('/:id/goals', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const goals = await customerService.getCustomerGoals(id);
  
  res.json({
    success: true,
    data: goals
  });
}));

/**
 * @route   GET /api/customers/:id/financial-summary
 * @desc    Get customer financial summary (networth data)
 * @access  Private
 */
router.get('/:id/financial-summary', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const summary = await customerService.getCustomerFinancialSummary(id);
  
  res.json({
    success: true,
    data: summary
  });
}));

export default router; 