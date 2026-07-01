-- Update all transactions to use "ALL_TIME"
UPDATE transactions SET month_year = 'ALL_TIME';

-- Update all rewards to use "ALL_TIME"
UPDATE rewards_delivered SET month_year = 'ALL_TIME';
