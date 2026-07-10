-- Run this in Supabase Dashboard -> SQL Editor to enable synced stories forum.

create table if not exists public.stories_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 60),
  body text not null check (char_length(body) between 1 and 500),
  category text not null check (category in ('bar', 'recipe', 'city', 'memory')),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null default '',
  user_name text not null default 'Member',
  user_avatar text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.stories_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.stories_posts(id) on delete cascade,
  parent_reply_id uuid references public.stories_replies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null default '',
  user_name text not null default 'Member',
  user_avatar text not null default '',
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now()
);

create table if not exists public.stories_post_likes (
  post_id uuid not null references public.stories_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.stories_post_favorites (
  post_id uuid not null references public.stories_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.stories_reply_likes (
  reply_id uuid not null references public.stories_replies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reply_id, user_id)
);

alter table public.stories_posts add column if not exists user_name text not null default 'Member';
alter table public.stories_posts add column if not exists user_avatar text not null default '';
alter table public.stories_replies add column if not exists user_name text not null default 'Member';
alter table public.stories_replies add column if not exists user_avatar text not null default '';

create index if not exists stories_posts_created_at_idx
  on public.stories_posts (created_at desc);

create index if not exists stories_replies_post_id_idx
  on public.stories_replies (post_id);

create index if not exists stories_replies_parent_reply_id_idx
  on public.stories_replies (parent_reply_id);

alter table public.stories_posts enable row level security;
alter table public.stories_replies enable row level security;
alter table public.stories_post_likes enable row level security;
alter table public.stories_post_favorites enable row level security;
alter table public.stories_reply_likes enable row level security;

drop policy if exists stories_posts_select on public.stories_posts;
drop policy if exists stories_posts_insert on public.stories_posts;
drop policy if exists stories_replies_select on public.stories_replies;
drop policy if exists stories_replies_insert on public.stories_replies;
drop policy if exists stories_post_likes_select on public.stories_post_likes;
drop policy if exists stories_post_likes_insert on public.stories_post_likes;
drop policy if exists stories_post_likes_delete on public.stories_post_likes;
drop policy if exists stories_post_favorites_select on public.stories_post_favorites;
drop policy if exists stories_post_favorites_insert on public.stories_post_favorites;
drop policy if exists stories_post_favorites_delete on public.stories_post_favorites;
drop policy if exists stories_reply_likes_select on public.stories_reply_likes;
drop policy if exists stories_reply_likes_insert on public.stories_reply_likes;
drop policy if exists stories_reply_likes_delete on public.stories_reply_likes;

create policy stories_posts_select
  on public.stories_posts for select
  using (true);

create policy stories_posts_insert
  on public.stories_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy stories_replies_select
  on public.stories_replies for select
  using (true);

create policy stories_replies_insert
  on public.stories_replies for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy stories_post_likes_select
  on public.stories_post_likes for select
  using (true);

create policy stories_post_likes_insert
  on public.stories_post_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy stories_post_likes_delete
  on public.stories_post_likes for delete
  to authenticated
  using (auth.uid() = user_id);

create policy stories_post_favorites_select
  on public.stories_post_favorites for select
  using (true);

create policy stories_post_favorites_insert
  on public.stories_post_favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy stories_post_favorites_delete
  on public.stories_post_favorites for delete
  to authenticated
  using (auth.uid() = user_id);

create policy stories_reply_likes_select
  on public.stories_reply_likes for select
  using (true);

create policy stories_reply_likes_insert
  on public.stories_reply_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy stories_reply_likes_delete
  on public.stories_reply_likes for delete
  to authenticated
  using (auth.uid() = user_id);
