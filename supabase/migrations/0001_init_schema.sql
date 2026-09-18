-- MyHome OS: per-user data tables with Row Level Security.
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query).

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  name text not null default '',
  address text not null default '',
  property_value numeric,
  property_value_source text,
  plan text not null default 'free',
  updated_at timestamptz not null default now()
);

create table if not exists public.systems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  brand text,
  model text,
  category text,
  location text,
  purchase_date date,
  purchase_price numeric,
  expected_life_years integer,
  replacement_cost numeric,
  warranty_expiration date,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  system_id uuid references public.systems(id) on delete set null,
  title text not null,
  due_date date,
  completed boolean not null default false,
  duration text,
  difficulty text,
  reopened_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  system_id uuid references public.systems(id) on delete set null,
  amount numeric not null,
  date date not null,
  category text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  system_id uuid references public.systems(id) on delete set null,
  type text,
  label text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.furniture (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text,
  room text,
  value numeric,
  note text,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.systems enable row level security;
alter table public.tasks enable row level security;
alter table public.expenses enable row level security;
alter table public.documents enable row level security;
alter table public.furniture enable row level security;

create policy "Users manage their own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own systems" on public.systems
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own expenses" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own documents" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own furniture" on public.furniture
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
