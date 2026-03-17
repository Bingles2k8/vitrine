-- Add hazard_note to objects table for denormalized access from collections list
alter table objects add column if not exists hazard_note text;
