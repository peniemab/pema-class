-- ============================================================
--  SCHEMA GESTION ADMINISTRATIVE - SUPABASE
--  Multi-tenant | RLS activé
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SCHOOLS
-- ============================================================
CREATE TABLE IF NOT EXISTS schools (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  logo_url      TEXT,
  school_type   TEXT NOT NULL CHECK (school_type IN ('primary', 'secondary')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ACADEMIC_YEARS
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_years (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id     UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  period_type   TEXT NOT NULL CHECK (period_type IN ('trimester', 'semester')),
  is_active     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, name)
);

-- ============================================================
-- 3. PERIODS
-- ============================================================
CREATE TABLE IF NOT EXISTS periods (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id  UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  number            INT NOT NULL,
  label             TEXT NOT NULL,
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (academic_year_id, number)
);

-- ============================================================
-- 4. CLASSES
-- ============================================================
CREATE TABLE IF NOT EXISTS classes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id         UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id  UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  level             TEXT NOT NULL,
  max_capacity      INT NOT NULL DEFAULT 30,
  current_count     INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, academic_year_id, name)
);

-- ============================================================
-- 5. STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id     UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  birth_date    DATE,
  gender        TEXT CHECK (gender IN ('male', 'female', 'other')),
  photo_url     TEXT,
  address       TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_emergency_contacts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  relationship  TEXT NOT NULL,
  phone         TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. STUDENT_CLASSES
-- ============================================================
CREATE TABLE IF NOT EXISTS student_classes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id          UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_year_id  UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  enrolled_at       DATE DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, academic_year_id)
);

-- ============================================================
-- 7. STAFF
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id     UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('teacher', 'admin', 'director', 'other')),
  phone         TEXT,
  email         TEXT,
  photo_url     TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. TEACHER_CLASSES
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_classes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id          UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  class_id          UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_year_id  UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  subject           TEXT,
  is_main_teacher   BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (staff_id, class_id, academic_year_id, subject)
);

-- ============================================================
-- 9. STUDENT_ATTENDANCES
-- ============================================================
CREATE TABLE IF NOT EXISTS student_attendances (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id      UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  note          TEXT,
  recorded_by   UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, date)
);

-- ============================================================
-- 10. STAFF_ATTENDANCES
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_attendances (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id      UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (staff_id, date)
);

-- ============================================================
-- TRIGGERS : updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_schools_updated_at ON schools;
CREATE TRIGGER trg_schools_updated_at
  BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_academic_years_updated_at ON academic_years;
CREATE TRIGGER trg_academic_years_updated_at
  BEFORE UPDATE ON academic_years FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_classes_updated_at ON classes;
CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_staff_updated_at ON staff;
CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_student_attendances_updated_at ON student_attendances;
CREATE TRIGGER trg_student_attendances_updated_at
  BEFORE UPDATE ON student_attendances FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_staff_attendances_updated_at ON staff_attendances;
CREATE TRIGGER trg_staff_attendances_updated_at
  BEFORE UPDATE ON staff_attendances FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER : current_count sur classes
-- ============================================================
CREATE OR REPLACE FUNCTION update_class_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE classes SET current_count = current_count + 1 WHERE id = NEW.class_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE classes SET current_count = current_count - 1 WHERE id = OLD.class_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_student_classes_count ON student_classes;
CREATE TRIGGER trg_student_classes_count
  AFTER INSERT OR DELETE ON student_classes
  FOR EACH ROW EXECUTE FUNCTION update_class_count();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE schools                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years             ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE students                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_classes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_classes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendances        ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendances          ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM staff WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'director')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "staff can view own school" ON schools;
DROP POLICY IF EXISTS "admin can update own school" ON schools;
DROP POLICY IF EXISTS "staff can view academic years" ON academic_years;
DROP POLICY IF EXISTS "admin can manage academic years" ON academic_years;
DROP POLICY IF EXISTS "staff can view periods" ON periods;
DROP POLICY IF EXISTS "admin can manage periods" ON periods;
DROP POLICY IF EXISTS "staff can view classes" ON classes;
DROP POLICY IF EXISTS "admin can manage classes" ON classes;
DROP POLICY IF EXISTS "staff can view students" ON students;
DROP POLICY IF EXISTS "admin can manage students" ON students;
DROP POLICY IF EXISTS "teacher can update students in own class" ON students;
DROP POLICY IF EXISTS "staff can view emergency contacts" ON student_emergency_contacts;
DROP POLICY IF EXISTS "admin can manage emergency contacts" ON student_emergency_contacts;
DROP POLICY IF EXISTS "staff can view student classes" ON student_classes;
DROP POLICY IF EXISTS "admin can manage student classes" ON student_classes;
DROP POLICY IF EXISTS "staff can view colleagues" ON staff;
DROP POLICY IF EXISTS "admin can manage staff" ON staff;
DROP POLICY IF EXISTS "staff can view teacher classes" ON teacher_classes;
DROP POLICY IF EXISTS "admin can manage teacher classes" ON teacher_classes;
DROP POLICY IF EXISTS "staff can view attendances" ON student_attendances;
DROP POLICY IF EXISTS "teacher can record attendances for own classes" ON student_attendances;
DROP POLICY IF EXISTS "teacher can update own recorded attendances" ON student_attendances;
DROP POLICY IF EXISTS "admin can manage all attendances" ON student_attendances;
DROP POLICY IF EXISTS "staff can view staff attendances" ON staff_attendances;
DROP POLICY IF EXISTS "admin can manage staff attendances" ON staff_attendances;

