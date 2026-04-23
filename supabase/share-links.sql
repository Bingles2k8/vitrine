-- #4 Private passcode-protected share links.

create table if not exists object_share_links (
  id uuid primary key default gen_random_uuid(),
  museum_id uuid not null references museums(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  label text,
  scope_filter jsonb not null default '{}'::jsonb,
  passcode_hash text not null,
  passcode_salt text not null,
  expires_at timestamptz,
  max_views integer,
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists object_share_links_museum_active_idx
  on object_share_links (museum_id)
  where revoked_at is null;

alter table object_share_links enable row level security;

-- Owners manage their museum's share links.
drop policy if exists "share_links owner manage" on object_share_links;
create policy "share_links owner manage"
  on object_share_links
  for all
  to authenticated
  using (museum_id in (select id from museums where owner_id = auth.uid()))
  with check (museum_id in (select id from museums where owner_id = auth.uid()));

-- Editor/Admin staff may also manage.
drop policy if exists "share_links staff manage" on object_share_links;
create policy "share_links staff manage"
  on object_share_links
  for all
  to authenticated
  using (museum_id in (
    select museum_id from staff_members
    where user_id = auth.uid() and access in ('Admin', 'Editor')
  ))
  with check (museum_id in (
    select museum_id from staff_members
    where user_id = auth.uid() and access in ('Admin', 'Editor')
  ));

-- No anon select — the unlock endpoint reads via service role after
-- validating the passcode.
