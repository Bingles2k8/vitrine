-- =============================================================
-- Public Read Policies for the Museum Public Website
-- =============================================================
-- Run this in your Supabase Dashboard → SQL Editor
--
-- The public museum pages (/museum/[slug]) use the anon key,
-- so they need explicit policies to allow unauthenticated reads.
-- Without these, objects on the public site return empty even
-- though the query filters by status.
-- =============================================================


-- Allow anyone to look up a museum by its slug (needed for the
-- public page to load at all).
CREATE POLICY "Public can read museums"
  ON museums FOR SELECT
  TO anon
  USING (true);


-- Allow anyone to read objects that are publicly visible
-- (On Display or On Loan). Objects in Storage, Restoration, or
-- Deaccessioned remain private.
CREATE POLICY "Public can read on-display and on-loan objects"
  ON objects FOR SELECT
  TO anon
  USING (status IN ('On Display', 'On Loan'));
