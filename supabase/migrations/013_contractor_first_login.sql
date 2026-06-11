-- Track first successful app login (set once, never cleared)
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ;

COMMENT ON COLUMN contractors.first_login_at IS
  'Set on first successful phone login; used for admin logged-in counts';
