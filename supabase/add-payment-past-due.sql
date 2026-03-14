ALTER TABLE museums ADD COLUMN IF NOT EXISTS payment_past_due boolean NOT NULL DEFAULT false;
