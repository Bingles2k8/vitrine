-- Spectrum 5.1 Procedure 5 (Cataloguing) gap fields
-- Adds missing mandatory/recommended fields to the objects table

ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS colour                text,
  ADD COLUMN IF NOT EXISTS shape                 text,
  ADD COLUMN IF NOT EXISTS surface_treatment     text,
  ADD COLUMN IF NOT EXISTS other_names           text,
  ADD COLUMN IF NOT EXISTS provenance_date_range text,
  ADD COLUMN IF NOT EXISTS field_collection_info text;
