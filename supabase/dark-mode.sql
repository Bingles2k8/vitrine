-- Add dark mode setting to museums table
alter table museums add column if not exists dark_mode boolean default false;
