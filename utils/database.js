/**
 * Database Connection Utility
 * Handles MySQL database connections with pooling and error handling
 */

import mysql from 'mysql2/promise';

export class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.config = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT || 3306,
      user: process.env.DATABASE_USER || 'sparrow_user',
      password: process.env.DATABASE_PASSWORD || 'sparrow_password',
      database: process.env.DATABASE_NAME || 'sparrow_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true
    };
  }

  /**
   * Get database connection pool
   */
  async getPool() {
    if (!this.pool) {
      try {
        this.pool = mysql.createPool(this.config);
        
        // Test the connection
        const connection = await this.pool.getConnection();
        await connection.ping();
        connection.release();
        
        console.log('Database connection pool established');
      } catch (error) {
        console.error('Failed to create database pool:', error.message);
        throw new Error(`Database connection failed: ${error.message}`);
      }
    }
    return this.pool;
  }

  /**
   * Execute a query with parameters
   */
  async execute(query, params = []) {
    try {
      const pool = await this.getPool();
      const [rows] = await pool.execute(query, params);
      return [rows];
    } catch (error) {
      console.error('Database query error:', error.message);
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  /**
   * Execute a query and return a single row
   */
  async queryOne(query, params = []) {
    try {
      const pool = await this.getPool();
      const [rows] = await pool.execute(query, params);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Database query error:', error.message);
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  /**
   * Execute a query and return all rows
   */
  async queryAll(query, params = []) {
    try {
      const pool = await this.getPool();
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error.message);
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    const pool = await this.getPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Close the database pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection pool closed');
    }
  }

  /**
   * Health check for database
   */
  async healthCheck() {
    try {
      const pool = await this.getPool();
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message, 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const pool = await this.getPool();
      const stats = await pool.pool.getConnection();
      return {
        totalConnections: stats.config.connectionLimit,
        activeConnections: stats.pool._allConnections.length,
        idleConnections: stats.pool._freeConnections.length,
        waitingConnections: stats.pool._connectionQueue.length
      };
    } catch (error) {
      console.error('Failed to get database stats:', error.message);
      return null;
    }
  }
}

// Export a singleton instance
export const db = new DatabaseConnection(); 