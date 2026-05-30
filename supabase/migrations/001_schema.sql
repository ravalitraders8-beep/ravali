-- RAVALI TRADERS — Supabase Schema
-- Run this entire file in the Supabase SQL Editor

-- TABLE 1: Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_english TEXT NOT NULL,
  name_telugu TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  icon TEXT NOT NULL,
  monthly_target_amount NUMERIC(12,2) NOT NULL DEFAULT 50000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 2: Contractors
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_english TEXT NOT NULL,
  name_telugu TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  village_english TEXT NOT NULL,
  village_telugu TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  qr_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  joined_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 3: Amount Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractors(id),
  amount NUMERIC(12,2) NOT NULL,
  reason_english TEXT NOT NULL,
  reason_telugu TEXT NOT NULL,
  transaction_date DATE DEFAULT CURRENT_DATE,
  added_by TEXT DEFAULT 'admin',
  month_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 4: Reward Levels
CREATE TABLE IF NOT EXISTS reward_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_name_english TEXT NOT NULL,
  level_name_telugu TEXT NOT NULL,
  min_amount NUMERIC(12,2) NOT NULL,
  max_amount NUMERIC(12,2),
  reward_description_english TEXT NOT NULL,
  reward_description_telugu TEXT NOT NULL,
  icon TEXT NOT NULL,
  color_hex TEXT NOT NULL
);

-- TABLE 5: Rewards Delivered
CREATE TABLE IF NOT EXISTS rewards_delivered (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractors(id),
  reward_level_id UUID REFERENCES reward_levels(id),
  delivered_date DATE DEFAULT CURRENT_DATE,
  delivered_by TEXT DEFAULT 'admin',
  notes TEXT,
  month_year TEXT NOT NULL
);

-- TABLE 6: Admin Activity Log
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  target_contractor_id UUID REFERENCES contractors(id),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Categories
INSERT INTO categories (name_english, name_telugu, color_hex, icon, monthly_target_amount)
VALUES
  ('Painter',     'పెయింటర్',      '#3B82F6', '🎨', 80000),
  ('Electrician', 'ఎలక్ట్రీషియన్', '#EAB308', '⚡', 60000),
  ('Plumber',     'ప్లంబర్',       '#06B6D4', '🔧', 50000),
  ('Mason',       'మేస్త్రి',       '#F97316', '🧱', 100000),
  ('Carpenter',   'కార్పెంటర్',    '#92400E', '🪚', 70000)
ON CONFLICT DO NOTHING;

-- Seed Reward Levels
INSERT INTO reward_levels
  (level_name_english, level_name_telugu, min_amount, max_amount,
   reward_description_english, reward_description_telugu, icon, color_hex)
VALUES
  ('Bronze',  'కంచు',    0,      19999,  'Welcome Gift',         'స్వాగత బహుమతి',     '🥉', '#CD7F32'),
  ('Silver',  'వెండి',   20000,  49999,  'Tool Kit',             'టూల్ కిట్',          '🥈', '#C0C0C0'),
  ('Gold',    'బంగారు',  50000,  99999,  'Mobile Recharge Gift', 'మొబైల్ రీచార్జ్',    '🥇', '#FFD700'),
  ('Diamond', 'డైమండ్',  100000, NULL,   'Special Reward + Trophy', 'బహుమతి + ట్రోఫీ', '💎', '#B9F2FF')
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_delivered ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read reward_levels" ON reward_levels;
CREATE POLICY "Public read reward_levels" ON reward_levels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Contractor read own profile" ON contractors;
CREATE POLICY "Contractor read own profile" ON contractors FOR SELECT
USING (qr_token = current_setting('app.current_qr_token', true));

DROP POLICY IF EXISTS "Contractor read own transactions" ON transactions;
CREATE POLICY "Contractor read own transactions" ON transactions FOR SELECT
USING (
  contractor_id = (
    SELECT id FROM contractors
    WHERE qr_token = current_setting('app.current_qr_token', true)
  )
);

