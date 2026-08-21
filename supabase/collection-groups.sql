-- =============================================================
-- Collection Groups ("Sets")
-- See docs/collection-groups-plan.md
--
-- Run in the Supabase Dashboard → SQL Editor.
--
-- Curated sets of objects with their own public pages. Available on every
-- tier, unlimited (decision D2) — there is no plan gate anywhere in this file.
-- =============================================================


-- -------------------------------------------------------------
-- COLLECTION GROUPS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collection_groups (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id         uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  slug              text        NOT NULL,
  title             text        NOT NULL,
  subtitle          text,
  description       text,

  -- Cover resolution ladder (plan §8.2): uploaded → nominated object →
  -- mosaic of members → single member → emoji. Both columns null is the
  -- normal case and still renders.
  cover_image_url   text,
  cover_object_id   uuid        REFERENCES objects(id) ON DELETE SET NULL,

  status            text        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'published')),

  -- 'manual' = the item rows are the membership.
  -- 'rule'   = the item rows are include/exclude overrides on the rule.
  membership        text        NOT NULL DEFAULT 'manual'
                                CHECK (membership IN ('manual', 'rule')),
  rule              jsonb       NOT NULL DEFAULT '{}'::jsonb,

  -- Deliberately excludes insured_value / estimated_value: sorting a public
  -- page by worth publishes the ranking. See plan §5.2.
  sort_by           text        NOT NULL DEFAULT 'manual'
                                CHECK (sort_by IN ('manual', 'alpha', 'date_added', 'date_made', 'grade')),

  -- How visitors move through the items on the set's page.
  nav_style         text        NOT NULL DEFAULT 'grid'
                                CHECK (nav_style IN (
                                  'grid', 'coverflow', 'carousel', 'filmstrip',
                                  'shelf', 'contact-sheet', 'timeline', 'reel'
                                )),

  -- Extra prominence only. A published set is public regardless of these.
  show_as_section   boolean     NOT NULL DEFAULT true,
  show_as_chip      boolean     NOT NULL DEFAULT false,
  display_order     integer,

  date_start        date,
  date_end          date,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  UNIQUE (museum_id, slug)
);

CREATE INDEX IF NOT EXISTS collection_groups_museum_idx
  ON collection_groups (museum_id, display_order);
CREATE INDEX IF NOT EXISTS collection_groups_public_idx
  ON collection_groups (museum_id, status);


-- -------------------------------------------------------------
-- COLLECTION GROUP ITEMS
-- One table serves both membership modes:
--   manual group → rows ARE the membership (role always 'include')
--   rule group   → rows are OVERRIDES on the rule result
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collection_group_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid        NOT NULL REFERENCES collection_groups(id) ON DELETE CASCADE,
  object_id   uuid        NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  -- Denormalised so RLS does not join through collection_groups per row.
  museum_id   uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'include'
                          CHECK (role IN ('include', 'exclude')),
  sort_order  integer,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, object_id)
);

CREATE INDEX IF NOT EXISTS collection_group_items_group_idx
  ON collection_group_items (group_id, sort_order);
CREATE INDEX IF NOT EXISTS collection_group_items_object_idx
  ON collection_group_items (object_id);


-- -------------------------------------------------------------
-- RLS — collection_groups
-- -------------------------------------------------------------
ALTER TABLE collection_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view groups in their museums" ON collection_groups;
CREATE POLICY "Users can view groups in their museums"
  ON collection_groups FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM museums m WHERE m.id = collection_groups.museum_id AND m.owner_id = auth.uid())
    OR is_staff_of_museum(collection_groups.museum_id)
  );

DROP POLICY IF EXISTS "Users can create groups in their museums" ON collection_groups;
CREATE POLICY "Users can create groups in their museums"
  ON collection_groups FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums m WHERE m.id = collection_groups.museum_id AND m.owner_id = auth.uid())
    OR is_staff_of_museum(collection_groups.museum_id)
  );

DROP POLICY IF EXISTS "Users can update groups in their museums" ON collection_groups;
CREATE POLICY "Users can update groups in their museums"
  ON collection_groups FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM museums m WHERE m.id = collection_groups.museum_id AND m.owner_id = auth.uid())
    OR is_staff_of_museum(collection_groups.museum_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums m WHERE m.id = collection_groups.museum_id AND m.owner_id = auth.uid())
    OR is_staff_of_museum(collection_groups.museum_id)
  );

