-- Category target unit (amount vs bags) and period dates

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS target_unit TEXT NOT NULL DEFAULT 'amount',
  ADD COLUMN IF NOT EXISTS period_start_date DATE,
  ADD COLUMN IF NOT EXISTS period_end_date DATE;

-- Mason tracks cement bags, not rupees
UPDATE categories
SET
  target_unit = 'bags',
  monthly_target_amount = 50
WHERE name_english = 'Mason';

-- Default period: current calendar month
UPDATE categories
SET
  period_start_date = date_trunc('month', CURRENT_DATE)::date,
  period_end_date = (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date
WHERE period_start_date IS NULL OR period_end_date IS NULL;
