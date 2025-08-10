"""
Database configuration for Railway PostgreSQL
Handles database connection, migrations, and data access
"""

import os
import logging
import time
from typing import Optional, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

class DatabaseConfig:
    """Database configuration for Railway PostgreSQL"""
    
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self._setup_database()
    
    def _setup_database(self):
        """Setup database connection for Railway with improved error handling"""
        try:
            # Get database URL from Railway environment
            database_url = os.getenv('DATABASE_URL')
            
            if not database_url:
                # For local development without database, just skip database setup
                logger.info("No DATABASE_URL found - running in CSV-only mode for local development")
                self.engine = None
                self.SessionLocal = None
                return
            
            # Enhanced connection configuration for Railway
            # Railway-specific optimizations with more aggressive timeouts
            connect_args = {
                "connect_timeout": 120,  # Increased to 2 minutes for Railway
                "application_name": "sparrow_finance",
                "keepalives_idle": 30,
                "keepalives_interval": 10,
                "keepalives_count": 5,
                "options": "-c statement_timeout=120000 -c idle_in_transaction_session_timeout=600000",  # 2min statement, 10min idle
                "tcp_user_timeout": 120000,  # 2 minutes TCP timeout
            }
            
            # Create SQLAlchemy engine with Railway-optimized settings
            # Use StaticPool for Railway to avoid connection pool issues
            self.engine = create_engine(
                database_url,
                poolclass=StaticPool,
                pool_pre_ping=True,
                echo=False,  # Set to True for SQL debugging
                connect_args=connect_args,
                # StaticPool doesn't support pool_size, max_overflow, pool_timeout
                # These are handled by the StaticPool implementation
            )
            
            # Create session factory
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            
            logger.info("Database connection established successfully")
            
        except Exception as e:
            logger.error(f"Failed to setup database: {str(e)}")
            # Don't raise here - let the app start with degraded functionality
            self.engine = None
            self.SessionLocal = None
    
    def get_session(self):
        """Get database session"""
        if not self.SessionLocal:
            raise RuntimeError("Database not initialized")
        
        session = self.SessionLocal()
        try:
            return session
        except Exception as e:
            session.close()
            raise e
    
    def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> list:
        """Execute a raw SQL query"""
        if not self.engine:
            logger.error("Database not available")
            return []
            
        try:
            with self.engine.connect() as connection:
                result = connection.execute(text(query), params or {})
                return [dict(row) for row in result]
        except Exception as e:
            logger.error(f"Query execution failed: {str(e)}")
            return []
    
    def execute_transaction(self, queries: list) -> bool:
        """Execute multiple queries in a transaction"""
        if not self.engine:
            logger.error("Database not available")
            return False
            
        try:
            with self.engine.begin() as connection:
                for query, params in queries:
                    connection.execute(text(query), params or {})
            return True
        except Exception as e:
            logger.error(f"Transaction failed: {str(e)}")
            return False
    
    def test_connection(self) -> bool:
        """Test database connection with Railway-optimized retry logic"""
        if not self.engine:
            logger.info("Database engine not available - running in CSV-only mode")
            return True  # Return True for CSV-only mode
            
        # Railway-optimized retry logic with longer timeouts and more attempts
        max_retries = 10  # Increased from 5 to 10
        base_delay = 5    # Increased from 2 to 5 seconds
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Testing database connection (attempt {attempt + 1}/{max_retries})...")
                with self.engine.connect() as connection:
                    # Set a longer timeout for the test query
                    connection.execute(text("SET statement_timeout = 30000"))  # 30 seconds
                    result = connection.execute(text("SELECT 1"))
                    if result.fetchone() is not None:
                        logger.info(f"Database connection test passed on attempt {attempt + 1}")
                        return True
                    else:
                        logger.error(f"Database connection test failed - no result on attempt {attempt + 1}")
                        
            except Exception as e:
                logger.error(f"Database connection test failed on attempt {attempt + 1}: {str(e)}")
                if attempt < max_retries - 1:
                    # Exponential backoff with jitter for Railway
                    delay = base_delay * (2 ** attempt) + (time.time() % 2)
                    logger.info(f"Retrying in {delay:.2f} seconds...")
                    time.sleep(delay)
                    continue
                else:
                    logger.error("All database connection attempts failed")
                    return False
        
        return False
    
    def get_table_info(self, table_name: str) -> list:
        """Get table schema information"""
        if not self.engine:
            return []
            
        query = """
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = :table_name
        ORDER BY ordinal_position
        """
        return self.execute_query(query, {"table_name": table_name})
    
    def get_table_count(self, table_name: str) -> int:
        """Get row count for a table"""
        if not self.engine:
            return 0
            
        query = f"SELECT COUNT(*) as count FROM {table_name}"
        result = self.execute_query(query)
        return result[0]['count'] if result else 0

