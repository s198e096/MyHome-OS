-- The planned-replacement feature (and its UI) has been removed from the
-- app; this column is no longer read or written anywhere.
alter table public.systems drop column if exists planned_replacement_date;
