-- Index pour les requêtes référentiels / caisse (filtrage par école + année).

CREATE INDEX IF NOT EXISTS idx_academic_years_school
  ON academic_years (school_id);

CREATE INDEX IF NOT EXISTS idx_academic_years_school_active
  ON academic_years (school_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_periods_academic_year
  ON periods (academic_year_id);

CREATE INDEX IF NOT EXISTS idx_classes_school_year
  ON classes (school_id, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_fees_school_year_label
  ON fees (school_id, academic_year);
