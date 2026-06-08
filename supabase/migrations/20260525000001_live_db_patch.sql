-- Patch idempotent pour BDD LIVE existante (schéma Supabase actuel).
-- Ne recrée pas les tables — ajoute uniquement ce qui manque à l'app Next.js.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Module /platform : recopie et régénération des liens onboarding
ALTER TABLE school_onboarding_tokens
  ADD COLUMN IF NOT EXISTS raw_token text,
  ADD COLUMN IF NOT EXISTS internal_note text,
  ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_school_onboarding_tokens_hash
  ON school_onboarding_tokens(token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_school_matricule
  ON students (school_id, matricule)
  WHERE matricule IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_school_user
  ON staff (school_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_school_email
  ON staff (school_id, lower(email))
  WHERE email IS NOT NULL AND email <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_slug
  ON schools (slug)
  WHERE slug IS NOT NULL;

-- ============================================================
-- Fonctions auth / tenant (CREATE OR REPLACE = safe sur live)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT school_id FROM staff
  WHERE user_id = auth.uid()
    AND status = 'active'
    AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
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
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
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

CREATE OR REPLACE FUNCTION peek_school_onboarding_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
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
      'ok', false, 'reason', 'expired', 'school_name', r.draft_school_name
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

-- Invitations staff (peek enrichi)
CREATE OR REPLACE FUNCTION peek_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r invitations%ROWTYPE;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_token');
  END IF;
  SELECT * INTO r FROM invitations
  WHERE token = trim(p_token) AND used_at IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF r.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired', 'invite_type', r.invite_type);
  END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'invite_type', r.invite_type,
    'role', r.role,
    'school_name', (
      SELECT s.name FROM schools s WHERE s.id = r.school_id LIMIT 1
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION peek_invitation(text) TO anon, authenticated;

-- RLS platform_admins (si pas déjà fait)
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_admins_select_self ON platform_admins;
CREATE POLICY platform_admins_select_self
  ON platform_admins FOR SELECT
  USING (user_id = auth.uid());
