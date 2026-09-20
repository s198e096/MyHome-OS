-- Enforces the Free plan's system limit at the database level (the
-- frontend also checks this for a better UX, but this is the real
-- backstop so it can't be bypassed by calling the API directly).
create or replace function public.enforce_free_system_limit()
returns trigger as $$
declare
  user_plan text;
  system_count integer;
begin
  select plan into user_plan from public.profiles where user_id = new.user_id;

  if user_plan is null or user_plan = 'free' then
    select count(*) into system_count from public.systems where user_id = new.user_id;
    if system_count >= 10 then
      raise exception 'Free plan is limited to 10 systems. Upgrade to add more.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists enforce_free_system_limit_trigger on public.systems;
create trigger enforce_free_system_limit_trigger
  before insert on public.systems
  for each row execute function public.enforce_free_system_limit();
