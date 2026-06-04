-- Atomic next CTR-{PREFIX}-### token (reads all matching rows in DB)
CREATE OR REPLACE FUNCTION public.allocate_contractor_qr_token(p_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max int := 0;
  v_pattern text;
BEGIN
  v_pattern := '^CTR-' || p_prefix || '-([0-9]+)$';

  SELECT COALESCE(MAX((regexp_match(qr_token, v_pattern, 'i'))[1]::int), 0)
  INTO v_max
  FROM contractors
  WHERE qr_token ~* v_pattern;

  RETURN 'CTR-' || p_prefix || '-' || lpad((v_max + 1)::text, 3, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.allocate_contractor_qr_token(text) TO service_role;
