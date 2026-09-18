-- Storage bucket for furniture/document/system photos.
-- Public bucket with unguessable per-user paths: anyone with the exact URL
-- can view a photo, but only the owning user can upload/replace/delete it.
-- Run this once in the Supabase SQL Editor, after 0001_init_schema.sql.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Users upload to their own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users update their own files" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete their own files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view photos" on storage.objects
  for select to public
  using (bucket_id = 'photos');
