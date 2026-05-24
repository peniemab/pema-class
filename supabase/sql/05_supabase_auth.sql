-- Auth : staff.user_id → auth.users, rôles SaaS

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;

ALTER TABLE staff
  ADD CONSTRAINT staff_role_check CHECK (role IN (
    'superadmin',
    'school_admin',
    'admin',
    'enseignant',
    'secretaire',
    'comptabilite',
    'teacher',
    'director',
    'other'
  ));

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND is_active = true
      AND role IN ('admin', 'director', 'school_admin')
  );
$$;

CREATE OR REPLACE FUNCTION is_school_direction()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND is_active = true
      AND role IN ('admin', 'director', 'school_admin')
  );
$$;

GRANT EXECUTE ON FUNCTION is_school_direction() TO authenticated;

-- Peek token onboarding (public, nom établissement uniquement)
CREATE OR REPLACE FUNCTION peek_school_onboarding_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  r school_onboarding_tokens%ROWTYPE;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 24 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_token');
  END IF;

  v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');

  SELECT * INTO r FROM school_onboarding_tokens
  WHERE token_hash = v_hash AND used_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF r.expires_at < now() THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'expired',
      'school_name', r.draft_school_name
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'school_name', r.draft_school_name,
    'expires_at', r.expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION peek_school_onboarding_token(text) TO anon, authenticated;
