-- Spectrum 5.1 Phase 1: Cataloguing Deep Dive (Procedure 5)
-- Adds structured fields for maker, production, materials, dimensions, and associations.

ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS maker_name              text,
  ADD COLUMN IF NOT EXISTS maker_role               text,
  ADD COLUMN IF NOT EXISTS production_date_early     text,
  ADD COLUMN IF NOT EXISTS production_date_late      text,
  ADD COLUMN IF NOT EXISTS production_date_qualifier text,
  ADD COLUMN IF NOT EXISTS production_place          text,
  ADD COLUMN IF NOT EXISTS physical_materials        text,
  ADD COLUMN IF NOT EXISTS technique                 text,
  ADD COLUMN IF NOT EXISTS school_style_period       text,
  ADD COLUMN IF NOT EXISTS subject_depicted          text,
  ADD COLUMN IF NOT EXISTS number_of_parts           integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS distinguishing_features   text,
  ADD COLUMN IF NOT EXISTS full_description          text,
  ADD COLUMN IF NOT EXISTS associated_concept        text,
  ADD COLUMN IF NOT EXISTS associated_event          text,
  ADD COLUMN IF NOT EXISTS associated_person         text,
  ADD COLUMN IF NOT EXISTS associated_place          text,
  ADD COLUMN IF NOT EXISTS associated_organisation   text,
  ADD COLUMN IF NOT EXISTS dimension_height          numeric,
  ADD COLUMN IF NOT EXISTS dimension_width           numeric,
  ADD COLUMN IF NOT EXISTS dimension_depth           numeric,
  ADD COLUMN IF NOT EXISTS dimension_weight          numeric,
  ADD COLUMN IF NOT EXISTS dimension_unit            text DEFAULT 'cm',
  ADD COLUMN IF NOT EXISTS dimension_weight_unit     text DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS dimension_notes           text;
