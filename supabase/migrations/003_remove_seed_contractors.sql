-- Remove sample/mock contractors and transactions.
-- Categories and reward levels are kept (shop configuration, not mock people).
-- Run this after 001_schema.sql if you want a clean database with only real contractors.

DELETE FROM rewards_delivered;
DELETE FROM admin_logs;
DELETE FROM transactions;
DELETE FROM contractors;
