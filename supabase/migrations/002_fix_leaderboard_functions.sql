-- Fix: ORDER BY total_amount failed because alias was missing in get_category_leaderboard
-- Run this in Supabase SQL Editor if you already ran 001_schema.sql partially

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
    RANK() OVER (ORDER BY COALESCE(SUM(t.amount),0) DESC) AS rank,
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
    RANK() OVER (ORDER BY COALESCE(SUM(t.amount),0) DESC) AS rank,
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
