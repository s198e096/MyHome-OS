-- Links a document (e.g. a receipt photo attached while completing a task)
-- back to the task it came from, so undoing that completion can find and
-- remove exactly that document rather than guessing by label/type.
alter table public.documents add column if not exists task_id uuid references public.tasks(id) on delete set null;