DROP POLICY IF EXISTS "Users can delete groups in their museums" ON collection_groups;
CREATE POLICY "Users can delete groups in their museums"
  ON collection_groups FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM museums m WHERE m.id = collection_groups.museum_id AND m.owner_id = auth.uid())
    OR is_staff_of_museum(collection_groups.museum_id)
  );

-- Public read. Two conditions carry the load:
--   status = 'published'  — drafts are private
--   m.locked_at IS NULL   — a lapsed subscription hides the whole site, and
--                           must hide sets with it (matches the layout check)
DROP POLICY IF EXISTS "Public can view published groups" ON collection_groups;
CREATE POLICY "Public can view published groups"
  ON collection_groups FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM museums m
      WHERE m.id = collection_groups.museum_id AND m.locked_at IS NULL
    )
  );


-- -------------------------------------------------------------
-- RLS — collection_group_items
-- -------------------------------------------------------------
ALTER TABLE collection_group_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view group items in their museums" ON collection_group_items;
CREATE POLICY "Users can view group items in their museums"
  ON collection_group_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM museums m WHERE m.id = collection_group_items.museum_id AND m.owner_id = auth.uid())
    OR is_staff_of_museum(collection_group_items.museum_id)
  );

DROP POLICY IF EXISTS "Users can create group items in their museums" ON collection_group_items;
CREATE POLICY "Users can create group items in their museums"
  ON collection_group_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums m WHERE m.id = collection_group_items.museum_id AND m.owner_id = auth.uid())
    OR is_staff_of_museum(collection_group_items.museum_id)
  );

DROP POLICY IF EXISTS "Users can update group items in their museums" ON collection_group_items;
CREATE POLICY "Users can update group items in their museums"
  ON collection_group_items FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM museums m WHERE m.id = collection_group_items.museum_id AND m.owner_id = auth.uid())
    OR is_staff_of_museum(collection_group_items.museum_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums m WHERE m.id = collection_group_items.museum_id AND m.owner_id = auth.uid())
    OR is_staff_of_museum(collection_group_items.museum_id)
  );

DROP POLICY IF EXISTS "Users can delete group items in their museums" ON collection_group_items;
CREATE POLICY "Users can delete group items in their museums"
  ON collection_group_items FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM museums m WHERE m.id = collection_group_items.museum_id AND m.owner_id = auth.uid())
    OR is_staff_of_museum(collection_group_items.museum_id)
  );

-- Public read. Three conditions, all load-bearing:
--   role = 'include'   — exclusions are private editorial state (invariant T)
--   group published    — a draft set leaks nothing
--   object visible     — WITHOUT THIS the junction row publishes the id of a
--                        hidden object even though the object row itself is
--                        unreadable (invariant R)
DROP POLICY IF EXISTS "Public can view items of published groups" ON collection_group_items;
CREATE POLICY "Public can view items of published groups"
  ON collection_group_items FOR SELECT
  USING (
    role = 'include'
    AND EXISTS (
      SELECT 1 FROM collection_groups g
      WHERE g.id = collection_group_items.group_id AND g.status = 'published'
    )
    AND EXISTS (
      SELECT 1 FROM objects o
      WHERE o.id = collection_group_items.object_id
        AND o.show_on_site = true
        AND o.deleted_at IS NULL
    )
  );


-- -------------------------------------------------------------
-- updated_at maintenance
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_collection_group_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS collection_groups_touch_updated_at ON collection_groups;
CREATE TRIGGER collection_groups_touch_updated_at
  BEFORE UPDATE ON collection_groups
  FOR EACH ROW EXECUTE FUNCTION touch_collection_group_updated_at();


-- -------------------------------------------------------------
-- page_views — widen page_type for the new public pages
-- Original constraint: ('home','object','events','visit','embed')
-- -------------------------------------------------------------
ALTER TABLE page_views DROP CONSTRAINT IF EXISTS page_views_page_type_check;
ALTER TABLE page_views ADD CONSTRAINT page_views_page_type_check
  CHECK (page_type IN ('home', 'object', 'events', 'visit', 'embed', 'sets', 'group'));
