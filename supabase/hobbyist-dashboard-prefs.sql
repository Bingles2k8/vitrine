-- Hobbyist & Community tier dashboard preferences.
-- Run this in the Supabase SQL editor.

alter table museums
  add column if not exists hide_money_values boolean not null default false,
  add column if not exists header_image_zoom numeric not null default 1.0;
