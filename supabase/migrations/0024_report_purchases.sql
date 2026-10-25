-- One row per paid PDF report purchase (the "Home Sale" report and the
-- "Insurance inventory report"). A purchase lets that user generate and
-- re-download that report until expires_at (30 days after purchase).
--
-- Only the Stripe webhook (service role) writes here, after a payment really
-- completes. Users can read their own rows but cannot insert, update or delete
-- them, so nobody can grant themselves a report from the app.
-- Run this once in the Supabase SQL Editor.

create table if not exists public.report_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null check (report_type in ('home_sale', 'insurance_inventory')),
  -- Stripe Checkout Session id; unique so a retried webhook can't record a
  -- purchase twice.
  stripe_session_id text not null unique,
  amount_cents integer,
  purchased_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists report_purchases_user_idx on public.report_purchases (user_id, report_type, expires_at desc);

alter table public.report_purchases enable row level security;

create policy "Users read their own report purchases" on public.report_purchases
  for select using (auth.uid() = user_id);
