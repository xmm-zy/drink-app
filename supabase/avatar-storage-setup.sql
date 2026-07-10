-- Run this in Supabase SQL Editor to enable avatar uploads from client.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  3145728,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_public_read on storage.objects;
drop policy if exists avatars_auth_insert on storage.objects;
drop policy if exists avatars_auth_update on storage.objects;
drop policy if exists avatars_auth_delete on storage.objects;

create policy avatars_public_read
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy avatars_auth_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and owner = auth.uid());

create policy avatars_auth_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid())
  with check (bucket_id = 'avatars' and owner = auth.uid());

create policy avatars_auth_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid());
