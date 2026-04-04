-- Batch feature migrations for Vitrine large feature batch
-- Run in order; each ALTER is idempotent via IF NOT EXISTS

-- 1. Merged physical description field (replaces colour/shape/surface_treatment in UI)
ALTER TABLE objects ADD COLUMN IF NOT EXISTS physical_description text;

-- 2. Manual part number label on components
ALTER TABLE object_components ADD COLUMN IF NOT EXISTS part_number_label text;

-- 3. Per-document notes on object_documents
ALTER TABLE object_documents ADD COLUMN IF NOT EXISTS notes text;

-- 4. Copyright status checked checkbox on objects
ALTER TABLE objects ADD COLUMN IF NOT EXISTS copyright_status_checked boolean DEFAULT false;

-- 5. Ethics notes field on objects (bottom of Legal & Ethics section in Acquisition tab)
ALTER TABLE objects ADD COLUMN IF NOT EXISTS acquisition_ethics_notes text;

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
