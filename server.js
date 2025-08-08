/**
 * Sparrow Financial API Server
 * Main entry point for the application
 */

import express from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import { db } from './utils/database.js';
import { Logger } from './utils/logger.js';
import { errorMiddleware } from './utils/errors.js';

// Load environment variables
dotenv.config();

// Import the main app
import app from './api/index.js';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Add compression middleware
app.use(compression());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    const dbStats = await db.getStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: NODE_ENV,
      database: dbHealth,
      databaseStats: dbStats
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Sparrow Financial API',
    version: process.env.APP_VERSION || '1.0.0',
    description: 'A comprehensive financial management system',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs'
    }
  });
});

// Error handling middleware (should be last)
app.use(errorMiddleware);

// Graceful shutdown
process.on('SIGTERM', async () => {
  Logger.info('SIGTERM received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  Logger.info('SIGINT received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

// Start the server
app.listen(PORT, () => {
  Logger.info(`Sparrow Financial API server started on port ${PORT}`);
  Logger.info(`Environment: ${NODE_ENV}`);
  Logger.info(`Health check: http://localhost:${PORT}/health`);
  Logger.info(`API base: http://localhost:${PORT}/api`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 