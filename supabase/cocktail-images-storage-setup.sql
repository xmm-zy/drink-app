insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cocktail-images',
  'cocktail-images',
  true,
  5242880,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists cocktail_images_public_read on storage.objects;
drop policy if exists cocktail_images_auth_insert on storage.objects;
drop policy if exists cocktail_images_auth_delete on storage.objects;

create policy cocktail_images_auth_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cocktail-images'
  and owner = (select auth.uid())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy cocktail_images_auth_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'cocktail-images'
  and (
    owner = (select auth.uid())
    or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
);