CREATE POLICY "staff can view own school"
  ON schools FOR SELECT
  USING (id = get_user_school_id());

CREATE POLICY "admin can update own school"
  ON schools FOR UPDATE
  USING (id = get_user_school_id() AND is_admin());

CREATE POLICY "staff can view academic years"
  ON academic_years FOR SELECT
  USING (school_id = get_user_school_id());

CREATE POLICY "admin can manage academic years"
  ON academic_years FOR ALL
  USING (school_id = get_user_school_id() AND is_admin());

CREATE POLICY "staff can view periods"
  ON periods FOR SELECT
  USING (academic_year_id IN (
    SELECT id FROM academic_years WHERE school_id = get_user_school_id()
  ));

CREATE POLICY "admin can manage periods"
  ON periods FOR ALL
  USING (academic_year_id IN (
    SELECT id FROM academic_years WHERE school_id = get_user_school_id()
  ) AND is_admin());

CREATE POLICY "staff can view classes"
  ON classes FOR SELECT
  USING (school_id = get_user_school_id());

CREATE POLICY "admin can manage classes"
  ON classes FOR ALL
  USING (school_id = get_user_school_id() AND is_admin());

CREATE POLICY "staff can view students"
  ON students FOR SELECT
  USING (school_id = get_user_school_id());

CREATE POLICY "admin can manage students"
  ON students FOR ALL
  USING (school_id = get_user_school_id() AND is_admin());

CREATE POLICY "teacher can update students in own class"
  ON students FOR UPDATE
  USING (
    school_id = get_user_school_id()
    AND id IN (
      SELECT sc.student_id FROM student_classes sc
      JOIN teacher_classes tc ON tc.class_id = sc.class_id
      JOIN staff s ON s.id = tc.staff_id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "staff can view emergency contacts"
  ON student_emergency_contacts FOR SELECT
  USING (student_id IN (
    SELECT id FROM students WHERE school_id = get_user_school_id()
  ));

CREATE POLICY "admin can manage emergency contacts"
  ON student_emergency_contacts FOR ALL
  USING (student_id IN (
    SELECT id FROM students WHERE school_id = get_user_school_id()
  ) AND is_admin());

CREATE POLICY "staff can view student classes"
  ON student_classes FOR SELECT
  USING (class_id IN (
    SELECT id FROM classes WHERE school_id = get_user_school_id()
  ));

CREATE POLICY "admin can manage student classes"
  ON student_classes FOR ALL
  USING (class_id IN (
    SELECT id FROM classes WHERE school_id = get_user_school_id()
  ) AND is_admin());

CREATE POLICY "staff can view colleagues"
  ON staff FOR SELECT
  USING (school_id = get_user_school_id());

CREATE POLICY "admin can manage staff"
  ON staff FOR ALL
  USING (school_id = get_user_school_id() AND is_admin());

CREATE POLICY "staff can view teacher classes"
  ON teacher_classes FOR SELECT
  USING (class_id IN (
    SELECT id FROM classes WHERE school_id = get_user_school_id()
  ));

CREATE POLICY "admin can manage teacher classes"
  ON teacher_classes FOR ALL
  USING (class_id IN (
    SELECT id FROM classes WHERE school_id = get_user_school_id()
  ) AND is_admin());

CREATE POLICY "staff can view attendances"
  ON student_attendances FOR SELECT
  USING (class_id IN (
    SELECT id FROM classes WHERE school_id = get_user_school_id()
  ));

CREATE POLICY "teacher can record attendances for own classes"
  ON student_attendances FOR INSERT
  WITH CHECK (
    class_id IN (
      SELECT tc.class_id FROM teacher_classes tc
      JOIN staff s ON s.id = tc.staff_id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "teacher can update own recorded attendances"
  ON student_attendances FOR UPDATE
  USING (
    recorded_by IN (SELECT id FROM staff WHERE user_id = auth.uid())
  );

CREATE POLICY "admin can manage all attendances"
  ON student_attendances FOR ALL
  USING (class_id IN (
    SELECT id FROM classes WHERE school_id = get_user_school_id()
  ) AND is_admin());

CREATE POLICY "staff can view staff attendances"
  ON staff_attendances FOR SELECT
  USING (staff_id IN (
    SELECT id FROM staff WHERE school_id = get_user_school_id()
  ));

CREATE POLICY "admin can manage staff attendances"
  ON staff_attendances FOR ALL
  USING (staff_id IN (
    SELECT id FROM staff WHERE school_id = get_user_school_id()
  ) AND is_admin());

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_academic_years_school ON academic_years(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_year ON classes(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_student ON student_classes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_class ON student_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_year ON student_classes(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_staff_school ON staff(school_id);
CREATE INDEX IF NOT EXISTS idx_staff_user ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_staff ON teacher_classes(staff_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_class ON teacher_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_student_attendances_date ON student_attendances(date);
CREATE INDEX IF NOT EXISTS idx_student_attendances_student ON student_attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendances_class ON student_attendances(class_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendances_staff ON staff_attendances(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendances_date ON staff_attendances(date);
