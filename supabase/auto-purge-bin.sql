-- Auto-purge objects from the bin after 90 days
-- Requires pg_cron extension (enabled by default on Supabase)
-- Run this in Supabase Dashboard → SQL Editor

SELECT cron.schedule(
  'purge-deleted-objects',   -- job name
  '0 3 * * *',               -- daily at 03:00 UTC
  $$
    DELETE FROM objects
    WHERE deleted_at IS NOT NULL
      AND deleted_at < now() - interval '90 days';
  $$
);
