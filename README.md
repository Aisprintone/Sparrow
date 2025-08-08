# Sparrow Financial Database

This project contains a MySQL database setup for the Sparrow financial application with the following schema:

## Database Schema

### Tables
- **CUSTOMER**: Customer information with location, age, and notification preferences
- **ACCOUNT**: Financial accounts linked to customers
- **TRANSACTION**: Financial transactions with categorization
- **CATEGORY**: Transaction categories for classification
- **GOAL**: Financial goals set by customers

### Relationships
- CUSTOMER ||--o{ ACCOUNT : has
- ACCOUNT ||--o{ TRANSACTION : posts
- CUSTOMER ||--o{ GOAL : "sets"
- CATEGORY ||--o{ TRANSACTION : classifies

## Quick Start

### Prerequisites
- Docker and Docker Compose installed

### Database Management
All database operations are handled through the consolidated `db-manager.sh` script:

```bash
# Start the database
./db-manager.sh start

# Stop the database
./db-manager.sh stop

# Reset database (fresh start with confirmation)
./db-manager.sh reset

# Check database status
./db-manager.sh status

# View database logs
./db-manager.sh logs

# Connect to database via MySQL client
./db-manager.sh connect

# Show help
./db-manager.sh help
```

## Connection Details

- **Host**: localhost
- **Port**: 3306
- **Database**: sparrow_db
- **Username**: sparrow_user
- **Password**: sparrow_password

### Connect via MySQL Client
```bash
mysql -h localhost -P 3306 -u sparrow_user -p sparrow_db
```

## Database Structure

### CUSTOMER Table
- `customer_id` (INT, PK, AUTO_INCREMENT)
- `location` (TEXT)
- `age` (INT)
- `notification_prefs` (JSON)

### ACCOUNT Table
- `account_id` (INT, PK, AUTO_INCREMENT)
- `customer_id` (INT, FK to CUSTOMER)
- `institution_name` (VARCHAR(255))
- `account_number` (VARCHAR(255))
- `account_type` (VARCHAR(100))
- `balance` (DECIMAL(15,2), DEFAULT 0.00)
- `credit_limit` (DECIMAL(15,2), DEFAULT 0.00)
- `created_at` (DATE, DEFAULT CURDATE())

### TRANSACTION Table
- `transaction_id` (BIGINT, PK, AUTO_INCREMENT)
- `account_id` (INT, FK to ACCOUNT)
- `timestamp` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `amount` (DECIMAL(15,2))
- `description` (TEXT)
- `category_id` (INT, FK to CATEGORY)
- `is_debit` (BOOLEAN, DEFAULT FALSE)
- `is_bill` (BOOLEAN, DEFAULT FALSE)
- `is_subscription` (BOOLEAN, DEFAULT FALSE)
- `due_date` (DATE)

### CATEGORY Table
- `category_id` (INT, PK, AUTO_INCREMENT)
- `name` (VARCHAR(255))

### GOAL Table
- `goal_id` (INT, PK, AUTO_INCREMENT)
- `customer_id` (INT, FK to CUSTOMER)
- `name` (VARCHAR(255))
- `description` (TEXT)
- `target_amount` (DECIMAL(15,2))
- `target_date` (DATE)

## Default Categories

The database comes pre-populated with these default categories:
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Healthcare
- Utilities
- Housing
- Income
- Transfer
- Other

## Data Persistence

All data is persisted in Docker volumes, so your data will survive container restarts. To completely reset the database, use the `./db-manager.sh reset` command.

## Cloudflare Deployment

For deploying to Cloudflare Workers, you'll need to use a cloud database service since Workers don't support persistent databases. See `cloudflare-setup.md` for detailed instructions on:

- Recommended cloud database services (PlanetScale, Neon, Supabase)
- Database schema migration
- Environment variable configuration
- Security considerations
- Monitoring setup

### Quick Cloudflare Setup

1. Choose a cloud database service (PlanetScale recommended for MySQL)
2. Run the appropriate schema file:
   - `init/01-schema.sql` for MySQL services
   - `init/01-schema-postgresql.sql` for PostgreSQL services
3. Configure environment variables in your Cloudflare project
4. Deploy your application 