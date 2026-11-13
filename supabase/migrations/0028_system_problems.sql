-- A log of problems a user reports against a system (via the "Report a
-- problem" flow on Home), so each system shows a running tally and history
-- of what's gone wrong — and so the AI assistant has that history as
-- context the next time the user chats about the same system.

create table if not exists public.system_problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  system_id uuid not null references public.systems(id) on delete cascade,
  description text not null,
  created_at timestamptz not null default now()
);

alter table public.system_problems enable row level security;

create policy "Users manage their own system problems" on public.system_problems
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
