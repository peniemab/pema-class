-- Le nom de classe (A, B, C…) est unique par niveau, pas pour toute l'année.

ALTER TABLE classes
  DROP CONSTRAINT IF EXISTS classes_school_id_academic_year_id_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_school_year_level_name
  ON classes (school_id, academic_year_id, level, name);
