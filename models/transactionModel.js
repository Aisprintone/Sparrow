/**
 * Transaction Model
 * Handles transaction data operations and validation
 */

import { DatabaseConnection } from '../utils/database.js';
import { ValidationError } from '../utils/errors.js';

export class TransactionModel {
  constructor() {
    this.db = new DatabaseConnection();
    this.tableName = 'transaction';
  }

  /**
   * Find transactions by account ID
   */
  async findByAccountId(accountId, { limit = 20, offset = 0 } = {}) {
    try {
      const query = `
        SELECT t.*, c.name as category_name 
        FROM ${this.tableName} t
        LEFT JOIN category c ON t.category_id = c.category_id
        WHERE t.account_id = ? 
        ORDER BY t.timestamp DESC 
        LIMIT ? OFFSET ?
      `;
      const [rows] = await this.db.execute(query, [accountId, limit, offset]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Find transaction by ID
   */
  async findById(id) {
    try {
      const query = `
        SELECT t.*, c.name as category_name 
        FROM ${this.tableName} t
        LEFT JOIN category c ON t.category_id = c.category_id
        WHERE t.transaction_id = ?
      `;
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
   * Create a new transaction
   */
  async create(transactionData) {
    try {
      if (!transactionData.account_id || !transactionData.amount) {
        throw new ValidationError('Account ID and amount are required');
      }

      const query = `
        INSERT INTO ${this.tableName} (account_id, amount, description, category_id, is_debit, is_bill, is_subscription, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        transactionData.account_id,
        transactionData.amount,
        transactionData.description || null,
        transactionData.category_id || null,
        transactionData.is_debit || false,
        transactionData.is_bill || false,
        transactionData.is_subscription || false,
        transactionData.due_date || null
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
   * Update transaction
   */
  async update(id, updateData) {
    try {
      const existingTransaction = await this.findById(id);
      if (!existingTransaction) {
        return null;
      }

      const updateFields = [];
      const params = [];

      if (updateData.amount !== undefined) {
        updateFields.push('amount = ?');
        params.push(updateData.amount);
      }

      if (updateData.description !== undefined) {
        updateFields.push('description = ?');
        params.push(updateData.description);
      }

      if (updateData.category_id !== undefined) {
        updateFields.push('category_id = ?');
        params.push(updateData.category_id);
      }

      if (updateData.is_debit !== undefined) {
        updateFields.push('is_debit = ?');
        params.push(updateData.is_debit);
      }

      if (updateData.is_bill !== undefined) {
        updateFields.push('is_bill = ?');
        params.push(updateData.is_bill);
      }

      if (updateData.is_subscription !== undefined) {
        updateFields.push('is_subscription = ?');
        params.push(updateData.is_subscription);
      }

      if (updateData.due_date !== undefined) {
        updateFields.push('due_date = ?');
        params.push(updateData.due_date);
      }

      if (updateFields.length === 0) {
        return existingTransaction;
      }

      params.push(id);
      const query = `
        UPDATE ${this.tableName} 
        SET ${updateFields.join(', ')}
        WHERE transaction_id = ?
      `;

      await this.db.execute(query, params);
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Delete transaction
   */
  async delete(id) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE transaction_id = ?`;
      const [result] = await this.db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}