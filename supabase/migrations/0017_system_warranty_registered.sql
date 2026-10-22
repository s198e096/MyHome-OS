-- Tracks whether the user has registered the system's product with its
-- manufacturer/vendor (often required or recommended to keep a warranty
-- valid). One flag per system, not per warranty entry, since registration
-- is done for the product itself.
-- Run this once in the Supabase SQL Editor.

alter table public.systems add column if not exists warranty_registered boolean not null default false;
