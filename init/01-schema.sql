-- Sparrow Database Schema
-- This file creates all tables for the Sparrow financial application

USE sparrow_db;

-- Create CUSTOMER table
CREATE TABLE CUSTOMER (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    location TEXT,
    age INT,
    notification_prefs JSON
);

-- Create CATEGORY table
CREATE TABLE CATEGORY (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Create ACCOUNT table
CREATE TABLE ACCOUNT (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    institution_name VARCHAR(255),
    account_number VARCHAR(255),
    account_type VARCHAR(100),
    balance DECIMAL(15,2) DEFAULT 0.00,
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    created_at DATE DEFAULT (CURDATE()),
    FOREIGN KEY (customer_id) REFERENCES CUSTOMER(customer_id) ON DELETE CASCADE
);

-- Create TRANSACTION table
CREATE TABLE TRANSACTION (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    category_id INT,
    is_debit BOOLEAN DEFAULT FALSE,
    is_bill BOOLEAN DEFAULT FALSE,
    is_subscription BOOLEAN DEFAULT FALSE,
    due_date DATE,
    FOREIGN KEY (account_id) REFERENCES ACCOUNT(account_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES CATEGORY(category_id) ON DELETE SET NULL
);

-- Create GOAL table
CREATE TABLE GOAL (
    goal_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    target_date DATE,
    FOREIGN KEY (customer_id) REFERENCES CUSTOMER(customer_id) ON DELETE CASCADE
);

-- Insert some default categories
INSERT INTO CATEGORY (name) VALUES 
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