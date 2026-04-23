-- #10 Origin geography for timeline & map views.

alter table objects
  add column if not exists origin_country text,
  add column if not exists origin_place text,
  add column if not exists origin_lat numeric(9, 6),
  add column if not exists origin_lng numeric(9, 6);

create index if not exists objects_museum_origin_country_idx
  on objects (museum_id, origin_country)
  where origin_country is not null;

create index if not exists objects_museum_origin_geo_idx
  on objects (museum_id)
  where origin_lat is not null and origin_lng is not null;
