/**
 * Authentication Utilities
 * Provides API key validation and security middleware
 */

import { AuthenticationError } from './errors.js';

/**
 * Validate API key middleware
 */
export const validateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }

    // Validate API key format (basic validation)
    if (typeof apiKey !== 'string' || apiKey.length < 10) {
      throw new AuthenticationError('Invalid API key format');
    }

    // TODO: Implement proper API key validation against database
    // For now, we'll use a simple environment variable check
    const validApiKey = process.env.API_KEY;
    
    if (!validApiKey || apiKey !== validApiKey) {
      throw new AuthenticationError('Invalid API key');
    }

    // Add user context to request (if needed)
    req.user = {
      id: 'system',
      type: 'api'
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional API key validation (for public endpoints)
 */
export const optionalApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (apiKey) {
      // Validate if provided
      const validApiKey = process.env.API_KEY;
      
      if (validApiKey && apiKey === validApiKey) {
        req.user = {
          id: 'system',
          type: 'api'
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail for optional auth
    next();
  }
};

/**
 * Rate limiting helper
 */
export const createRateLimiter = (windowMs, maxRequests) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests'
      });
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    
    next();
  };
}; 