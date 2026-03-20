-- Add open_entry flag to event_time_slots
-- When true, tickets can be purchased after the start time (until end time).
-- Useful for exhibitions and other open-entry events.
ALTER TABLE event_time_slots
  ADD COLUMN IF NOT EXISTS open_entry boolean NOT NULL DEFAULT false;
