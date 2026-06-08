-- Socle SaaS écoles (complète administrative_core.sql)
-- school_onboarding_tokens : inscription directeur via lien superadmin (72h)

CREATE TABLE IF NOT EXISTS school_onboarding_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  draft_school_name text NOT NULL,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_onboarding_tokens_hash
  ON school_onboarding_tokens(token_hash);

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug) WHERE slug IS NOT NULL;

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_school_email
  ON staff(school_id, lower(email))
  WHERE email IS NOT NULL AND email <> '';

-- invitations : personnel (hors school_admin) — table existante, rôles étendus en 05_supabase_auth.sql
