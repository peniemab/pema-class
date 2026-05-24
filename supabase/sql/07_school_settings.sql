-- Paramètres établissement (UX type Réglages iPhone)

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS rccm text,
  ADD COLUMN IF NOT EXISTS tax_number text,
  ADD COLUMN IF NOT EXISTS national_id text;

-- logo_url existant ; upload Storage ultérieur
