-- systems.photo_url was missing from the original schema, so photos
-- attached to a system silently failed to save.
alter table public.systems add column if not exists photo_url text;
