-- Lets a task repeat (weekly/monthly/quarterly/semiannually/annually).
-- Null means one-time, same as every existing task. When a recurring task
-- is marked complete, the app inserts the next occurrence as a new row
-- rather than mutating this one, so completed history stays intact.
-- Run this once in the Supabase SQL Editor.

alter table public.tasks add column if not exists recurrence text;
