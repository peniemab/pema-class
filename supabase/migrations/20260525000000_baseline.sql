-- Baseline Pema Class — multi-écoles SaaS
-- Pour NOUVEAU projet Supabase uniquement. Ne pas exécuter sur BDD live existante.
-- Voir supabase/SCHEMA.md et migrations/README.md

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- PLATEFORME
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_onboarding_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  raw_token text,
  internal_note text,
  email text,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  draft_school_name text NOT NULL,
  school_id uuid,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TENANT : ÉCOLES
-- ============================================================

CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  display_name text,
  slug text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  address text,
  phone text,
  email text,
  logo_url text,
  description text,
  rccm text,
  tax_number text,
  national_id text,
  school_type text NOT NULL CHECK (school_type IN ('primary', 'secondary')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug) WHERE slug IS NOT NULL;

-- ============================================================
-- ANNÉE SCOLAIRE
-- ============================================================

CREATE TABLE IF NOT EXISTS academic_years (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  period_type text NOT NULL CHECK (period_type IN ('trimester', 'semester')),
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (school_id, name)
);

CREATE TABLE IF NOT EXISTS periods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  number integer NOT NULL,
  label text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (academic_year_id, number)
);

-- ============================================================
-- CLASSES & ÉLÈVES
-- ============================================================

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name text NOT NULL,
  level text NOT NULL,
  max_capacity integer NOT NULL DEFAULT 30,
  current_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (school_id, academic_year_id, level, name)
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  matricule text,
  birth_date date,
  lieu_naissance text,
  ecole_provenance text,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  photo_url text,
  address text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_school_matricule
  ON students (school_id, matricule) WHERE matricule IS NOT NULL;

CREATE TABLE IF NOT EXISTS student_emergency_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  relationship text NOT NULL,
  phone text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_classes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  enrolled_at date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, academic_year_id)
);

-- ============================================================
-- PERSONNEL
-- ============================================================

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK (role IN (
    'school_admin', 'admin', 'enseignant', 'secretaire', 'comptabilite',
    'teacher', 'director', 'other'
  )),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended')),
  phone text,
  email text,
  photo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_school_user
  ON staff (school_id, user_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_school_email
  ON staff (school_id, lower(email)) WHERE email IS NOT NULL AND email <> '';

CREATE TABLE IF NOT EXISTS teacher_classes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  subject text,
  is_main_teacher boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (staff_id, class_id, academic_year_id, subject)
);

-- ============================================================
-- PRÉSENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS student_attendances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  note text,
  recorded_by uuid REFERENCES staff(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (student_id, date)
);

CREATE TABLE IF NOT EXISTS staff_attendances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (staff_id, date)
);

-- ============================================================
-- FINANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS fees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL,
  academic_year text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_id uuid NOT NULL REFERENCES fees(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL,
  receipt_number text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- INVITATIONS (staff_join uniquement — pas school_setup)
-- ============================================================

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_type text NOT NULL CHECK (invite_type IN ('staff_join')),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN (
    'school_admin', 'admin', 'enseignant', 'secretaire', 'comptabilite',
    'teacher', 'director', 'other'
  )),
  email text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);

-- FK différée onboarding → schools
ALTER TABLE school_onboarding_tokens
  DROP CONSTRAINT IF EXISTS school_onboarding_tokens_school_id_fkey;
ALTER TABLE school_onboarding_tokens
  ADD CONSTRAINT school_onboarding_tokens_school_id_fkey
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_school_onboarding_tokens_hash
  ON school_onboarding_tokens(token_hash);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION update_class_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE classes SET current_count = current_count + 1 WHERE id = NEW.class_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE classes SET current_count = current_count - 1 WHERE id = OLD.class_id;
  END IF;
  RETURN NULL;
END;
$$;

-- ============================================================
-- RLS + helpers : voir 20260525000001_live_db_patch.sql
-- (évite duplication ; le patch est idempotent et complète le baseline)
-- ============================================================
