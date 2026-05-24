-- Acceptation invitation personnel (staff_join) après création compte Supabase.

CREATE OR REPLACE FUNCTION public.accept_staff_invitation(
  p_token text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL
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
  u_email text;
  u_meta jsonb;
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

  IF EXISTS (
    SELECT 1 FROM staff
    WHERE user_id = v_user_id AND school_id = v_inv.school_id
  ) THEN
    RAISE EXCEPTION 'already_member';
  END IF;

  IF v_inv.email IS NOT NULL AND trim(v_inv.email) <> '' THEN
    SELECT lower(email) INTO u_email FROM auth.users WHERE id = v_user_id;
    IF u_email IS DISTINCT FROM lower(trim(v_inv.email)) THEN
      RAISE EXCEPTION 'email_mismatch';
    END IF;
  END IF;

  fn := nullif(trim(coalesce(p_first_name, '')), '');
  ln := nullif(trim(coalesce(p_last_name, '')), '');

  IF fn IS NULL OR ln IS NULL THEN
    SELECT u.email, coalesce(u.raw_user_meta_data, '{}'::jsonb)
    INTO u_email, u_meta
    FROM auth.users u
    WHERE u.id = v_user_id;

    IF fn IS NULL THEN
      fn := coalesce(
        nullif(trim(u_meta->>'given_name'), ''),
        nullif(trim(u_meta->>'first_name'), ''),
        nullif(split_part(u_email, '@', 1), ''),
        'Membre'
      );
    END IF;
    IF ln IS NULL THEN
      ln := coalesce(
        nullif(trim(u_meta->>'family_name'), ''),
        nullif(trim(u_meta->>'last_name'), ''),
        '-'
      );
    END IF;
  END IF;

  IF fn IS NULL OR fn = '' THEN fn := 'Membre'; END IF;
  IF ln IS NULL OR ln = '' THEN ln := '-'; END IF;

  INSERT INTO staff (
    school_id, user_id, first_name, last_name, role, email, is_active, status
  )
  VALUES (
    v_inv.school_id,
    v_user_id,
    fn,
    ln,
    v_inv.role,
    v_inv.email,
    true,
    'active'
  );

  UPDATE invitations SET used_at = now() WHERE id = v_inv.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_staff_invitation(text, text, text) TO authenticated;
