-- Self-reported energy audit checklist items (the 2 automatic checks are
-- computed client-side from existing system data and are not stored here).
create table if not exists public.energy_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  key text not null,
  label text not null,
  status text not null default 'unknown' check (status in ('pass', 'fail', 'unknown')),
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.energy_checks enable row level security;

create policy "Users manage their own energy checks" on public.energy_checks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
