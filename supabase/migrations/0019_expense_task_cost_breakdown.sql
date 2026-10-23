-- Links an expense back to the task it was logged for (when completing a
-- task prompts for a cost), and stores the cost breakdown: parts vs labor,
-- whether it was DIY (with time spent) or a hired vendor (with their name,
-- so it's easy to remember who to call again).
-- Run this once in the Supabase SQL Editor.

alter table public.expenses
  add column if not exists task_id uuid references public.tasks(id) on delete set null,
  add column if not exists parts_cost numeric,
  add column if not exists labor_cost numeric,
  add column if not exists diy boolean,
  add column if not exists time_spent_hours numeric,
  add column if not exists vendor text;
