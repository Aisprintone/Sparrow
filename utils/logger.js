/**
 * Logger Utility
 * Provides structured logging for the application
 */

/**
 * Request logger middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`);
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
    
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${statusColor}${status}\x1b[0m - ${duration}ms`);
  });
  
  next();
};

/**
 * Application logger class
 */
export class Logger {
  static info(message, context = {}) {
    console.log(`${new Date().toISOString()} - INFO - ${message}`, context);
  }

  static warn(message, context = {}) {
    console.warn(`${new Date().toISOString()} - WARN - ${message}`, context);
  }

  static error(message, context = {}) {
    console.error(`${new Date().toISOString()} - ERROR - ${message}`, context);
  }

  static debug(message, context = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${new Date().toISOString()} - DEBUG - ${message}`, context);
    }
  }
} 