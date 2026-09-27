-- Caches RentCast responses by address so repeated lookups (e.g. testing the
-- onboarding flow against the same address) never re-hit RentCast's
-- quota-limited API. Not user-specific data (real-estate facts are the same
-- for everyone), so no RLS policy is added — only the property-lookup edge
-- function's service-role key can read/write it; ordinary clients get no
-- access at all.
create table if not exists public.property_lookup_cache (
  address text primary key,
  response jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.property_lookup_cache enable row level security;
