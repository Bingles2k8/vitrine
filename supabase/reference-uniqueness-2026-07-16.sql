-- Reference uniqueness for the documentation registers.
--
-- This is the migration that schema-reconciliation-2026-07-06.sql deferred to
-- "the Phase 2 reference-numbering migration" — which was never written. The
-- 16 July 2026 audit confirmed there are no UNIQUE indexes on any reference
-- column in the live database, so nothing stops two rows in the same museum
-- sharing a reference.
--
-- Two steps, both idempotent:
--   1. Renumber any colliding references, museum-wide, per register per year.
--      Oldest row keeps its number; later rows are pushed above the high-water
--      mark, ordered by created_at. No-op when there are no collisions.
--   2. Add UNIQUE (museum_id, <reference>) so future collisions are rejected
--      by the database. lib/nextReference.ts retries on the resulting 23505.
--
-- Index names embed the column so lib/nextReference.ts can tell this
-- constraint's violation apart from any other unique violation.
--
-- Safe to re-run. Run in the Supabase SQL editor.

-- 1 ── Renumber collisions ---------------------------------------------------

DO $$
DECLARE
  spec record;
  sql  text;
BEGIN
  FOR spec IN
    SELECT * FROM (VALUES
      ('entry_records',          'entry_number'),
      ('object_exits',           'exit_number'),
      ('loans',                  'loan_number'),
      ('rights_records',         'rights_reference'),
      ('collection_use_records', 'use_reference'),
      ('valuations',             'valuation_reference'),
      ('damage_reports',         'report_number'),
      ('collection_reviews',     'review_reference'),
      ('disposal_records',       'disposal_reference'),
      ('condition_assessments',  'assessment_reference'),
      ('conservation_treatments','treatment_reference')
    ) AS t(tbl, col)
  LOOP
    -- Skip registers this database doesn't have.
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = spec.tbl AND column_name = spec.col
    ) THEN
      CONTINUE;
    END IF;

    -- For each (museum, prefix-year) group, renumber duplicates above the
    -- group's current maximum. `dupe_rank` is NULL for the row that keeps its
    -- reference (the earliest created_at) and 1..n for the rows to move.
    sql := format($f$
      WITH parsed AS (
        SELECT id, museum_id, created_at,
               %1$I AS ref,
               substring(%1$I from '^(.*-\d{4}-)') AS pattern,
               (substring(%1$I from '(\d+)$'))::int AS seq
        FROM %2$I
        WHERE %1$I ~ '^.*-\d{4}-\d+$'
      ),
      ranked AS (
        SELECT *,
               row_number() OVER (PARTITION BY museum_id, ref ORDER BY created_at, id) AS copy_no,
               max(seq) OVER (PARTITION BY museum_id, pattern) AS max_seq
        FROM parsed
      ),
      to_move AS (
        SELECT id, pattern, max_seq,
               row_number() OVER (PARTITION BY museum_id, pattern ORDER BY created_at, id) AS offset_no
        FROM ranked
        WHERE copy_no > 1
      )
      UPDATE %2$I AS target
         SET %1$I = to_move.pattern || lpad((to_move.max_seq + to_move.offset_no)::text, 3, '0')
        FROM to_move
       WHERE target.id = to_move.id
    $f$, spec.col, spec.tbl);

    EXECUTE sql;
  END LOOP;
END $$;

-- 2 ── Enforce uniqueness ----------------------------------------------------

DO $$
DECLARE
  spec record;
BEGIN
  FOR spec IN
    SELECT * FROM (VALUES
      ('entry_records',          'entry_number'),
      ('object_exits',           'exit_number'),
      ('loans',                  'loan_number'),
      ('rights_records',         'rights_reference'),
      ('collection_use_records', 'use_reference'),
      ('valuations',             'valuation_reference'),
      ('damage_reports',         'report_number'),
      ('collection_reviews',     'review_reference'),
      ('disposal_records',       'disposal_reference'),
      ('condition_assessments',  'assessment_reference'),
      ('conservation_treatments','treatment_reference')
    ) AS t(tbl, col)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = spec.tbl AND column_name = spec.col
    ) THEN
      CONTINUE;
    END IF;

    -- Partial index: rows with a NULL reference don't participate.
    EXECUTE format(
      'CREATE UNIQUE INDEX IF NOT EXISTS %I ON public.%I (museum_id, %I) WHERE %I IS NOT NULL',
      spec.tbl || '_museum_id_' || spec.col || '_key', spec.tbl, spec.col, spec.col
    );
  END LOOP;
END $$;
