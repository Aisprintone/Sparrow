/**
 * Validation Utilities
 * Provides request validation middleware and functions
 */

import { ValidationError } from './errors.js';

/**
 * Validate customer data
 */
export const validateCustomer = (req, res, next) => {
  try {
    const { location, age, notification_prefs } = req.body;

    if (!location || typeof location !== 'string') {
      throw new ValidationError('Location is required and must be a string');
    }

    if (!age || typeof age !== 'number' || age < 0 || age > 120) {
      throw new ValidationError('Age must be a number between 0 and 120');
    }

    if (notification_prefs && typeof notification_prefs !== 'object') {
      throw new ValidationError('Notification preferences must be an object');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate customer update data
 */
export const validateCustomerUpdate = (req, res, next) => {
  try {
    const { location, age, notification_prefs } = req.body;

    if (location !== undefined && typeof location !== 'string') {
      throw new ValidationError('Location must be a string');
    }

    if (age !== undefined && (typeof age !== 'number' || age < 0 || age > 120)) {
      throw new ValidationError('Age must be a number between 0 and 120');
    }

    if (notification_prefs !== undefined && typeof notification_prefs !== 'object') {
      throw new ValidationError('Notification preferences must be an object');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate transaction data
 */
export const validateTransaction = (req, res, next) => {
  try {
    const { account_id, amount, description, category_id, is_debit, is_bill, is_subscription } = req.body;

    if (!account_id || typeof account_id !== 'number') {
      throw new ValidationError('Account ID is required and must be a number');
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new ValidationError('Amount is required and must be a positive number');
    }

    if (!description || typeof description !== 'string') {
      throw new ValidationError('Description is required and must be a string');
    }

    if (category_id !== undefined && typeof category_id !== 'number') {
      throw new ValidationError('Category ID must be a number');
    }

    if (is_debit !== undefined && typeof is_debit !== 'boolean') {
      throw new ValidationError('Is debit must be a boolean');
    }

    if (is_bill !== undefined && typeof is_bill !== 'boolean') {
      throw new ValidationError('Is bill must be a boolean');
    }

    if (is_subscription !== undefined && typeof is_subscription !== 'boolean') {
      throw new ValidationError('Is subscription must be a boolean');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate transaction update data
 */
export const validateTransactionUpdate = (req, res, next) => {
  try {
    const { account_id, amount, description, category_id, is_debit, is_bill, is_subscription } = req.body;

    if (account_id !== undefined && typeof account_id !== 'number') {
      throw new ValidationError('Account ID must be a number');
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      throw new ValidationError('Amount must be a positive number');
    }

    if (description !== undefined && typeof description !== 'string') {
      throw new ValidationError('Description must be a string');
    }

    if (category_id !== undefined && typeof category_id !== 'number') {
      throw new ValidationError('Category ID must be a number');
    }

    if (is_debit !== undefined && typeof is_debit !== 'boolean') {
      throw new ValidationError('Is debit must be a boolean');
    }

    if (is_bill !== undefined && typeof is_bill !== 'boolean') {
      throw new ValidationError('Is bill must be a boolean');
    }

    if (is_subscription !== undefined && typeof is_subscription !== 'boolean') {
      throw new ValidationError('Is subscription must be a boolean');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate account data
 */
export const validateAccount = (req, res, next) => {
  try {
    const { customer_id, institution_name, account_number, account_type, balance, credit_limit } = req.body;

    if (!customer_id || typeof customer_id !== 'number') {
      throw new ValidationError('Customer ID is required and must be a number');
    }

    if (!institution_name || typeof institution_name !== 'string') {
      throw new ValidationError('Institution name is required and must be a string');
    }

    if (!account_number || typeof account_number !== 'string') {
      throw new ValidationError('Account number is required and must be a string');
    }

    if (!account_type || typeof account_type !== 'string') {
      throw new ValidationError('Account type is required and must be a string');
    }

    if (balance !== undefined && (typeof balance !== 'number' || balance < 0)) {
      throw new ValidationError('Balance must be a non-negative number');
    }

    if (credit_limit !== undefined && (typeof credit_limit !== 'number' || credit_limit < 0)) {
      throw new ValidationError('Credit limit must be a non-negative number');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate account update data
 */
export const validateAccountUpdate = (req, res, next) => {
  try {
    const { customer_id, institution_name, account_number, account_type, balance, credit_limit } = req.body;

    if (customer_id !== undefined && typeof customer_id !== 'number') {
      throw new ValidationError('Customer ID must be a number');
    }

    if (institution_name !== undefined && typeof institution_name !== 'string') {
      throw new ValidationError('Institution name must be a string');
    }

    if (account_number !== undefined && typeof account_number !== 'string') {
      throw new ValidationError('Account number must be a string');
    }

    if (account_type !== undefined && typeof account_type !== 'string') {
      throw new ValidationError('Account type must be a string');
    }

    if (balance !== undefined && (typeof balance !== 'number' || balance < 0)) {
      throw new ValidationError('Balance must be a non-negative number');
    }

    if (credit_limit !== undefined && (typeof credit_limit !== 'number' || credit_limit < 0)) {
      throw new ValidationError('Credit limit must be a non-negative number');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate goal data
 */
export const validateGoal = (req, res, next) => {
  try {
    const { customer_id, name, description, target_amount, target_date } = req.body;

    if (!customer_id || typeof customer_id !== 'number') {
      throw new ValidationError('Customer ID is required and must be a number');
    }

    if (!name || typeof name !== 'string') {
      throw new ValidationError('Goal name is required and must be a string');
    }

    if (description !== undefined && typeof description !== 'string') {
      throw new ValidationError('Description must be a string');
    }

    if (!target_amount || typeof target_amount !== 'number' || target_amount <= 0) {
      throw new ValidationError('Target amount is required and must be a positive number');
    }

    if (target_date !== undefined) {
      const date = new Date(target_date);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Target date must be a valid date');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate goal update data
 */
export const validateGoalUpdate = (req, res, next) => {
  try {
    const { customer_id, name, description, target_amount, target_date } = req.body;

    if (customer_id !== undefined && typeof customer_id !== 'number') {
      throw new ValidationError('Customer ID must be a number');
    }

    if (name !== undefined && typeof name !== 'string') {
      throw new ValidationError('Goal name must be a string');
    }

    if (description !== undefined && typeof description !== 'string') {
      throw new ValidationError('Description must be a string');
    }

    if (target_amount !== undefined && (typeof target_amount !== 'number' || target_amount <= 0)) {
      throw new ValidationError('Target amount must be a positive number');
    }

    if (target_date !== undefined) {
      const date = new Date(target_date);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Target date must be a valid date');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate category data
 */
export const validateCategory = (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      throw new ValidationError('Category name is required and must be a string');
    }

    if (name.length < 1 || name.length > 255) {
      throw new ValidationError('Category name must be between 1 and 255 characters');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate category update data
 */
export const validateCategoryUpdate = (req, res, next) => {
  try {
    const { name } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string') {
        throw new ValidationError('Category name must be a string');
      }

      if (name.length < 1 || name.length > 255) {
        throw new ValidationError('Category name must be between 1 and 255 characters');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate simulation request data
 */
export const validateSimulationRequest = (req, res, next) => {
  try {
    const { current_age, retirement_age, current_savings, monthly_contribution, expected_return, inflation_rate } = req.body;

    // Basic validation for common simulation fields
    if (current_age !== undefined && (typeof current_age !== 'number' || current_age < 18 || current_age > 100)) {
      throw new ValidationError('Current age must be a number between 18 and 100');
    }

    if (retirement_age !== undefined && (typeof retirement_age !== 'number' || retirement_age < 50 || retirement_age > 80)) {
      throw new ValidationError('Retirement age must be a number between 50 and 80');
    }

    if (current_savings !== undefined && (typeof current_savings !== 'number' || current_savings < 0)) {
      throw new ValidationError('Current savings must be a non-negative number');
    }

    if (monthly_contribution !== undefined && (typeof monthly_contribution !== 'number' || monthly_contribution < 0)) {
      throw new ValidationError('Monthly contribution must be a non-negative number');
    }

    if (expected_return !== undefined && (typeof expected_return !== 'number' || expected_return < 0 || expected_return > 0.2)) {
      throw new ValidationError('Expected return must be a number between 0% and 20%');
    }

    if (inflation_rate !== undefined && (typeof inflation_rate !== 'number' || inflation_rate < 0 || inflation_rate > 0.1)) {
      throw new ValidationError('Inflation rate must be a number between 0% and 10%');
    }

    next();
  } catch (error) {
    next(error);
  }
}; 