-- Cycles scolaires (maternelle, primaire, secondaire, humanités)
-- et périodes par cycle (trimestres vs semestres).

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS offered_cycles text[] DEFAULT ARRAY['primaire']::text[];

ALTER TABLE academic_years
  ADD COLUMN IF NOT EXISTS cycles text[];

ALTER TABLE periods
  ADD COLUMN IF NOT EXISTS cycle text;

UPDATE periods SET cycle = 'primaire' WHERE cycle IS NULL;

ALTER TABLE periods DROP CONSTRAINT IF EXISTS periods_academic_year_id_number_key;

DROP INDEX IF EXISTS idx_periods_year_cycle_number;
CREATE UNIQUE INDEX IF NOT EXISTS idx_periods_year_cycle_number
  ON periods (academic_year_id, cycle, number);

ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS cycle text;

UPDATE classes SET cycle = 'maternelle'
  WHERE cycle IS NULL AND level ILIKE '%maternelle%';
UPDATE classes SET cycle = 'humanites'
  WHERE cycle IS NULL AND (level ILIKE '%humanité%' OR level ILIKE '%humanite%');
UPDATE classes SET cycle = 'secondaire'
  WHERE cycle IS NULL AND level ILIKE '%EB%';
UPDATE classes SET cycle = 'primaire'
  WHERE cycle IS NULL AND level ILIKE '%primaire%';
UPDATE classes SET cycle = 'primaire' WHERE cycle IS NULL;
