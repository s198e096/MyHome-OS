-- Makes the Free vs. paid plans real, server-side.
--
--   1. Locks profiles.plan (and the Stripe ids) so a signed-in user can no
--      longer set them from the app. Until now the profiles RLS policy let a
--      user update their own whole row, so anyone could have written
--      plan = 'lifetime' to themselves with a single API call. Only the
--      Stripe webhook / checkout functions (service role) and the SQL editor
--      can change them now.
--   2. Counts AI use, so the Free plan's limits are enforced where they can't
--      be bypassed (the AI calls cost real money):
--        - "chat": the Ask Anything assistant — 10 questions per rolling
--          24 hours on Free.
--        - "fill": AI auto-fill (system-label scan and receipt/warranty scan
--          share one pool) — 10 in total on Free.
--      Paid plans (anything other than 'free') are unlimited and aren't
--      counted at all.
--   3. Makes the 10-system Free limit ignore archived systems, matching what
--      the app already shows (archiving replaces deleting when a system is
--      upgraded, so an archived system shouldn't use up a Free slot).
--
-- Run this once in the Supabase SQL Editor. Then redeploy the three edge
-- functions that call claim_ai_use: ask-assistant, scan-system-label and
-- scan-warranty-docs.

-- 1. Billing columns are service-role only ------------------------------------
create or replace function public.protect_billing_columns()
returns trigger as $$
begin
  -- Requests made with a user's login arrive as 'authenticated' (or 'anon');
  -- the Stripe webhook / checkout functions use the service role, and the SQL
  -- editor has no request role at all. Only the first group is restricted.
  if coalesce(auth.role(), '') not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.plan := 'free';
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
  else
    -- Quietly keep the stored values rather than raising an error, so a
    -- stale copy of the profile in the app (e.g. saved just after a purchase
    -- completed) can never overwrite the plan either.
    new.plan := old.plan;
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_billing_columns_trigger on public.profiles;
create trigger protect_billing_columns_trigger
  before insert or update on public.profiles
  for each row execute function public.protect_billing_columns();

-- 2. AI usage counting --------------------------------------------------------
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('chat', 'fill')),
  used_at timestamptz not null default now()
);

create index if not exists ai_usage_user_kind_idx on public.ai_usage (user_id, kind, used_at desc);

alter table public.ai_usage enable row level security;

-- Users can read their own usage (the app shows "N questions left"), but only
-- the edge functions (service role) can write it.
drop policy if exists "Users read their own AI usage" on public.ai_usage;
create policy "Users read their own AI usage" on public.ai_usage
  for select using (auth.uid() = user_id);

-- Called by the AI edge functions before they spend money. Checks the user's
-- plan and, on Free, either records one more use or refuses.
--   -> { allowed: true,  unlimited: true }                      paid plan
--   -> { allowed: true,  limit, used, claimId }                 recorded
--   -> { allowed: false, limit, used, resetsAt }                over the limit
-- resetsAt is when the oldest counted question ages out (chat only; the
-- AI auto-fill allowance doesn't reset, so it is null for "fill").
create or replace function public.claim_ai_use(p_user_id uuid, p_kind text)
returns jsonb as $$
declare
  v_plan text;
  v_limit constant integer := 10;
  v_used integer;
  v_oldest timestamptz;
  v_id uuid;
begin
  if p_kind not in ('chat', 'fill') then
    raise exception 'Unknown AI usage kind: %', p_kind;
  end if;

  select plan into v_plan from public.profiles where user_id = p_user_id;
  if v_plan is not null and v_plan <> 'free' then
    return jsonb_build_object('allowed', true, 'unlimited', true);
  end if;

  -- Serialize this user's claims so two requests sent at once can't both slip
  -- in under the limit.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_kind, 0));

  if p_kind = 'chat' then
    select count(*), min(used_at) into v_used, v_oldest
      from public.ai_usage
      where user_id = p_user_id and kind = 'chat' and used_at > now() - interval '24 hours';
  else
    select count(*), null::timestamptz into v_used, v_oldest
      from public.ai_usage
      where user_id = p_user_id and kind = 'fill';
  end if;

  if v_used >= v_limit then
    return jsonb_build_object(
      'allowed', false,
      'limit', v_limit,
      'used', v_used,
      'resetsAt', case when v_oldest is null then null else v_oldest + interval '24 hours' end
    );
  end if;

  insert into public.ai_usage (user_id, kind) values (p_user_id, p_kind) returning id into v_id;
  return jsonb_build_object('allowed', true, 'limit', v_limit, 'used', v_used + 1, 'claimId', v_id);
end;
$$ language plpgsql security definer set search_path = public;

-- Edge functions only: a user must not be able to call this themselves.
revoke all on function public.claim_ai_use(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_ai_use(uuid, text) to service_role;

-- 3. The system limit counts active systems only ------------------------------
create or replace function public.enforce_free_system_limit()
returns trigger as $$
declare
  user_plan text;
  system_count integer;
begin
  select plan into user_plan from public.profiles where user_id = new.user_id;

  if user_plan is null or user_plan = 'free' then
    select count(*) into system_count from public.systems where user_id = new.user_id and not archived;
    if system_count >= 10 then
      raise exception 'Free plan is limited to 10 systems. Upgrade to add more.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