DROP POLICY IF EXISTS "Admin full access contractors" ON contractors;
CREATE POLICY "Admin full access contractors" ON contractors FOR ALL
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin full access transactions" ON transactions;
CREATE POLICY "Admin full access transactions" ON transactions FOR ALL
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin full access rewards_delivered" ON rewards_delivered;
CREATE POLICY "Admin full access rewards_delivered" ON rewards_delivered FOR ALL
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin full access admin_logs" ON admin_logs;
CREATE POLICY "Admin full access admin_logs" ON admin_logs FOR ALL
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin full access categories" ON categories;
CREATE POLICY "Admin full access categories" ON categories FOR ALL
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin full access reward_levels" ON reward_levels;
CREATE POLICY "Admin full access reward_levels" ON reward_levels FOR ALL
USING (auth.role() = 'service_role');

-- Functions
CREATE OR REPLACE FUNCTION get_contractor_monthly_amount(
  p_contractor_id UUID,
  p_month_year TEXT
)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM transactions
  WHERE contractor_id = p_contractor_id
  AND month_year = p_month_year;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_monthly_leaderboard(p_month_year TEXT)
RETURNS TABLE (
  rank BIGINT,
  contractor_id UUID,
  name_english TEXT,
  name_telugu TEXT,
  category_english TEXT,
  category_telugu TEXT,
  category_color TEXT,
  village_telugu TEXT,
  total_amount NUMERIC,
  target_amount NUMERIC,
  achievement_percent NUMERIC
) AS $$
  SELECT
    RANK() OVER (ORDER BY COALESCE(SUM(t.amount),0) DESC) as rank,
    c.id,
    c.name_english,
    c.name_telugu,
    cat.name_english,
    cat.name_telugu,
    cat.color_hex,
    c.village_telugu,
    COALESCE(SUM(t.amount), 0) AS total_amount,
    cat.monthly_target_amount AS target_amount,
    ROUND((COALESCE(SUM(t.amount),0) / NULLIF(cat.monthly_target_amount, 0)) * 100, 1) AS achievement_percent
  FROM contractors c
  LEFT JOIN transactions t
    ON c.id = t.contractor_id AND t.month_year = p_month_year
  JOIN categories cat ON c.category_id = cat.id
  WHERE c.is_active = TRUE
  GROUP BY c.id, c.name_english, c.name_telugu,
           cat.name_english, cat.name_telugu,
           cat.color_hex, c.village_telugu,
           cat.monthly_target_amount
  ORDER BY COALESCE(SUM(t.amount), 0) DESC;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_category_leaderboard(
  p_month_year TEXT,
  p_category_id UUID
)
RETURNS TABLE (
  rank BIGINT,
  contractor_id UUID,
  name_telugu TEXT,
  village_telugu TEXT,
  total_amount NUMERIC,
  target_amount NUMERIC,
  achievement_percent NUMERIC
) AS $$
  SELECT
    RANK() OVER (ORDER BY COALESCE(SUM(t.amount),0) DESC),
    c.id,
    c.name_telugu,
    c.village_telugu,
    COALESCE(SUM(t.amount), 0) AS total_amount,
    cat.monthly_target_amount AS target_amount,
    ROUND((COALESCE(SUM(t.amount),0) / NULLIF(cat.monthly_target_amount, 0)) * 100, 1) AS achievement_percent
  FROM contractors c
  LEFT JOIN transactions t
    ON c.id = t.contractor_id AND t.month_year = p_month_year
  JOIN categories cat ON c.category_id = cat.id
  WHERE c.is_active = TRUE
  AND c.category_id = p_category_id
  GROUP BY c.id, c.name_telugu, c.village_telugu,
           cat.monthly_target_amount
  ORDER BY COALESCE(SUM(t.amount), 0) DESC;
$$ LANGUAGE SQL SECURITY DEFINER;
