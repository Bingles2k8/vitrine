-- =============================================================
-- Spectrum 5.1 Compliance Gap-Fill — Acquisition & Location
-- =============================================================
-- Adds mandatory fields identified in Spectrum 5.1 PDF audit:
--   Proc 2: acquisition_justification (Mandatory)
--           acquisition_documentation_ref (Mandatory)
--           acquisition_value + acquisition_currency (Conditional)
--   Proc 3: location_code on locations table (Mandatory)
-- =============================================================

-- ── Proc 2: Acquisition & Accessioning ───────────────────────
ALTER TABLE artifacts
  ADD COLUMN IF NOT EXISTS acquisition_justification      text,          -- How the object fits the collecting policy
  ADD COLUMN IF NOT EXISTS acquisition_documentation_ref  text,          -- Reference to deed of gift, bill of sale, etc.
  ADD COLUMN IF NOT EXISTS acquisition_value              numeric(12,2), -- Purchase price or agreed value (if applicable)
  ADD COLUMN IF NOT EXISTS acquisition_currency           text DEFAULT 'GBP';

-- ── Proc 3: Location Hierarchy ───────────────────────────────
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS location_code text; -- Unique code e.g. STORE-A-BAY3-SHELF2 (Mandatory per Spectrum)
