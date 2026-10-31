-- "initials" (default), "man", or "woman" — which standard avatar the user
-- picked for their account.
alter table public.profiles add column if not exists avatar_type text;
