-- Complete user cocktail CRUD support and harden the associated image bucket.
-- This script is idempotent and safe to apply after user-cocktails-setup.sql
-- and cocktail-images-storage-setup.sql.

alter table public.user_cocktails
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_user_cocktails_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_cocktails_set_updated_at on public.user_cocktails;
create trigger user_cocktails_set_updated_at
before update on public.user_cocktails
for each row execute function public.set_user_cocktails_updated_at();

alter table public.user_cocktails enable row level security;

drop policy if exists user_cocktails_update on public.user_cocktails;
create policy user_cocktails_update
on public.user_cocktails
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists user_cocktails_delete on public.user_cocktails;
create policy user_cocktails_delete
on public.user_cocktails
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists cocktail_images_public_read on storage.objects;

drop policy if exists cocktail_images_auth_insert on storage.objects;
create policy cocktail_images_auth_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cocktail-images'
  and owner = (select auth.uid())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists cocktail_images_auth_delete on storage.objects;
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
