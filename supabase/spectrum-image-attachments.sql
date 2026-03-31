-- Spectrum 5.1 Procedure 12 (Conservation) — before/after images on treatments

ALTER TABLE conservation_treatments
  ADD COLUMN IF NOT EXISTS before_image_url text,
  ADD COLUMN IF NOT EXISTS after_image_url  text;
