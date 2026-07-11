begin;

-- Administrator identity is stored in app_metadata because users cannot edit it
-- from the browser. The user must sign in again after this change to refresh JWT.
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
where lower(email) = lower('17622609612@163.com');

do $$
begin
  if not exists (
    select 1
    from auth.users
    where lower(email) = lower('17622609612@163.com')
  ) then
    raise exception 'Administrator account does not exist';
  end if;
end
$$;

drop policy if exists reviews_delete on public.reviews;
create policy reviews_delete
on public.reviews
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists stories_posts_delete on public.stories_posts;
create policy stories_posts_delete
on public.stories_posts
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists stories_replies_delete on public.stories_replies;
create policy stories_replies_delete
on public.stories_replies
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

commit;
