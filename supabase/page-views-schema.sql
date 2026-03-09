-- Page views table for public site visitor analytics
CREATE TABLE IF NOT EXISTS page_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  museum_id uuid REFERENCES museums(id) ON DELETE CASCADE NOT NULL,
  artifact_id uuid REFERENCES artifacts(id) ON DELETE SET NULL,
  page_type text NOT NULL CHECK (page_type IN ('home', 'artifact', 'events', 'visit', 'embed')),
  viewed_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast per-museum queries sorted by date
CREATE INDEX IF NOT EXISTS page_views_museum_viewed ON page_views (museum_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS page_views_artifact ON page_views (artifact_id) WHERE artifact_id IS NOT NULL;

-- RLS: museum owners and staff can read their own views. Anyone can insert (public tracking).
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert page views" ON page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Museum owners can read their page views" ON page_views
  FOR SELECT USING (
    museum_id IN (
      SELECT id FROM museums WHERE owner_id = auth.uid()
      UNION
      SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
    )
  );
