/**
 * Customer Model
 * Handles customer data operations and validation
 */

import { DatabaseConnection } from '../utils/database.js';
import { ValidationError } from '../utils/errors.js';

export class CustomerModel {
  constructor() {
    this.db = new DatabaseConnection();
    this.tableName = 'customer';
  }

  /**
   * Find all customers with optional filtering and pagination
   */
  async findAll({ limit = 10, offset = 0, search = null } = {}) {
    try {
      let query = `SELECT * FROM ${this.tableName}`;
      const params = [];

      if (search) {
        query += ` WHERE location LIKE ? OR notification_prefs LIKE ?`;
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY customer_id DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [rows] = await this.db.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Find customer by ID
   */
  async findById(id) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE customer_id = ?`;
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
   * Create a new customer
   */
  async create(customerData) {
    try {
      // Validate required fields
      if (!customerData.location || !customerData.age) {
        throw new ValidationError('Location and age are required');
      }

      // Validate age
      if (customerData.age < 0 || customerData.age > 120) {
        throw new ValidationError('Age must be between 0 and 120');
      }

      // Prepare notification preferences
      const notificationPrefs = customerData.notification_prefs 
        ? JSON.stringify(customerData.notification_prefs)
        : JSON.stringify({ email: true, sms: false, push: true });

      const query = `
        INSERT INTO ${this.tableName} (location, age, notification_prefs)
        VALUES (?, ?, ?)
      `;
      
      const params = [
        customerData.location,
        customerData.age,
        notificationPrefs
      ];

      const [result] = await this.db.execute(query, params);
      
      // Return the created customer
      return await this.findById(result.insertId);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Update customer
   */
  async update(id, updateData) {
    try {
      // Check if customer exists
      const existingCustomer = await this.findById(id);
      if (!existingCustomer) {
        return null;
      }

      // Validate age if provided
      if (updateData.age !== undefined) {
        if (updateData.age < 0 || updateData.age > 120) {
          throw new ValidationError('Age must be between 0 and 120');
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const params = [];

      if (updateData.location !== undefined) {
        updateFields.push('location = ?');
        params.push(updateData.location);
      }

      if (updateData.age !== undefined) {
        updateFields.push('age = ?');
        params.push(updateData.age);
      }

      if (updateData.notification_prefs !== undefined) {
        updateFields.push('notification_prefs = ?');
        params.push(JSON.stringify(updateData.notification_prefs));
      }

      if (updateFields.length === 0) {
        return existingCustomer; // No fields to update
      }

      params.push(id);
      const query = `
        UPDATE ${this.tableName} 
        SET ${updateFields.join(', ')}
        WHERE customer_id = ?
      `;

      await this.db.execute(query, params);
      
      // Return the updated customer
      return await this.findById(id);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Delete customer
   */
  async delete(id) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE customer_id = ?`;
      const [result] = await this.db.execute(query, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Count total customers
   */
  async count({ search = null } = {}) {
    try {
      let query = `SELECT COUNT(*) as total FROM ${this.tableName}`;
      const params = [];

      if (search) {
        query += ` WHERE location LIKE ? OR notification_prefs LIKE ?`;
        params.push(`%${search}%`, `%${search}%`);
      }

      const [rows] = await this.db.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Find customers by location
   */
  async findByLocation(location) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE location LIKE ?`;
      const [rows] = await this.db.execute(query, [`%${location}%`]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Find customers by age range
   */
  async findByAgeRange(minAge, maxAge) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE age BETWEEN ? AND ?`;
      const [rows] = await this.db.execute(query, [minAge, maxAge]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Get customer statistics
   */
  async getStatistics() {
    try {
      const queries = [
        'SELECT COUNT(*) as total_customers FROM customer',
        'SELECT AVG(age) as average_age FROM customer',
        'SELECT COUNT(*) as customers_with_notifications FROM customer WHERE JSON_EXTRACT(notification_prefs, "$.email") = true'
      ];

      const results = await Promise.all(
        queries.map(query => this.db.execute(query))
      );

      return {
        total_customers: results[0][0][0].total_customers,
        average_age: results[1][0][0].average_age,
        customers_with_notifications: results[2][0][0].customers_with_notifications
      };
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
} 