-- Extensions Flutter (matricule, lieu, provenance), finance, onboarding, storage.
-- À appliquer après 20260212120000_administrative_core.sql

-- Colonnes complémentaires pour l'app (hors modèle métier minimal)
ALTER TABLE student_emergency_contacts ADD COLUMN IF NOT EXISTS note TEXT;

ALTER TABLE students ADD COLUMN IF NOT EXISTS matricule TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS lieu_naissance TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS ecole_provenance TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_school_matricule
  ON students (school_id, matricule)
  WHERE matricule IS NOT NULL;

-- ============================================================
-- Onboarding : crée école + année active + ligne staff (director)
-- ============================================================
CREATE OR REPLACE FUNCTION complete_onboarding(
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

  IF EXISTS (SELECT 1 FROM staff WHERE user_id = v_user_id) THEN
    RETURN;
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
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_onboarding(text, text, text, text) TO authenticated;

-- ============================================================
-- Finance (module existant de l'app Flutter)
-- ============================================================
CREATE TABLE fees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL,
  academic_year text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE payments_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_id uuid NOT NULL REFERENCES fees(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL,
  receipt_number text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can view fees"
  ON fees FOR SELECT
  USING (school_id = get_user_school_id());

CREATE POLICY "admin can insert fees"
  ON fees FOR INSERT
  WITH CHECK (school_id = get_user_school_id() AND is_admin());

CREATE POLICY "admin can update fees"
  ON fees FOR UPDATE
  USING (school_id = get_user_school_id() AND is_admin());

CREATE POLICY "admin can delete fees"
  ON fees FOR DELETE
  USING (school_id = get_user_school_id() AND is_admin());

CREATE POLICY "staff can view payments"
  ON payments_history FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE school_id = get_user_school_id())
  );

CREATE POLICY "admin can insert payments"
  ON payments_history FOR INSERT
  WITH CHECK (
    student_id IN (SELECT id FROM students WHERE school_id = get_user_school_id())
    AND is_admin()
  );

CREATE POLICY "admin can update payments"
  ON payments_history FOR UPDATE
  USING (
    student_id IN (SELECT id FROM students WHERE school_id = get_user_school_id())
    AND is_admin()
  );

CREATE POLICY "admin can delete payments"
  ON payments_history FOR DELETE
  USING (
    student_id IN (SELECT id FROM students WHERE school_id = get_user_school_id())
    AND is_admin()
  );

CREATE INDEX idx_fees_school ON fees(school_id);
CREATE INDEX idx_payments_student ON payments_history(student_id);

-- ============================================================
-- Storage : bucket logos (public lecture)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

CREATE POLICY "logos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "logos insert own school folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = (SELECT get_user_school_id()::text)
  );

CREATE POLICY "logos update own school folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = (SELECT get_user_school_id()::text)
  );

CREATE POLICY "logos delete own school folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = (SELECT get_user_school_id()::text)
  );
