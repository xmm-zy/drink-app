-- Run this in Supabase Dashboard -> SQL Editor if reviews / review_likes are missing.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  cocktail_name text not null,
  cocktail_zh_name text not null default '',
  rating numeric(3,1) not null check (rating >= 0 and rating <= 10),
  comment text not null check (char_length(comment) <= 500),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null default '',
  user_name text not null default 'Member',
  user_avatar text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.review_likes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

alter table public.reviews add column if not exists user_name text not null default 'Member';
alter table public.reviews add column if not exists user_avatar text not null default '';

create index if not exists reviews_cocktail_name_idx on public.reviews (cocktail_name);
create index if not exists review_likes_review_id_idx on public.review_likes (review_id);

alter table public.reviews enable row level security;
alter table public.review_likes enable row level security;

drop policy if exists reviews_select on public.reviews;
drop policy if exists reviews_insert on public.reviews;
drop policy if exists reviews_delete on public.reviews;
drop policy if exists review_likes_select on public.review_likes;
drop policy if exists review_likes_insert on public.review_likes;
drop policy if exists review_likes_delete on public.review_likes;

create policy reviews_select on public.reviews for select using (true);
create policy reviews_insert on public.reviews for insert with check (auth.uid() = user_id);
create policy reviews_delete on public.reviews for delete using (auth.uid() = user_id);

create policy review_likes_select on public.review_likes for select using (true);
create policy review_likes_insert on public.review_likes for insert with check (auth.uid() = user_id);
create policy review_likes_delete on public.review_likes for delete using (auth.uid() = user_id);
