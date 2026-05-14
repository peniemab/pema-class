-- Enrichit peek_invitation pour l’UI d’invitation personnel (nom école + rôle).

CREATE OR REPLACE FUNCTION public.peek_invitation(p_token text)
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

  RETURN jsonb_build_object(
    'ok', true,
    'invite_type', r.invite_type,
    'role', r.role,
    'school_name', (
      SELECT s.name FROM public.schools s WHERE s.id = r.school_id LIMIT 1
    )
  );
END;
$$;
