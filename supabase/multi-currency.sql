-- #8 Multi-currency display + FX rate cache.

-- Per-museum choice of display currencies. First entry = base currency.
alter table museums
  add column if not exists display_currencies text[] default array['GBP'];

-- Cached FX rates (base -> quote). Refreshed daily by the fx-sync cron.
create table if not exists fx_rates (
  base text not null,
  quote text not null,
  rate numeric(18, 8) not null,
  fetched_at timestamptz not null default now(),
  primary key (base, quote)
);

create index if not exists fx_rates_fetched_at_idx on fx_rates (fetched_at desc);

alter table fx_rates enable row level security;

-- Everyone authenticated can read rates (non-sensitive data).
drop policy if exists "fx_rates read" on fx_rates;
create policy "fx_rates read"
  on fx_rates for select
  to authenticated, anon
  using (true);

-- Writes are service-role only (cron job); no policy for insert/update means blocked by default.
