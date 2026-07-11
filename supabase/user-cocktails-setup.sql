create table if not exists public.user_cocktails (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  zh_name text not null check (char_length(zh_name) between 1 and 40),
  category text not null check (category in ('classic', 'signature', 'nonalcoholic')),
  base text not null check (base in ('whiskey', 'tequila', 'gin', 'rum', 'vodka', 'none')),
  image text not null default '' check (char_length(image) <= 500),
  naming text not null check (char_length(naming) between 10 and 300),
  story text not null check (char_length(story) between 20 and 800),
  profile text not null check (char_length(profile) between 5 and 200),
  method text not null check (char_length(method) between 2 and 80),
  ingredients text[] not null check (cardinality(ingredients) between 2 and 12),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null default 'Member',
  created_at timestamptz not null default now()
);

create unique index if not exists user_cocktails_name_unique_idx
  on public.user_cocktails (lower(name));

create index if not exists user_cocktails_created_at_idx
  on public.user_cocktails (created_at desc);

create index if not exists user_cocktails_user_id_idx
  on public.user_cocktails (user_id);

alter table public.user_cocktails enable row level security;

drop policy if exists user_cocktails_select on public.user_cocktails;
create policy user_cocktails_select
on public.user_cocktails
for select
to anon, authenticated
using (true);

drop policy if exists user_cocktails_insert on public.user_cocktails;
create policy user_cocktails_insert
on public.user_cocktails
for insert
to authenticated
with check ((select auth.uid()) = user_id);

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
