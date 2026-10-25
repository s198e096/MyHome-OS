-- Archiving replaces deleting when a system is upgraded: the old system
-- stays around for its history (documents, past tasks/expenses) but drops
-- out of active lists and pickers.
alter table public.systems add column if not exists archived boolean not null default false;
