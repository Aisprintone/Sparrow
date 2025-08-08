-- Sparrow Database Schema (PostgreSQL)
-- This file creates all tables for the Sparrow financial application in PostgreSQL

-- Create CUSTOMER table
CREATE TABLE customer (
    customer_id SERIAL PRIMARY KEY,
    location TEXT,
    age INTEGER,
    notification_prefs JSONB
);

-- Create CATEGORY table
CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Create ACCOUNT table
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

-- Create TRANSACTION table
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

-- Create GOAL table
CREATE TABLE goal (
    goal_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    target_date DATE
);

-- Insert some default categories
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