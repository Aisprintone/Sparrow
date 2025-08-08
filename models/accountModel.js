/**
 * Account Model
 * Handles account data operations and validation
 */

import { DatabaseConnection } from '../utils/database.js';
import { ValidationError } from '../utils/errors.js';

export class AccountModel {
  constructor() {
    this.db = new DatabaseConnection();
    this.tableName = 'account';
  }

  /**
   * Find accounts by customer ID
   */
  async findByCustomerId(customerId) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE customer_id = ? ORDER BY created_at DESC`;
      const [rows] = await this.db.execute(query, [customerId]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Find account by ID
   */
  async findById(id) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE account_id = ?`;
      const [rows] = await this.db.execute(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Create a new account
   */
  async create(accountData) {
    try {
      if (!accountData.customer_id) {
        throw new ValidationError('Customer ID is required');
      }

      const query = `
        INSERT INTO ${this.tableName} (customer_id, institution_name, account_number, account_type, balance, credit_limit)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        accountData.customer_id,
        accountData.institution_name || null,
        accountData.account_number || null,
        accountData.account_type || null,
        accountData.balance || 0,
        accountData.credit_limit || 0
      ];

      const [result] = await this.db.execute(query, params);
      return await this.findById(result.insertId);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Update account
   */
  async update(id, updateData) {
    try {
      const existingAccount = await this.findById(id);
      if (!existingAccount) {
        return null;
      }

      const updateFields = [];
      const params = [];

      if (updateData.institution_name !== undefined) {
        updateFields.push('institution_name = ?');
        params.push(updateData.institution_name);
      }

      if (updateData.account_number !== undefined) {
        updateFields.push('account_number = ?');
        params.push(updateData.account_number);
      }

      if (updateData.account_type !== undefined) {
        updateFields.push('account_type = ?');
        params.push(updateData.account_type);
      }

      if (updateData.balance !== undefined) {
        updateFields.push('balance = ?');
        params.push(updateData.balance);
      }

      if (updateData.credit_limit !== undefined) {
        updateFields.push('credit_limit = ?');
        params.push(updateData.credit_limit);
      }

      if (updateFields.length === 0) {
        return existingAccount;
      }

      params.push(id);
      const query = `
        UPDATE ${this.tableName} 
        SET ${updateFields.join(', ')}
        WHERE account_id = ?
      `;

      await this.db.execute(query, params);
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Delete account
   */
  async delete(id) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE account_id = ?`;
      const [result] = await this.db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}