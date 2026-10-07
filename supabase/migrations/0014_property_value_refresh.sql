-- Tracks when a profile's home value was last refreshed, and schedules the
-- monthly RentCast re-pull (refresh-property-values edge function) that
-- keeps it current. Run this once in the Supabase SQL Editor.

alter table public.profiles add column if not exists property_value_updated_at timestamptz;

-- One-time setup for the monthly schedule below (do this before running the
-- cron.schedule call):
--   1. Database -> Extensions -> enable "pg_cron" and "pg_net".
--   2. In the SQL Editor, store your project URL and service role key in
--      Vault (Project Settings -> API for the key; never commit it):
--        select vault.create_secret('https://<your-project-ref>.supabase.co', 'project_url');
--        select vault.create_secret('<your-service-role-key>', 'service_role_key');
--      The service role key is used (not the anon key) because this job
--      writes to every account's profile, so only a request carrying it
--      should be able to trigger the function.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'refresh-property-values-monthly',
  '0 6 1 * *', -- 06:00 UTC on the 1st of every month
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/refresh-property-values',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
