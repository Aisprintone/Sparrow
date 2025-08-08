# Cloudflare Deployment Setup

This guide helps you set up the database for Cloudflare deployment.

## Database Options for Cloudflare

Since Cloudflare Workers don't support persistent databases, you'll need to use a cloud database service. Here are the recommended options:

### 1. PlanetScale (Recommended)
- **Pros**: Serverless, auto-scaling, MySQL compatible
- **Cons**: Limited free tier
- **Setup**: https://planetscale.com/

### 2. Neon (PostgreSQL)
- **Pros**: Serverless, generous free tier, PostgreSQL
- **Cons**: Need to convert schema from MySQL to PostgreSQL
- **Setup**: https://neon.tech/

### 3. Supabase (PostgreSQL)
- **Pros**: Full backend solution, generous free tier
- **Cons**: Need to convert schema from MySQL to PostgreSQL
- **Setup**: https://supabase.com/

### 4. Railway (MySQL)
- **Pros**: MySQL compatible, simple setup
- **Cons**: Limited free tier
- **Setup**: https://railway.app/

## Database Schema Migration

### For PlanetScale/MySQL Services

The schema in `init/01-schema.sql` is ready to use. Just run it in your cloud database.

### For PostgreSQL Services (Neon, Supabase)

You'll need to convert the MySQL schema to PostgreSQL. Here's the converted schema:

```sql
-- PostgreSQL Schema for Sparrow
CREATE TABLE customer (
    customer_id SERIAL PRIMARY KEY,
    location TEXT,
    age INTEGER,
    notification_prefs JSONB
);

CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE account (
    account_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    institution_name VARCHAR(255),
    account_number VARCHAR(255),
    account_type VARCHAR(100),
    balance DECIMAL(15,2) DEFAULT 0.00,
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    created_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE transaction (
    transaction_id BIGSERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES category(category_id) ON DELETE SET NULL,
    is_debit BOOLEAN DEFAULT FALSE,
    is_bill BOOLEAN DEFAULT FALSE,
    is_subscription BOOLEAN DEFAULT FALSE,
    due_date DATE
);

CREATE TABLE goal (
    goal_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    target_date DATE
);

-- Insert default categories
INSERT INTO category (name) VALUES 
    ('Food & Dining'),
    ('Transportation'),
    ('Shopping'),
    ('Entertainment'),
    ('Healthcare'),
    ('Utilities'),
    ('Housing'),
    ('Income'),
    ('Transfer'),
    ('Other');
```

## Environment Variables

Create a `.env` file in your Cloudflare project:

```env
# Database Configuration
DATABASE_URL="your_database_connection_string"
DATABASE_HOST="your_database_host"
DATABASE_PORT="3306" # or 5432 for PostgreSQL
DATABASE_NAME="your_database_name"
DATABASE_USER="your_database_user"
DATABASE_PASSWORD="your_database_password"

# For PlanetScale
DATABASE_URL="mysql://username:password@host:port/database"

# For Neon/Supabase
DATABASE_URL="postgresql://username:password@host:port/database"
```

## Cloudflare Workers Configuration

### 1. Install Dependencies

```bash
npm install mysql2 # for MySQL
# or
npm install pg # for PostgreSQL
```

### 2. Database Connection Example

```javascript
// For MySQL (PlanetScale)
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

// For PostgreSQL (Neon, Supabase)
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
```

## Testing Your Setup

1. **Local Testing**: Use the `db-manager.sh` script with Docker
2. **Cloud Testing**: Use your cloud database's connection tools
3. **Production**: Deploy to Cloudflare with proper environment variables

## Security Considerations

- Use connection pooling for better performance
- Implement proper error handling
- Use prepared statements to prevent SQL injection
- Store sensitive data in Cloudflare's encrypted environment variables
- Consider using connection limits to prevent resource exhaustion

## Monitoring

- Set up database monitoring in your cloud provider
- Monitor connection counts and query performance
- Set up alerts for database issues
- Use Cloudflare Analytics to monitor application performance 