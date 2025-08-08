-- Test script to verify Sparrow database schema
-- Run this after setting up your database to test all functionality

USE sparrow_db;

-- Test 1: Insert a test customer
INSERT INTO CUSTOMER (location, age, notification_prefs) 
VALUES ('New York, NY', 30, '{"email": true, "sms": false, "push": true}');

-- Test 2: Insert a test account
INSERT INTO ACCOUNT (customer_id, institution_name, account_number, account_type, balance, credit_limit) 
VALUES (1, 'Test Bank', '1234567890', 'checking', 5000.00, 0.00);

-- Test 3: Insert a test transaction
INSERT INTO TRANSACTION (account_id, amount, description, category_id, is_debit, is_bill, is_subscription) 
VALUES (1, 25.50, 'Coffee shop purchase', 1, TRUE, FALSE, FALSE);

-- Test 4: Insert a test goal
INSERT INTO GOAL (customer_id, name, description, target_amount, target_date) 
VALUES (1, 'Vacation Fund', 'Save for summer vacation', 2000.00, '2024-06-01');

-- Test 5: Query to verify relationships work
SELECT 
    c.customer_id,
    c.location,
    a.account_id,
    a.balance,
    t.amount,
    t.description,
    cat.name as category_name,
    g.name as goal_name
FROM CUSTOMER c
LEFT JOIN ACCOUNT a ON c.customer_id = a.customer_id
LEFT JOIN TRANSACTION t ON a.account_id = t.account_id
LEFT JOIN CATEGORY cat ON t.category_id = cat.category_id
LEFT JOIN GOAL g ON c.customer_id = g.customer_id
WHERE c.customer_id = 1;

-- Test 6: Verify JSON functionality
SELECT 
    customer_id,
    location,
    notification_prefs->>'email' as email_notifications,
    notification_prefs->>'sms' as sms_notifications
FROM CUSTOMER 
WHERE customer_id = 1;

-- Clean up test data (optional)
-- DELETE FROM GOAL WHERE customer_id = 1;
-- DELETE FROM TRANSACTION WHERE account_id = 1;
-- DELETE FROM ACCOUNT WHERE customer_id = 1;
-- DELETE FROM CUSTOMER WHERE customer_id = 1;

SELECT 'Schema test completed successfully!' as status; 