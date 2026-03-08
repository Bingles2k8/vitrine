-- =============================================================
-- Museum Visit & Contact Info — Schema Migration
-- =============================================================
-- Adds contact and institutional info fields to the museums table
-- for the public Visit page. All columns are nullable so existing
-- rows are unaffected.
-- =============================================================

ALTER TABLE museums
  ADD COLUMN IF NOT EXISTS contact_phone   text,
  ADD COLUMN IF NOT EXISTS contact_email   text,
  ADD COLUMN IF NOT EXISTS about_text      text,
  ADD COLUMN IF NOT EXISTS facilities      text,
  ADD COLUMN IF NOT EXISTS maps_embed_url  text;
