-- Supports multiple named warranty coverages per system (e.g. "Parts" vs.
-- "Labor" vs. "Compressor"), since a single systems.warranty_expiration
-- date can't represent more than one. systems.warranty_expiration is kept
-- as-is for backward compatibility (the app sets it to the latest/longest
-- of a system's warranties, as a single summary figure).
-- Run this once in the Supabase SQL Editor.

create table if not exists public.warranties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  system_id uuid not null references public.systems(id) on delete cascade,
  warranty_type text not null,
  expiration_date date,
  estimated boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.warranties enable row level security;

create policy "Users manage their own warranties" on public.warranties
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
