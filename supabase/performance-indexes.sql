-- Performance indexes for public-facing queries.
--
-- museums.slug is the public URL identifier; every /museum/:slug page does a
-- single-row lookup on it. Unique, not just btree, so duplicates are blocked
-- at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS museums_slug_idx ON museums (slug);

-- Featured-works grid on the public museum page filters by
-- (museum_id, is_featured, show_on_site) with deleted_at null.
CREATE INDEX IF NOT EXISTS objects_featured_idx
  ON objects (museum_id, is_featured, show_on_site)
  WHERE deleted_at IS NULL;

-- Visitor-analytics dashboard scans page_views by museum, ordered by time desc.
CREATE INDEX IF NOT EXISTS page_views_museum_time_idx
  ON page_views (museum_id, viewed_at DESC);
