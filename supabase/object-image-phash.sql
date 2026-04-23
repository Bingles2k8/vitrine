-- Automatic duplicate detection on entry (#7)
-- Adds a 64-bit perceptual hash (dHash) column to object_images so we can
-- cheaply find near-duplicate photos via Hamming distance on a bit(64) XOR.
--
-- Run this in the Supabase SQL editor.

alter table object_images
  add column if not exists phash bit(64);

-- Partial index: only rows with a phash are candidates for dupe-lookup.
create index if not exists object_images_phash_idx
  on object_images (museum_id)
  where phash is not null;

-- Returns up to p_limit distinct object matches whose closest image has a
-- Hamming distance <= p_threshold to p_phash. Distance 0 = identical hash.
-- 8 is a conservative "looks similar" threshold for 64-bit dHash.
create or replace function find_similar_object_images(
  p_museum_id uuid,
  p_phash bit(64),
  p_threshold int default 8,
  p_limit int default 5,
  p_exclude_object_id uuid default null
) returns table (
  object_id uuid,
  url text,
  distance int,
  title text,
  accession_no text,
  emoji text
)
language sql
stable
as $$
  with ranked as (
    select
      oi.object_id,
      oi.url,
      bit_count(oi.phash # p_phash)::int as distance,
      o.title,
      o.accession_no,
      o.emoji,
      row_number() over (
        partition by oi.object_id
        order by bit_count(oi.phash # p_phash) asc
      ) as rn
    from object_images oi
    join objects o on o.id = oi.object_id
    where oi.museum_id = p_museum_id
      and oi.phash is not null
      and o.deleted_at is null
      and (p_exclude_object_id is null or oi.object_id <> p_exclude_object_id)
      and bit_count(oi.phash # p_phash) <= p_threshold
  )
  select object_id, url, distance, title, accession_no, emoji
  from ranked
  where rn = 1
  order by distance asc
  limit p_limit;
$$;
