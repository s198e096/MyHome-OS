alter table public.profiles add column if not exists property_name text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;

-- Existing accounts have already set up their property through the old flow;
-- only new signups (created after this migration) should see onboarding.
update public.profiles set onboarding_completed = true where onboarding_completed = false;
