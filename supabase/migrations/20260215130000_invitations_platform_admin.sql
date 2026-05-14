-- Invitations (école + personnel) + super-admin plateforme
-- Prérequis : migrations administrative_core + app_onboarding_finance_storage

-- ============================================================
-- Super-admin (lignes insérées manuellement après 1er compte Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admins_select_self"
  ON platform_admins FOR SELECT
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid());
$$;

-- ============================================================
-- Invitations
-- ============================================================
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_type text NOT NULL CHECK (invite_type IN ('school_setup', 'staff_join')),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  role text,
  email text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invitations_shape_ck CHECK (
    (invite_type = 'school_setup' AND school_id IS NULL)
    OR (invite_type = 'staff_join' AND school_id IS NOT NULL AND role IS NOT NULL)
  ),
  CONSTRAINT invitations_role_ck CHECK (
    role IS NULL OR role = ANY (ARRAY['teacher'::text, 'admin'::text, 'director'::text, 'other'::text])
  )
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_created_by ON invitations(created_by);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select"
  ON invitations FOR SELECT
  USING (
    is_platform_admin()
    OR created_by = auth.uid()
    OR (
      invite_type = 'staff_join'
      AND school_id = get_user_school_id()
      AND is_admin()
    )
  );

-- Un seul staff par (école, user)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_staff_school_user
  ON staff(school_id, user_id)
  WHERE user_id IS NOT NULL;

-- ============================================================
-- Génération & validation
-- ============================================================
CREATE OR REPLACE FUNCTION create_school_invitation()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tok text;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  tok := lower(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''));
  INSERT INTO invitations (invite_type, token, expires_at, created_by)
  VALUES ('school_setup', tok, now() + interval '14 days', auth.uid());
  RETURN tok;
END;
$$;

CREATE OR REPLACE FUNCTION create_staff_invitation(p_role text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tok text;
  sid uuid;
BEGIN
  IF p_role IS NULL OR p_role NOT IN ('teacher', 'admin', 'director', 'other') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  IF NOT is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  sid := get_user_school_id();
  IF sid IS NULL THEN
    RAISE EXCEPTION 'no_school';
  END IF;

  tok := lower(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''));
  INSERT INTO invitations (invite_type, token, expires_at, school_id, role, created_by)
  VALUES ('staff_join', tok, now() + interval '14 days', sid, p_role, auth.uid());
  RETURN tok;
END;
$$;

CREATE OR REPLACE FUNCTION peek_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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

  RETURN jsonb_build_object('ok', true, 'invite_type', r.invite_type);
END;
$$;

GRANT EXECUTE ON FUNCTION peek_invitation(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_school_invitation() TO authenticated;
GRANT EXECUTE ON FUNCTION create_staff_invitation(text) TO authenticated;

-- ============================================================
-- Acceptation : création école (lien super-admin)
-- ============================================================
CREATE OR REPLACE FUNCTION accept_school_invitation(
  p_token text,
  p_school_name text,
  p_school_address text,
  p_admin_name text,
  p_school_type text DEFAULT 'primary'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_inv invitations%ROWTYPE;
  v_school_id uuid;
  v_year_id uuid;
  v_parts text[];
  v_first text;
  v_last text;
  v_start date;
  v_end date;
  v_year_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_inv FROM invitations
  WHERE token = trim(p_token)
    AND used_at IS NULL
    AND invite_type = 'school_setup';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_invitation';
  END IF;

  IF v_inv.expires_at < now() THEN
    RAISE EXCEPTION 'invitation_expired';
  END IF;

  IF EXISTS (SELECT 1 FROM staff WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'already_has_school';
  END IF;

  IF p_school_type IS NOT NULL AND p_school_type NOT IN ('primary', 'secondary') THEN
    RAISE EXCEPTION 'invalid school_type';
  END IF;

  INSERT INTO schools (name, address, school_type)
  VALUES (
    trim(p_school_name),
    nullif(trim(p_school_address), ''),
    coalesce(nullif(trim(p_school_type), ''), 'primary')
  )
  RETURNING id INTO v_school_id;

  v_parts := regexp_split_to_array(trim(p_admin_name), '\s+');
  v_first := coalesce(v_parts[1], 'Admin');
  v_last := CASE WHEN array_length(v_parts, 1) > 1
    THEN v_parts[array_length(v_parts, 1)]
    ELSE '' END;

  INSERT INTO staff (school_id, user_id, first_name, last_name, role)
  VALUES (v_school_id, v_user_id, v_first, v_last, 'director');

  v_start := make_date(
    CASE WHEN extract(month FROM now()) >= 9
      THEN extract(year FROM now())::int
      ELSE extract(year FROM now())::int - 1 END,
    9, 1
  );
  v_end := (v_start + interval '1 year - 1 day')::date;
  v_year_name := to_char(v_start, 'YYYY') || '-' || to_char(v_start + interval '1 year', 'YYYY');

  INSERT INTO academic_years (school_id, name, start_date, end_date, period_type, is_active)
  VALUES (v_school_id, v_year_name, v_start, v_end, 'trimester', true)
  RETURNING id INTO v_year_id;

  UPDATE academic_years SET is_active = false
  WHERE school_id = v_school_id AND id <> v_year_id;

  UPDATE academic_years SET is_active = true WHERE id = v_year_id;

  UPDATE invitations SET used_at = now() WHERE id = v_inv.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_school_invitation(text, text, text, text, text) TO authenticated;

-- ============================================================
-- Acceptation : rejoindre une école (lien directeur / admin)
-- ============================================================
CREATE OR REPLACE FUNCTION accept_staff_invitation(
  p_token text,
  p_first_name text,
  p_last_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_inv invitations%ROWTYPE;
  fn text;
  ln text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_inv FROM invitations
  WHERE token = trim(p_token)
    AND used_at IS NULL
    AND invite_type = 'staff_join';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_invitation';
  END IF;

  IF v_inv.expires_at < now() THEN
    RAISE EXCEPTION 'invitation_expired';
  END IF;

  IF EXISTS (SELECT 1 FROM staff WHERE user_id = v_user_id AND school_id = v_inv.school_id) THEN
    RAISE EXCEPTION 'already_member';
  END IF;

  fn := nullif(trim(p_first_name), '');
  ln := nullif(trim(p_last_name), '');
  IF fn IS NULL OR ln IS NULL THEN
    RAISE EXCEPTION 'name_required';
  END IF;

  INSERT INTO staff (school_id, user_id, first_name, last_name, role)
  VALUES (v_inv.school_id, v_user_id, fn, ln, v_inv.role);

  UPDATE invitations SET used_at = now() WHERE id = v_inv.id;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_staff_invitation(text, text, text) TO authenticated;

-- Inscription publique directe sans invitation : désactivée côté API
REVOKE EXECUTE ON FUNCTION public.complete_onboarding(text, text, text, text) FROM authenticated;

-- Note : après migration, ajouter le super-admin une fois :
-- INSERT INTO public.platform_admins (user_id) VALUES ('<uuid depuis auth.users>');
