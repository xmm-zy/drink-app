create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  cocktail_name text not null,
  cocktail_zh_name text,
  rating numeric(3, 1) not null check (rating >= 0 and rating <= 10),
  comment text not null check (char_length(comment) <= 500),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  user_name text not null default 'Member',
  user_avatar text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists reviews_cocktail_name_created_at_idx
  on public.reviews (cocktail_name, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews"
  on public.reviews for select
  using (true);

drop policy if exists "Users can create own reviews" on public.reviews;
create policy "Users can create own reviews"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reviews" on public.reviews;
create policy "Users can delete own reviews"
  on public.reviews for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.review_likes (
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create index if not exists review_likes_review_id_idx
  on public.review_likes (review_id);

alter table public.review_likes enable row level security;

drop policy if exists "Anyone can read review likes" on public.review_likes;
create policy "Anyone can read review likes"
  on public.review_likes for select
  using (true);

drop policy if exists "Users can like reviews" on public.review_likes;
create policy "Users can like reviews"
  on public.review_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove own likes" on public.review_likes;
create policy "Users can remove own likes"
  on public.review_likes for delete
  to authenticated
  using (auth.uid() = user_id);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  cocktail_name text not null,
  cocktail_zh_name text,
  rating numeric(3, 1) not null check (rating >= 0 and rating <= 10),
  comment text not null check (char_length(comment) <= 500),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
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

alter table public.reviews enable row level security;
alter table public.review_likes enable row level security;

create policy "Reviews are readable by everyone"
  on public.reviews for select
  using (true);

create policy "Users can create their own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

create policy "Likes are readable by everyone"
  on public.review_likes for select
  using (true);

create policy "Users can like as themselves"
  on public.review_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own likes"
  on public.review_likes for delete
  using (auth.uid() = user_id);
