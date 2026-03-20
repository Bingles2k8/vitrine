-- Discovery Directory
-- Museums can opt in to be listed in the public Vitrine discovery page.
-- A primary category is required for the collection to appear.
-- Individual objects can override with their own category.

ALTER TABLE museums
  ADD COLUMN IF NOT EXISTS discoverable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS collection_category text;

-- Per-object category override (inherits museum's collection_category when null)
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS category text;
