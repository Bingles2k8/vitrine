-- Personal loan tracker (#6): lightweight "lent to a friend / family member".
-- Distinct from the compliance `loans` table (museum→institution formal loans).
-- Run in the Supabase SQL editor.

create table if not exists personal_loans (
  id uuid primary key default gen_random_uuid(),
  museum_id uuid not null references museums(id) on delete cascade,
  object_id uuid not null references objects(id) on delete cascade,
  borrower_name text not null,
  borrower_contact text,
  lent_on date not null,
  due_back date,
  returned_on date,
  note text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists personal_loans_museum_idx on personal_loans (museum_id);
create index if not exists personal_loans_object_idx on personal_loans (object_id);
create index if not exists personal_loans_open_idx on personal_loans (museum_id, returned_on)
  where returned_on is null;
create index if not exists personal_loans_due_idx on personal_loans (due_back)
  where returned_on is null and reminder_sent_at is null;

alter table personal_loans enable row level security;

-- Museum owner: full access to own museum's rows
create policy personal_loans_owner_select on personal_loans for select
  using (museum_id in (select id from museums where owner_id = auth.uid()));
create policy personal_loans_owner_insert on personal_loans for insert
  with check (museum_id in (select id from museums where owner_id = auth.uid()));
create policy personal_loans_owner_update on personal_loans for update
  using (museum_id in (select id from museums where owner_id = auth.uid()));
create policy personal_loans_owner_delete on personal_loans for delete
  using (museum_id in (select id from museums where owner_id = auth.uid()));

-- Staff Admin/Editor: same access for museums they work in
create policy personal_loans_staff_select on personal_loans for select
  using (museum_id in (select museum_id from staff_members where user_id = auth.uid()));
create policy personal_loans_staff_write on personal_loans for all
  using (museum_id in (select museum_id from staff_members where user_id = auth.uid() and access in ('Admin','Editor')))
  with check (museum_id in (select museum_id from staff_members where user_id = auth.uid() and access in ('Admin','Editor')));
