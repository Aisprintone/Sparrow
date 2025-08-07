"""
Comprehensive logging configuration for the FinanceAI backend.
Provides structured logging with different levels and handlers.
"""

import logging
import logging.handlers
import os
import sys
from datetime import datetime
from pathlib import Path

# Create logs directory if it doesn't exist
logs_dir = Path(__file__).parent / "logs"
logs_dir.mkdir(exist_ok=True)

def setup_logging(
    level: str = "INFO",
    log_to_file: bool = True,
    log_to_console: bool = True,
    max_file_size: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5
) -> logging.Logger:
    """
    Setup comprehensive logging configuration.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_to_file: Whether to log to files
        log_to_console: Whether to log to console
        max_file_size: Maximum size of log files before rotation
        backup_count: Number of backup files to keep
        
    Returns:
        Configured logger
    """
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    simple_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%H:%M:%S'
    )
    
    # Create handlers
    handlers = []
    
    if log_to_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, level))
        console_handler.setFormatter(simple_formatter)
        handlers.append(console_handler)
    
    if log_to_file:
        # Main application log
        app_log_file = logs_dir / "financeai.log"
        app_handler = logging.handlers.RotatingFileHandler(
            app_log_file,
            maxBytes=max_file_size,
            backupCount=backup_count
        )
        app_handler.setLevel(getattr(logging, level))
        app_handler.setFormatter(detailed_formatter)
        handlers.append(app_handler)
        
        # Error log
        error_log_file = logs_dir / "financeai_errors.log"
        error_handler = logging.handlers.RotatingFileHandler(
            error_log_file,
            maxBytes=max_file_size,
            backupCount=backup_count
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(detailed_formatter)
        handlers.append(error_handler)
        
        # Performance log
        perf_log_file = logs_dir / "financeai_performance.log"
        perf_handler = logging.handlers.RotatingFileHandler(
            perf_log_file,
            maxBytes=max_file_size,
            backupCount=backup_count
        )
        perf_handler.setLevel(logging.INFO)
        perf_handler.setFormatter(detailed_formatter)
        # Add filter for performance-related messages
        perf_handler.addFilter(lambda record: "PERFORMANCE" in record.getMessage() or "⏱️" in record.getMessage())
        handlers.append(perf_handler)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level))
    
    # Remove existing handlers to avoid duplicates
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add new handlers
    for handler in handlers:
        root_logger.addHandler(handler)
    
    # Create and return logger for this module
    logger = logging.getLogger(__name__)
    logger.info(f"🔧 LOGGING CONFIGURED: Level={level}, File={log_to_file}, Console={log_to_console}")
    
    return logger

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Configured logger
    """
    return logging.getLogger(name)

# Performance logging utilities
class PerformanceLogger:
    """Utility class for logging performance metrics."""
    
    def __init__(self, logger: logging.Logger):
        self.logger = logger
    
    def log_timing(self, operation: str, duration_ms: float, success: bool = True):
        """Log timing information for an operation."""
        status = "✅" if success else "❌"
        self.logger.info(f"⏱️ PERFORMANCE: {operation} took {duration_ms:.2f}ms {status}")
    
    def log_api_call(self, endpoint: str, method: str, status_code: int, duration_ms: float):
        """Log API call performance."""
        status_emoji = "✅" if 200 <= status_code < 300 else "❌"
        self.logger.info(f"🌐 API CALL: {method} {endpoint} - {status_code} in {duration_ms:.2f}ms {status_emoji}")
    
    def log_simulation_step(self, step: str, duration_ms: float, details: str = ""):
        """Log simulation step performance."""
        self.logger.info(f"🧮 SIMULATION STEP: {step} took {duration_ms:.2f}ms {details}")
    
    def log_ai_operation(self, operation: str, duration_ms: float, tokens_used: int = None):
        """Log AI operation performance."""
        token_info = f" ({tokens_used} tokens)" if tokens_used else ""
        self.logger.info(f"🤖 AI OPERATION: {operation} took {duration_ms:.2f}ms{token_info}")

# Initialize logging when module is imported
if __name__ != "__main__":
    setup_logging()
