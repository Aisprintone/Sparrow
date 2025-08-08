/**
 * Customer Service
 * Handles all customer-related business logic
 */

import { CustomerModel } from '../models/customerModel.js';
import { AccountModel } from '../models/accountModel.js';
import { GoalModel } from '../models/goalModel.js';
import { TransactionModel } from '../models/transactionModel.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export class CustomerService {
  constructor() {
    this.customerModel = new CustomerModel();
    this.accountModel = new AccountModel();
    this.goalModel = new GoalModel();
    this.transactionModel = new TransactionModel();
  }

  /**
   * Get all customers with pagination and search
   */
  async getAllCustomers({ page = 1, limit = 10, search = null }) {
    try {
      const offset = (page - 1) * limit;
      const customers = await this.customerModel.findAll({
        limit,
        offset,
        search
      });

      const total = await this.customerModel.count({ search });
      const totalPages = Math.ceil(total / limit);

      return {
        data: customers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get customers: ${error.message}`);
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id) {
    try {
      const customer = await this.customerModel.findById(id);
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }
      return customer;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get customer: ${error.message}`);
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData) {
    try {
      // Validate required fields
      if (!customerData.location || !customerData.age) {
        throw new ValidationError('Location and age are required');
      }

      // Validate age
      if (customerData.age < 0 || customerData.age > 120) {
        throw new ValidationError('Age must be between 0 and 120');
      }

      // Set default notification preferences if not provided
      if (!customerData.notification_prefs) {
        customerData.notification_prefs = {
          email: true,
          sms: false,
          push: true
        };
      }

      const customer = await this.customerModel.create(customerData);
      return customer;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(id, updateData) {
    try {
      const customer = await this.customerModel.findById(id);
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      // Validate age if provided
      if (updateData.age !== undefined) {
        if (updateData.age < 0 || updateData.age > 120) {
          throw new ValidationError('Age must be between 0 and 120');
        }
      }

      const updatedCustomer = await this.customerModel.update(id, updateData);
      return updatedCustomer;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to update customer: ${error.message}`);
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id) {
    try {
      const customer = await this.customerModel.findById(id);
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      // Check if customer has accounts
      const accounts = await this.accountModel.findByCustomerId(id);
      if (accounts.length > 0) {
        throw new ValidationError('Cannot delete customer with existing accounts');
      }

      const deleted = await this.customerModel.delete(id);
      return deleted;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to delete customer: ${error.message}`);
    }
  }

  /**
   * Get customer accounts
   */
  async getCustomerAccounts(customerId) {
    try {
      const customer = await this.customerModel.findById(customerId);
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      const accounts = await this.accountModel.findByCustomerId(customerId);
      return accounts;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get customer accounts: ${error.message}`);
    }
  }

  /**
   * Get customer goals
   */
  async getCustomerGoals(customerId) {
    try {
      const customer = await this.customerModel.findById(customerId);
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      const goals = await this.goalModel.findByCustomerId(customerId);
      return goals;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get customer goals: ${error.message}`);
    }
  }

  /**
   * Get customer financial summary
   */
  async getCustomerFinancialSummary(customerId) {
    try {
      const customer = await this.customerModel.findById(customerId);
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      const accounts = await this.accountModel.findByCustomerId(customerId);
      const goals = await this.goalModel.findByCustomerId(customerId);
      
      // Calculate total balance across all accounts
      const totalBalance = accounts.reduce((sum, account) => {
        return sum + parseFloat(account.balance || 0);
      }, 0);

      // Calculate total credit limit
      const totalCreditLimit = accounts.reduce((sum, account) => {
        return sum + parseFloat(account.credit_limit || 0);
      }, 0);

      // Calculate total goal target amount
      const totalGoalAmount = goals.reduce((sum, goal) => {
        return sum + parseFloat(goal.target_amount || 0);
      }, 0);

      return {
        customer,
        accounts: {
          count: accounts.length,
          total_balance: totalBalance,
          total_credit_limit: totalCreditLimit,
          list: accounts
        },
        goals: {
          count: goals.length,
          total_target_amount: totalGoalAmount,
          list: goals
        }
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get customer financial summary: ${error.message}`);
    }
  }
} 