/**
 * Goal Model
 * Handles goal data operations and validation
 */

import { DatabaseConnection } from '../utils/database.js';
import { ValidationError } from '../utils/errors.js';

export class GoalModel {
  constructor() {
    this.db = new DatabaseConnection();
    this.tableName = 'goal';
  }

  /**
   * Find goals by customer ID
   */
  async findByCustomerId(customerId) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE customer_id = ? ORDER BY target_date ASC`;
      const [rows] = await this.db.execute(query, [customerId]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Find goal by ID
   */
  async findById(id) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE goal_id = ?`;
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
   * Create a new goal
   */
  async create(goalData) {
    try {
      if (!goalData.customer_id || !goalData.name || !goalData.target_amount) {
        throw new ValidationError('Customer ID, name, and target amount are required');
      }

      const query = `
        INSERT INTO ${this.tableName} (customer_id, name, description, target_amount, target_date)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const params = [
        goalData.customer_id,
        goalData.name,
        goalData.description || null,
        goalData.target_amount,
        goalData.target_date || null
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
   * Update goal
   */
  async update(id, updateData) {
    try {
      const existingGoal = await this.findById(id);
      if (!existingGoal) {
        return null;
      }

      const updateFields = [];
      const params = [];

      if (updateData.name !== undefined) {
        updateFields.push('name = ?');
        params.push(updateData.name);
      }

      if (updateData.description !== undefined) {
        updateFields.push('description = ?');
        params.push(updateData.description);
      }

      if (updateData.target_amount !== undefined) {
        updateFields.push('target_amount = ?');
        params.push(updateData.target_amount);
      }

      if (updateData.target_date !== undefined) {
        updateFields.push('target_date = ?');
        params.push(updateData.target_date);
      }

      if (updateFields.length === 0) {
        return existingGoal;
      }

      params.push(id);
      const query = `
        UPDATE ${this.tableName} 
        SET ${updateFields.join(', ')}
        WHERE goal_id = ?
      `;

      await this.db.execute(query, params);
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Delete goal
   */
  async delete(id) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE goal_id = ?`;
      const [result] = await this.db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}