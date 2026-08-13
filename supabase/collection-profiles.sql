-- =============================================================
-- Collection Profiles — 2026-08-12
-- See docs/collection-profiles-plan.md §4.
--
-- Adds:
--   1. The profile columns (which profiles a collection uses, and which
--      profile an individual object uses).
--   2. Tier A — first-class certification & grading columns.
--   3. Tier B — a JSONB bag for per-profile detail fields.
--
-- All additive. No backfill required, no RLS change (everything lives on
-- tables already covered), no RPC change (insert_object_if_quota_ok builds
-- rows via jsonb_populate_record, which handles both text and jsonb columns).
-- Idempotent — safe to re-run.
-- =============================================================

-- ── Profile selection ────────────────────────────────────────────────────

-- Ordered set of active profiles. Element 0 is the primary.
-- Values are CollectionProfile ids (slugs), NOT COLLECTION_CATEGORIES display strings.
alter table museums
  add column if not exists collection_profiles text[] not null default '{}';

-- Which profile an individual object uses. Null = fall back to the primary.
alter table objects
  add column if not exists collection_profile text;

create index if not exists objects_collection_profile_idx
  on objects (museum_id, collection_profile)
  where collection_profile is not null;


-- ── Tier A: certification & grading ──────────────────────────────────────

alter table objects
  add column if not exists cert_authority     text,     -- 'PSA', 'CGC', 'PCGS', 'GIA'…
  add column if not exists cert_number        text,     -- as printed on the slab / report
  add column if not exists cert_grade         text,     -- display grade: '10', 'MS-65', 'VF'
  add column if not exists cert_grade_numeric numeric,  -- derived on write, for sort + analytics
  add column if not exists cert_grade_scale   text,     -- which scale cert_grade came from
  add column if not exists cert_date          date,
  add column if not exists cert_subgrades     jsonb,    -- {"Centering":9.5,"Corners":10,…}
  add column if not exists cert_notes         text;

-- Cert numbers are the strongest duplicate signal available — a globally
-- unique identifier, unlike a fuzzy title match. Backs /api/objects/cert-lookup.
create index if not exists objects_cert_number_idx
  on objects (museum_id, cert_authority, cert_number)
  where cert_number is not null;


-- ── Tier B: per-profile detail fields ────────────────────────────────────

-- Keys are namespaced by profile id ('trading-cards.card_number') so values
-- belonging to a deactivated profile can never be misread as another
-- profile's. NOT NULL DEFAULT '{}' so read sites never handle a null.
alter table objects
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;

create index if not exists objects_custom_fields_gin
  on objects using gin (custom_fields jsonb_path_ops);

-- Defence in depth. The object edit screen writes to `objects` directly through
-- the Supabase client under RLS, so the Zod schema in lib/validations.ts only
-- guards the API and CSV import paths — it cannot guard that one. The registry
-- is not available in SQL, so this cannot check keys against it; what it can do
-- is bound the shape, keeping the column from becoming an unbounded dumping
-- ground if a stale or hostile client writes to it.
--
-- The logic lives in a function because Postgres rejects subqueries inside a
-- CHECK constraint (0A000).
create or replace function vitrine_custom_fields_ok(v jsonb)
returns boolean
language sql
immutable
parallel safe
as $$
  select jsonb_typeof(v) = 'object'
     and (select count(*) from jsonb_object_keys(v)) <= 40
     and not exists (
       select 1
       from jsonb_each(v) as e(key, value)
       where jsonb_typeof(e.value) in ('object', 'array')
          or length(e.key) > 128
          or (jsonb_typeof(e.value) = 'string' and length(e.value #>> '{}') > 2000)
     );
$$;

alter table objects drop constraint if exists objects_custom_fields_shape;
alter table objects
  add constraint objects_custom_fields_shape
  check (vitrine_custom_fields_ok(custom_fields));
