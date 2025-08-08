/**
 * Custom Error Classes
 * Provides structured error handling for the application
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(message, resource = null) {
    super(message, 404);
    this.name = 'NotFoundError';
    this.resource = resource;
  }
}

/**
 * Authentication error for unauthorized access
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error for insufficient permissions
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Conflict error for resource conflicts
 */
export class ConflictError extends AppError {
  constructor(message, resource = null) {
    super(message, 409);
    this.name = 'ConflictError';
    this.resource = resource;
  }
}

/**
 * Rate limit error for too many requests
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Database error for database-related issues
 */
export class DatabaseError extends AppError {
  constructor(message, operation = null) {
    super(message, 500);
    this.name = 'DatabaseError';
    this.operation = operation;
  }
}

/**
 * External service error for third-party API issues
 */
export class ExternalServiceError extends AppError {
  constructor(message, service = null) {
    super(message, 502);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  /**
   * Convert any error to a standardized format
   */
  static normalizeError(error) {
    if (error instanceof AppError) {
      return error;
    }

    // Handle MySQL errors
    if (error.code) {
      switch (error.code) {
        case 'ER_DUP_ENTRY':
          return new ConflictError('Resource already exists');
        case 'ER_NO_REFERENCED_ROW_2':
          return new ValidationError('Referenced resource does not exist');
        case 'ER_ROW_IS_REFERENCED_2':
          return new ConflictError('Cannot delete resource that is referenced by other resources');
        case 'ER_DATA_TOO_LONG':
          return new ValidationError('Data too long for field');
        case 'ER_BAD_NULL_ERROR':
          return new ValidationError('Required field cannot be null');
        default:
          return new DatabaseError(error.message);
      }
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message);
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new ExternalServiceError('Service temporarily unavailable');
    }

    // Default to internal server error
    return new AppError(error.message || 'Internal server error');
  }

  /**
   * Create error response object
   */
  static createErrorResponse(error) {
    const normalizedError = this.normalizeError(error);
    
    return {
      success: false,
      error: {
        message: normalizedError.message,
        code: normalizedError.name,
        statusCode: normalizedError.statusCode,
        timestamp: normalizedError.timestamp,
        ...(normalizedError.field && { field: normalizedError.field }),
        ...(normalizedError.resource && { resource: normalizedError.resource }),
        ...(normalizedError.operation && { operation: normalizedError.operation }),
        ...(normalizedError.service && { service: normalizedError.service })
      }
    };
  }

  /**
   * Log error with context
   */
  static logError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', errorInfo);
    }

    // TODO: Add proper logging service (e.g., Winston, Bunyan)
    // logger.error(errorInfo);
  }

  /**
   * Check if error is operational (expected)
   */
  static isOperational(error) {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }
}

/**
 * Error middleware for Express
 */
export const errorMiddleware = (error, req, res, next) => {
  const errorResponse = ErrorHandler.createErrorResponse(error);
  
  // Log the error
  ErrorHandler.logError(error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send error response
  res.status(errorResponse.error.statusCode).json(errorResponse);
};

/**
 * Async error wrapper for Express routes
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 