# Global database instance
db_config = DatabaseConfig()

def get_db():
    """Dependency to get database session"""
    return db_config.get_session()

async def init_database():
    """Initialize database with schema and sample data - Railway optimized"""
    if not db_config.engine:
        logger.error("Cannot initialize database - no engine available")
        return False
        
    try:
        # Test connection first with Railway-optimized retry
        logger.info("Testing database connection before initialization...")
        if not db_config.test_connection():
            logger.error("Database connection test failed - cannot initialize")
            return False
        
        # Try multiple schema file paths for Railway deployment
        schema_paths = [
            os.path.join(os.path.dirname(__file__), '..', '..', 'schema.sql'),
            os.path.join(os.path.dirname(__file__), '..', '..', '..', 'schema.sql'),
            '/app/schema.sql',  # Railway container path
            os.path.join(os.getcwd(), 'schema.sql'),  # Current working directory
            'schema.sql'  # Relative to current directory
        ]
        
        schema_sql = None
        for schema_path in schema_paths:
            if os.path.exists(schema_path):
                logger.info(f"Found schema file at: {schema_path}")
                with open(schema_path, 'r') as f:
                    schema_sql = f.read()
                break
        
        if not schema_sql:
            logger.error(f"Schema file not found. Tried paths: {schema_paths}")
            return False
        
        # Split into individual statements and filter out comments
        statements = []
        for stmt in schema_sql.split(';'):
            stmt = stmt.strip()
            if stmt and not stmt.startswith('--'):
                statements.append(stmt)
        
        # Execute schema with Railway-optimized transaction handling
        logger.info(f"Executing {len(statements)} schema statements...")
        success = db_config.execute_transaction([
            (stmt, {}) for stmt in statements if stmt
        ])
        
        if success:
            logger.info("Database initialized successfully")
            return True
        else:
            logger.error("Failed to initialize database")
            return False
            
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        return False

async def check_database_health() -> Dict[str, Any]:
    """Check database health and return status - Railway optimized"""
    try:
        # Test connection with Railway-optimized retry
        connection_ok = db_config.test_connection()
        
        if not connection_ok:
            return {
                "status": "unhealthy",
                "error": "Database connection failed",
                "database_url": os.getenv('DATABASE_URL', 'Not set'),
                "railway_environment": os.getenv('RAILWAY_ENVIRONMENT', 'Not set')
            }
        
        # Get table counts
        tables = ['profiles', 'accounts', 'spending_categories', 'transactions']
        table_counts = {}
        
        for table in tables:
            try:
                count = db_config.get_table_count(table)
                table_counts[table] = count
            except Exception as e:
                table_counts[table] = f"Error: {str(e)}"
        
        return {
            "status": "healthy",
            "connection": connection_ok,
            "table_counts": table_counts,
            "database_url": os.getenv('DATABASE_URL', 'Not set'),
            "railway_environment": os.getenv('RAILWAY_ENVIRONMENT', 'Not set')
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "database_url": os.getenv('DATABASE_URL', 'Not set'),
            "railway_environment": os.getenv('RAILWAY_ENVIRONMENT', 'Not set')
        }
