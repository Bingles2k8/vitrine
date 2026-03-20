-- =============================================================
-- Public Read Policies for the Museum Public Website
-- =============================================================
-- Run this in your Supabase Dashboard → SQL Editor
--
-- The public museum pages (/museum/[slug]) use the anon key,
-- so they need explicit policies to allow unauthenticated reads.
-- Without these, objects on the public site return empty even
-- though the query filters by status.
--
-- NOTE: These policies intentionally have no TO anon restriction
-- so that authenticated users visiting another museum's public
-- page also see the correct public data (not a 404).
-- =============================================================


-- Drop old policies before recreating
DROP POLICY IF EXISTS "Public can read museums" ON museums;
DROP POLICY IF EXISTS "Public can read on-display and on-loan objects" ON objects;
DROP POLICY IF EXISTS "Public can read visible objects" ON objects;


-- Allow anyone (logged in or not) to look up a museum by its slug.
CREATE POLICY "Public can read museums"
  ON museums FOR SELECT
  USING (true);


-- Allow anyone (logged in or not) to read objects that are marked
-- visible on the public site. Matches the app-level filter exactly
-- (show_on_site = true, not soft-deleted).
CREATE POLICY "Public can read visible objects"
  ON objects FOR SELECT
  USING (show_on_site = true AND deleted_at IS NULL);
