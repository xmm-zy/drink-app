-- Run this in Supabase SQL Editor to enable realtime multiplayer rooms.

create table if not exists public.games_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique check (char_length(room_code) between 4 and 12),
  game_type text not null check (game_type in ('doudizhu', 'zhajinhua')),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  host_name text not null default 'Member',
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'closed')),
  max_players int not null default 4,
  game_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.games_rooms add column if not exists game_state jsonb not null default '{}'::jsonb;

alter table public.games_rooms
  drop constraint if exists games_rooms_max_players_by_game_check;

alter table public.games_rooms
  add constraint games_rooms_max_players_by_game_check
  check (
    (game_type = 'doudizhu' and max_players between 2 and 4)
    or (game_type = 'zhajinhua' and max_players between 2 and 6)
  );

create table if not exists public.games_room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.games_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null default 'Member',
  user_avatar text not null default '',
  is_ready boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create table if not exists public.games_room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.games_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null default 'Member',
  content text not null check (char_length(content) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists games_rooms_created_at_idx on public.games_rooms (created_at desc);
create index if not exists games_room_members_room_id_idx on public.games_room_members (room_id);
create index if not exists games_room_messages_room_id_idx on public.games_room_messages (room_id, created_at);

alter table public.games_rooms enable row level security;
alter table public.games_room_members enable row level security;
alter table public.games_room_messages enable row level security;

drop policy if exists games_rooms_select on public.games_rooms;
drop policy if exists games_rooms_insert on public.games_rooms;
drop policy if exists games_rooms_update_host on public.games_rooms;
drop policy if exists games_room_members_select on public.games_room_members;
drop policy if exists games_room_members_insert on public.games_room_members;
drop policy if exists games_room_members_update_self on public.games_room_members;
drop policy if exists games_room_members_delete_self on public.games_room_members;
drop policy if exists games_room_messages_select on public.games_room_messages;
drop policy if exists games_room_messages_insert on public.games_room_messages;

create policy games_rooms_select
  on public.games_rooms for select
  using (true);

create policy games_rooms_insert
  on public.games_rooms for insert
  to authenticated
  with check (auth.uid() = host_user_id);

create policy games_rooms_update_host
  on public.games_rooms for update
  to authenticated
  using (auth.uid() = host_user_id)
  with check (auth.uid() = host_user_id);

drop policy if exists games_rooms_delete_host on public.games_rooms;
create policy games_rooms_delete_host
  on public.games_rooms for delete
  to authenticated
  using (auth.uid() = host_user_id);

drop policy if exists games_rooms_delete_host on public.games_rooms;
create policy games_rooms_delete_host
  on public.games_rooms for delete
  to authenticated
  using (auth.uid() = host_user_id);

drop policy if exists games_rooms_delete_host on public.games_rooms;
create policy games_rooms_delete_host
  on public.games_rooms for delete
  to authenticated
  using (auth.uid() = host_user_id);

create policy games_room_members_select
  on public.games_room_members for select
  using (true);

create policy games_room_members_insert
  on public.games_room_members for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy games_room_members_update_self
  on public.games_room_members for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy games_room_members_delete_self
  on public.games_room_members for delete
  to authenticated
  using (auth.uid() = user_id);

create policy games_room_messages_select
  on public.games_room_messages for select
  using (true);

create policy games_room_messages_insert
  on public.games_room_messages for insert
  to authenticated
  with check (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'games_rooms'
  ) then
    execute 'alter publication supabase_realtime add table public.games_rooms';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'games_room_members'
  ) then
    execute 'alter publication supabase_realtime add table public.games_room_members';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'games_room_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.games_room_messages';
  end if;
end $$;

-- Dou Dizhu / lobby bot persistence
alter table public.games_rooms
  add column if not exists game_state jsonb not null default '{}'::jsonb;

drop policy if exists games_rooms_update_member_state on public.games_rooms;
create policy games_rooms_update_member_state
  on public.games_rooms for update
  to authenticated
  using (
    exists (
      select 1 from public.games_room_members m
      where m.room_id = games_rooms.id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.games_room_members m
      where m.room_id = games_rooms.id
        and m.user_id = auth.uid()
    )
  );

create or replace function public.games_rooms_member_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if auth.uid() = new.host_user_id then
    return new;
  end if;
  if old.room_code is distinct from new.room_code
     or old.game_type is distinct from new.game_type
     or old.host_user_id is distinct from new.host_user_id
     or old.host_name is distinct from new.host_name
     or old.status is distinct from new.status
     or old.max_players is distinct from new.max_players
  then
    raise exception 'room members may only update game_state';
  end if;
  return new;
end;
$$;

drop trigger if exists games_rooms_member_update_guard_trg on public.games_rooms;
create trigger games_rooms_member_update_guard_trg
  before update on public.games_rooms
  for each row
  execute function public.games_rooms_member_update_guard();

