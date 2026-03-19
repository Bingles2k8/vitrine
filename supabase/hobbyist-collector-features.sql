-- Hobbyist collector features: rarity field on objects, collector identity on museums

ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS rarity text;

ALTER TABLE museums
  ADD COLUMN IF NOT EXISTS collector_bio     text,
  ADD COLUMN IF NOT EXISTS collection_label  text,
  ADD COLUMN IF NOT EXISTS collecting_since  text;
