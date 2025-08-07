-- Sparrow.io Profile Database Schema
-- Optimized for Cloudflare Workers with sub-10ms response times

-- Profiles table (main profile data)
CREATE TABLE profiles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  location TEXT NOT NULL,
  net_worth REAL NOT NULL,
  monthly_income REAL NOT NULL,
  monthly_spending REAL NOT NULL,
  credit_score INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table (bank accounts, credit cards, loans)
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  institution TEXT NOT NULL,
  balance REAL NOT NULL,
  type TEXT CHECK(type IN ('asset', 'liability')) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- Spending categories (pre-computed for performance)
CREATE TABLE spending_categories (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  percentage REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- Transactions table (limited to recent for performance)
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- Create indexes for fast queries
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_accounts_profile_id ON accounts(profile_id);
CREATE INDEX idx_spending_categories_profile_id ON spending_categories(profile_id);
CREATE INDEX idx_transactions_profile_id ON transactions(profile_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);

-- Insert sample data for Gen Z, Millennial, and Mid-Career profiles
INSERT INTO profiles (id, name, age, location, net_worth, monthly_income, monthly_spending, credit_score) VALUES
(1, 'Alex Chen', 22, 'San Francisco, CA', 15000, 4500, 3800, 720),
(2, 'Jordan Smith', 28, 'Austin, TX', 45000, 7500, 5200, 780),
(3, 'Taylor Johnson', 35, 'New York, NY', 120000, 12000, 8500, 820);

-- Insert accounts for each profile
INSERT INTO accounts (profile_id, name, institution, balance, type) VALUES
-- Alex Chen (Gen Z)
(1, 'Chase Checking', 'Chase Bank', 8000, 'asset'),
(1, 'Chase Savings', 'Chase Bank', 5000, 'asset'),
(1, 'Student Loan', 'Federal Student Aid', -15000, 'liability'),
(1, 'Credit Card', 'Chase', -3000, 'liability'),

-- Jordan Smith (Millennial)
(2, 'Wells Fargo Checking', 'Wells Fargo', 15000, 'asset'),
(2, 'Vanguard IRA', 'Vanguard', 25000, 'asset'),
(2, 'Emergency Fund', 'Ally Bank', 5000, 'asset'),
(2, 'Car Loan', 'Bank of America', -12000, 'liability'),

-- Taylor Johnson (Mid-Career)
(3, 'Chase Premier Plus', 'Chase Bank', 25000, 'asset'),
(3, 'Fidelity 401k', 'Fidelity', 80000, 'asset'),
(3, 'Vanguard Brokerage', 'Vanguard', 15000, 'asset'),
(3, 'Mortgage', 'Quicken Loans', -200000, 'liability');

-- Insert spending categories (pre-computed)
INSERT INTO spending_categories (profile_id, name, amount, percentage) VALUES
-- Alex Chen spending
(1, 'Rent', 1800, 47.4),
(1, 'Food & Dining', 600, 15.8),
(1, 'Transportation', 400, 10.5),
(1, 'Entertainment', 300, 7.9),
(1, 'Utilities', 200, 5.3),
(1, 'Other', 500, 13.1),

-- Jordan Smith spending
(2, 'Rent', 2200, 42.3),
(2, 'Food & Dining', 800, 15.4),
(2, 'Transportation', 600, 11.5),
(2, 'Entertainment', 500, 9.6),
(2, 'Utilities', 300, 5.8),
(2, 'Healthcare', 400, 7.7),
(2, 'Other', 400, 7.7),

-- Taylor Johnson spending
(3, 'Mortgage', 3500, 41.2),
(3, 'Food & Dining', 1200, 14.1),
(3, 'Transportation', 1000, 11.8),
(3, 'Entertainment', 800, 9.4),
(3, 'Utilities', 500, 5.9),
(3, 'Healthcare', 600, 7.1),
(3, 'Insurance', 400, 4.7),
(3, 'Other', 500, 5.9);

-- Insert recent transactions (limited to 50 per profile for performance)
INSERT INTO transactions (profile_id, description, amount, category, date) VALUES
-- Alex Chen recent transactions
(1, 'Uber Ride', -25.50, 'Transportation', '2024-01-15'),
(1, 'Starbucks', -8.75, 'Food & Dining', '2024-01-15'),
(1, 'Netflix Subscription', -15.99, 'Entertainment', '2024-01-14'),
(1, 'Grocery Store', -85.30, 'Food & Dining', '2024-01-14'),
(1, 'Gas Station', -45.00, 'Transportation', '2024-01-13'),
(1, 'Amazon Purchase', -120.50, 'Other', '2024-01-13'),
(1, 'Restaurant', -65.25, 'Food & Dining', '2024-01-12'),
(1, 'Movie Theater', -22.00, 'Entertainment', '2024-01-12'),
(1, 'Electric Bill', -85.00, 'Utilities', '2024-01-11'),
(1, 'Phone Bill', -75.00, 'Utilities', '2024-01-11'),

-- Jordan Smith recent transactions
(2, 'Rent Payment', -2200.00, 'Rent', '2024-01-15'),
(2, 'Whole Foods', -125.75, 'Food & Dining', '2024-01-15'),
(2, 'Car Insurance', -150.00, 'Insurance', '2024-01-14'),
(2, 'Gas Station', -55.00, 'Transportation', '2024-01-14'),
(2, 'Restaurant', -95.50, 'Food & Dining', '2024-01-13'),
(2, 'Gym Membership', -45.00, 'Healthcare', '2024-01-13'),
(2, 'Amazon Purchase', -180.25, 'Other', '2024-01-12'),
(2, 'Uber Ride', -35.00, 'Transportation', '2024-01-12'),
(2, 'Electric Bill', -120.00, 'Utilities', '2024-01-11'),
(2, 'Netflix Subscription', -15.99, 'Entertainment', '2024-01-11'),

-- Taylor Johnson recent transactions
(3, 'Mortgage Payment', -3500.00, 'Mortgage', '2024-01-15'),
(3, 'Grocery Store', -180.50, 'Food & Dining', '2024-01-15'),
(3, 'Car Payment', -450.00, 'Transportation', '2024-01-14'),
(3, 'Health Insurance', -300.00, 'Healthcare', '2024-01-14'),
(3, 'Restaurant', -125.75, 'Food & Dining', '2024-01-13'),
(3, 'Home Insurance', -200.00, 'Insurance', '2024-01-13'),
(3, 'Gas Station', -75.00, 'Transportation', '2024-01-12'),
(3, 'Entertainment', -150.00, 'Entertainment', '2024-01-12'),
(3, 'Electric Bill', -180.00, 'Utilities', '2024-01-11'),
(3, 'Internet Bill', -120.00, 'Utilities', '2024-01-11'); 