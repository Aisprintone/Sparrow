#!/usr/bin/env python3
"""
Railway PostgreSQL Database Setup Script
Handles Railway-specific database initialization and configuration
"""

import os
import sys
import time
import logging
from pathlib import Path

# Add the parent directory to the path
sys.path.append(str(Path(__file__).parent.parent))

from core.database import db_config, init_database, check_database_health

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def setup_railway_database():
    """Setup Railway PostgreSQL database with proper configuration"""
    
    logger.info("🚀 Starting Railway database setup...")
    
    # Check environment variables
    database_url = os.getenv('DATABASE_URL')
    railway_environment = os.getenv('RAILWAY_ENVIRONMENT', 'production')
    
    logger.info(f"Environment: {railway_environment}")
    logger.info(f"Database URL configured: {'Yes' if database_url else 'No'}")
    
    if not database_url:
        logger.error("❌ DATABASE_URL environment variable not set")
        logger.error("Please ensure you have added a PostgreSQL service to your Railway project")
        return False
    
    # Test database connection with Railway-optimized retry
    logger.info("🔄 Testing database connection...")
    
    max_connection_attempts = 15  # Increased from 10 to 15
    base_delay = 5  # Increased from 3 to 5 seconds
    
    for attempt in range(max_connection_attempts):
        try:
            logger.info(f"Attempt {attempt + 1}/{max_connection_attempts} - Testing database connection...")
            if db_config.test_connection():
                logger.info(f"✅ Database connection successful on attempt {attempt + 1}")
                break
            else:
                logger.warning(f"⚠️ Database connection test failed on attempt {attempt + 1}")
                
        except Exception as e:
            logger.error(f"❌ Database connection error on attempt {attempt + 1}: {e}")
            
        if attempt < max_connection_attempts - 1:
            # Exponential backoff with jitter for Railway
            delay = base_delay * (2 ** attempt) + (time.time() % 3)
            logger.info(f"⏳ Retrying in {delay:.2f} seconds...")
            time.sleep(delay)
        else:
            logger.error("❌ All database connection attempts failed")
            logger.error("This may indicate:")
            logger.error("1. Database service is not ready yet")
            logger.error("2. Network connectivity issues")
            logger.error("3. Database credentials are incorrect")
            logger.error("4. Railway service is experiencing issues")
            return False
    
    # Initialize database schema
    logger.info("🔄 Initializing database schema...")
    
    try:
        success = init_database()
        if success:
            logger.info("✅ Database schema initialized successfully")
        else:
            logger.error("❌ Database schema initialization failed")
            return False
            
    except Exception as e:
        logger.error(f"❌ Database initialization error: {e}")
        return False
    
    # Verify database health
    logger.info("🔄 Verifying database health...")
    
    try:
        health_status = check_database_health()
        logger.info(f"📊 Database health status: {health_status['status']}")
        
        if health_status['status'] == 'healthy':
            logger.info("✅ Database setup completed successfully")
            logger.info(f"📊 Table counts: {health_status.get('table_counts', {})}")
            return True
        else:
            logger.error(f"❌ Database health check failed: {health_status.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Database health check error: {e}")
        return False

def main():
    """Main function for Railway database setup"""
    
    logger.info("=" * 60)
    logger.info("RAILWAY DATABASE SETUP")
    logger.info("=" * 60)
    
    try:
        success = setup_railway_database()
        
        if success:
            logger.info("🎉 Railway database setup completed successfully!")
            sys.exit(0)
        else:
            logger.error("💥 Railway database setup failed!")
            logger.error("Consider restarting the deployment or checking Railway service status")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("⏹️ Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"💥 Unexpected error during setup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
