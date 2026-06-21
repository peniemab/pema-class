-- Index sync / snapshots (présences, inscriptions, paiements, annuaire).
-- Idempotent — safe à relancer en prod comme les migrations bepas-log.

-- Présences : snapshot 90j filtré par classe + plage de dates
CREATE INDEX IF NOT EXISTS idx_attendances_class_date
  ON student_attendances (class_id, date);

CREATE INDEX IF NOT EXISTS idx_attendances_date
  ON student_attendances (date);

-- Inscriptions : annuaire par année scolaire + classe
CREATE INDEX IF NOT EXISTS idx_student_classes_year_class
  ON student_classes (academic_year_id, class_id);

CREATE INDEX IF NOT EXISTS idx_student_classes_class
  ON student_classes (class_id);

-- Élèves : annuaire par établissement
CREATE INDEX IF NOT EXISTS idx_students_school
  ON students (school_id);

CREATE INDEX IF NOT EXISTS idx_students_school_status
  ON students (school_id, status);

-- Contacts urgence : snapshot annuaire
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_student
  ON student_emergency_contacts (student_id);

-- Enseignants : classes assignées
CREATE INDEX IF NOT EXISTS idx_teacher_classes_staff_year
  ON teacher_classes (staff_id, academic_year_id);

-- Paiements : snapshot caisse par frais de l'année
CREATE INDEX IF NOT EXISTS idx_payments_fee_created
  ON payments_history (fee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_student_fee
  ON payments_history (student_id, fee_id);
