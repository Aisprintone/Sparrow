/**
 * Comprehensive logging utility for the frontend.
 * Provides structured logging with different levels and performance tracking.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  category: string;
  data?: any;
  performance?: {
    duration: number;
    operation: string;
  };
}

class Logger {
  private level: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private isDevelopment: boolean;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: LogLevel, category: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const levelEmoji = this.getLevelEmoji(level);
    return `[${timestamp}] ${levelEmoji} [${category}] ${message}`;
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      case LogLevel.CRITICAL: return '🚨';
      default: return '📝';
    }
  }

  private log(level: LogLevel, category: string, message: string, data?: any, performance?: { duration: number; operation: string }) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      category,
      data,
      performance
    };

    // Add to internal logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const formattedMessage = this.formatMessage(level, category, message, data);
    
    if (performance) {
      console.log(`${formattedMessage} (${performance.operation}: ${performance.duration.toFixed(2)}ms)`);
    } else {
      console.log(formattedMessage);
    }

    if (data && this.isDevelopment) {
      console.log('📊 Data:', data);
    }

    // Send to analytics in production
    if (!this.isDevelopment && level >= LogLevel.ERROR) {
      this.sendToAnalytics(entry);
    }
  }

  private sendToAnalytics(entry: LogEntry) {
    // In a real app, you'd send to your analytics service
    // For now, we'll just store in localStorage for debugging
    try {
      const analytics = JSON.parse(localStorage.getItem('financeai_analytics') || '[]');
      analytics.push(entry);
      localStorage.setItem('financeai_analytics', JSON.stringify(analytics.slice(-100)));
    } catch (error) {
      console.error('Failed to store analytics:', error);
    }
  }

  // Public logging methods
  debug(category: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  info(category: string, message: string, data?: any) {
    this.log(LogLevel.INFO, category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log(LogLevel.WARN, category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.log(LogLevel.ERROR, category, message, data);
  }

  critical(category: string, message: string, data?: any) {
    this.log(LogLevel.CRITICAL, category, message, data);
  }

  // Performance logging
  time<T>(category: string, operation: string, fn: () => T | Promise<T>): T | Promise<T> {
    const start = performance.now();
    
    this.info(category, `🚀 Starting: ${operation}`);
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.then(value => {
        const duration = performance.now() - start;
        this.info(category, `✅ Completed: ${operation}`, undefined, { duration, operation });
        return value;
      }).catch(error => {
        const duration = performance.now() - start;
        this.error(category, `❌ Failed: ${operation}`, error, { duration, operation });
        throw error;
      });
    } else {
      const duration = performance.now() - start;
      this.info(category, `✅ Completed: ${operation}`, undefined, { duration, operation });
      return result;
    }
  }

  // API call logging
  logApiCall(endpoint: string, method: string, status: number, duration: number, data?: any) {
    const category = 'API';
    const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
    const message = `${method} ${endpoint} - ${status} (${duration.toFixed(2)}ms) ${statusEmoji}`;
    
    if (status >= 400) {
      this.error(category, message, data);
    } else {
      this.info(category, message, data);
    }
  }

  // User interaction logging
  logUserAction(action: string, details?: any) {
    this.info('USER_ACTION', `👤 User action: ${action}`, details);
  }

  // Error logging with context
  logError(context: string, error: Error, additionalData?: any) {
    this.error('ERROR', `${context}: ${error.message}`, {
      stack: error.stack,
      name: error.name,
      ...additionalData
    });
  }

  // Get logs for debugging
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);

// Performance monitoring
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  startTimer(operation: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMeasurement(operation, duration);
      logger.info('PERFORMANCE', `⏱️ ${operation}: ${duration.toFixed(2)}ms`);
    };
  }

  private recordMeasurement(operation: string, duration: number) {
    if (!this.measurements.has(operation)) {
      this.measurements.set(operation, []);
    }
    this.measurements.get(operation)!.push(duration);
  }

  getStats(operation: string) {
    const measurements = this.measurements.get(operation) || [];
    if (measurements.length === 0) return null;

    const sorted = measurements.sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);
    const avg = sum / measurements.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    return {
      count: measurements.length,
      average: avg,
      min,
      max,
      p95
    };
  }

  logStats(operation: string) {
    const stats = this.getStats(operation);
    if (stats) {
      logger.info('PERFORMANCE_STATS', `${operation} stats:`, stats);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
