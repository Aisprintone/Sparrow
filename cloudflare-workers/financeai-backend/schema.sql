-- FinanceAI Profile Database Schema
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

-- Spending categories (aggregated monthly spending)
CREATE TABLE spending_categories (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  percentage REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- Recent transactions (last 3 months)
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- Indexes for fast queries
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_accounts_profile_id ON accounts(profile_id);
CREATE INDEX idx_spending_profile_id ON spending_categories(profile_id);
CREATE INDEX idx_transactions_profile_id ON transactions(profile_id);
CREATE INDEX idx_transactions_date ON transactions(date);

-- Insert sample data for 3 profiles
INSERT INTO profiles (id, name, age, location, net_worth, monthly_income, monthly_spending, credit_score) VALUES
(1, 'Established Millennial', 34, 'New York, NY', -335000, 8500, 4200, 780),
(2, 'Mid-Career Professional', 33, 'New York, NY', 6400, 5800, 3400, 720),
(3, 'Gen Z Student', 23, 'Austin, TX', -19000, 3200, 2100, 650);

-- Accounts for Profile 1 (Millennial)
INSERT INTO accounts (id, profile_id, name, institution, balance, type) VALUES
(1, 1, 'Chase Checking', 'Chase', 8500, 'asset'),
(2, 1, 'Fidelity 401k', 'Fidelity', 45000, 'asset'),
(3, 1, 'High-Yield Savings', 'Marcus', 15000, 'asset'),
(4, 1, 'Investment Account', 'Vanguard', 22000, 'asset'),
(5, 1, 'Apple Card', 'Goldman Sachs', -2234, 'liability'),
(6, 1, 'Chase Freedom', 'Chase', -1800, 'liability'),
(7, 1, 'Student Loan', 'Federal', -12000, 'liability');

-- Accounts for Profile 2 (Mid-Career)
INSERT INTO accounts (id, profile_id, name, institution, balance, type) VALUES
(8, 2, 'Chase Checking', 'Chase', 3200, 'asset'),
(9, 2, 'Emergency Fund', 'Ally', 8500, 'asset'),
(10, 2, 'Fidelity 401k', 'Fidelity', 12000, 'asset'),
(11, 2, 'Car Loan', 'Toyota Financial', -8300, 'liability'),
(12, 2, 'Credit Card', 'Capital One', -3400, 'liability');

-- Accounts for Profile 3 (Gen Z)
INSERT INTO accounts (id, profile_id, name, institution, balance, type) VALUES
(13, 3, 'Chase College Checking', 'Chase', 2847, 'asset'),
(14, 3, 'Savings Account', 'Chase', 5200, 'asset'),
(15, 3, 'Student Loan', 'Federal', -28500, 'liability'),
(16, 3, 'Credit Card', 'Discover', -1200, 'liability');

-- Spending categories for Profile 1
INSERT INTO spending_categories (id, profile_id, name, amount, percentage) VALUES
(1, 1, 'Housing', 2200, 52.4),
(2, 1, 'Groceries', 650, 15.5),
(3, 1, 'Transportation', 450, 10.7),
(4, 1, 'Entertainment', 380, 9.0),
(5, 1, 'Utilities', 320, 7.6),
(6, 1, 'Healthcare', 200, 4.8);

-- Spending categories for Profile 2
INSERT INTO spending_categories (id, profile_id, name, amount, percentage) VALUES
(7, 2, 'Housing', 1400, 41.2),
(8, 2, 'Food & Dining', 520, 15.3),
(9, 2, 'Transportation', 380, 11.2),
(10, 2, 'Utilities', 245, 7.2),
(11, 2, 'Entertainment', 320, 9.4),
(12, 2, 'Healthcare', 535, 15.7);

-- Spending categories for Profile 3
INSERT INTO spending_categories (id, profile_id, name, amount, percentage) VALUES
(13, 3, 'Food & Dining', 450, 21.4),
(14, 3, 'Shopping', 320, 15.2),
(15, 3, 'Entertainment', 220, 10.5),
(16, 3, 'Transportation', 180, 8.6),
(17, 3, 'Rent', 600, 28.6),
(18, 3, 'Utilities', 330, 15.7);

-- Recent transactions for Profile 1
INSERT INTO transactions (id, profile_id, description, amount, category, date) VALUES
(1, 1, 'Mortgage Payment', -2200, 'Housing', '2025-08-01'),
(2, 1, 'Grocery Store', -120, 'Groceries', '2025-08-02'),
(3, 1, 'Gas Station', -45, 'Transportation', '2025-08-03'),
(4, 1, 'Netflix Subscription', -15, 'Entertainment', '2025-08-04'),
(5, 1, 'Electric Bill', -180, 'Utilities', '2025-08-05');

-- Recent transactions for Profile 2
INSERT INTO transactions (id, profile_id, description, amount, category, date) VALUES
(6, 2, 'Rent Payment', -1400, 'Housing', '2025-08-01'),
(7, 2, 'Restaurant', -85, 'Food & Dining', '2025-08-02'),
(8, 2, 'Car Payment', -350, 'Transportation', '2025-08-03'),
(9, 2, 'Internet Bill', -79, 'Utilities', '2025-08-04'),
(10, 2, 'Movie Tickets', -25, 'Entertainment', '2025-08-05');

-- Recent transactions for Profile 3
INSERT INTO transactions (id, profile_id, description, amount, category, date) VALUES
(11, 3, 'Rent Payment', -600, 'Housing', '2025-08-01'),
(12, 3, 'Coffee Shop', -8, 'Food & Dining', '2025-08-02'),
(13, 3, 'Online Shopping', -45, 'Shopping', '2025-08-03'),
(14, 3, 'Streaming Service', -12, 'Entertainment', '2025-08-04'),
(15, 3, 'Student Loan Payment', -200, 'Education', '2025-08-05'); 