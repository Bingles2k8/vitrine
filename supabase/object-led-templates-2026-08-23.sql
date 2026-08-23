-- Object-led templates: the data the new public templates need.
--
-- Two values per photograph, computed in the browser at upload time alongside
-- the existing perceptual hash, and one canonical condition value so that
-- condition can be ranked rather than only displayed.

-- ── image metadata ────────────────────────────────────────────────────────
-- matte:  '#rrggbb' sampled from the picture's own border. Null where the
--         border is too busy to sample, which is the honest answer for an
--         object photographed in situ rather than on a plain ground.
-- aspect: natural width / height. Lets a template size a frame before the
--         image has loaded, so the layout does not jump.
alter table object_images add column if not exists matte  text;
alter table object_images add column if not exists aspect numeric;

alter table object_images drop constraint if exists object_images_matte_format;
alter table object_images add constraint object_images_matte_format
  check (matte is null or matte ~ '^#[0-9a-f]{6}$');

alter table object_images drop constraint if exists object_images_aspect_range;
alter table object_images add constraint object_images_aspect_range
  check (aspect is null or (aspect > 0 and aspect < 20));

comment on column object_images.matte is
  'Modal colour of the image border, used as the surround in object-led templates. Null when the border is not uniform enough to sample.';
comment on column object_images.aspect is
  'Natural width / height, so a frame can be sized before the image loads.';

-- ── canonical condition ───────────────────────────────────────────────────
-- condition_grade stays exactly as the collector typed it and remains what the
-- public site displays. This column exists so condition can be sorted, filtered
-- and ranked, which today it cannot: most stored grades are hobby wording
-- ('Very Good', 'Good Very Fine', 'Unmounted mint') rather than canonical.
alter table objects add column if not exists condition_canonical text;

alter table objects drop constraint if exists objects_condition_canonical_check;
alter table objects add constraint objects_condition_canonical_check
  check (condition_canonical is null
         or condition_canonical in ('Excellent', 'Good', 'Fair', 'Poor', 'Critical'));

comment on column objects.condition_canonical is
  'condition_grade mapped onto the canonical five-point scale. Null where no mapping exists. Display always uses condition_grade.';

-- Backfill the unambiguous cases. Everything else is left null on purpose:
-- a wrong canonical value is worse than an absent one, and the profile-aware
-- mapping in lib/collectionProfiles/scales.ts handles the rest on next write.
update objects set condition_canonical = 'Excellent'
  where condition_canonical is null and condition_grade in
    ('Excellent', 'Mint', 'Mint / Unworn', 'Uncirculated', 'Unmounted mint',
     'Mint reproduction', 'Exceptional', 'Gem Mint');
update objects set condition_canonical = 'Good'
  where condition_canonical is null and condition_grade in
    ('Good', 'Very Good', 'Near Mint', 'About Uncirculated', 'Extremely Fine',
     'Very Fine', 'Good Very Fine', 'Very Fine used', 'Good used', 'Excellent (worn)');
update objects set condition_canonical = 'Fair'
  where condition_canonical is null and condition_grade in
    ('Fair', 'Fine', 'Fine used', 'Fair used', 'Played With', 'Very Fine (regummed)');
update objects set condition_canonical = 'Poor'
  where condition_canonical is null and condition_grade in ('Poor', 'Degraded');
update objects set condition_canonical = 'Critical'
  where condition_canonical is null and condition_grade in ('Critical');

-- ── per-template options ──────────────────────────────────────────────────
-- One jsonb bag rather than a column per lever, so adding a template does not
-- mean adding a migration. Keys are namespaced by template id.
alter table museums add column if not exists template_options jsonb not null default '{}'::jsonb;

comment on column museums.template_options is
  'Per-template settings, keyed by template id. See TemplateOption in lib/templates.ts.';
