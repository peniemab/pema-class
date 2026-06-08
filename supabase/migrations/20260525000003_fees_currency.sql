-- Devise des frais scolaires : CDF ou USD (caisse / recouvrement).

ALTER TABLE fees
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'CDF';

ALTER TABLE fees DROP CONSTRAINT IF EXISTS fees_currency_check;
ALTER TABLE fees
  ADD CONSTRAINT fees_currency_check CHECK (currency IN ('CDF', 'USD'));

-- Paiements : même devise que le frais (cohérence caisse v2).
ALTER TABLE payments_history
  ADD COLUMN IF NOT EXISTS currency text;

UPDATE payments_history ph
SET currency = f.currency
FROM fees f
WHERE ph.fee_id = f.id AND ph.currency IS NULL;

ALTER TABLE payments_history
  ALTER COLUMN currency SET DEFAULT 'CDF';

-- Backfill frais existants sans devise explicite
UPDATE fees SET currency = 'CDF' WHERE currency IS NULL OR trim(currency) = '';
