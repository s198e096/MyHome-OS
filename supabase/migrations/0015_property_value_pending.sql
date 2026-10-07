-- Protects a manually-entered home value from being silently overwritten by
-- the monthly RentCast refresh (refresh-property-values). When a profile's
-- property_value_source is 'Manual', the refresh job parks the new estimate
-- here instead of applying it, and the app prompts the user to keep their
-- own number or accept the refreshed one. Run this once in the Supabase SQL
-- Editor (after 0014_property_value_refresh.sql).

alter table public.profiles add column if not exists property_value_pending numeric;
alter table public.profiles add column if not exists property_value_pending_fetched_at timestamptz;
