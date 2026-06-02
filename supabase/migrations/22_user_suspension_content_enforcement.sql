create or replace function public.prevent_suspended_user_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null and public.is_user_currently_suspended(new.user_id) then
    raise exception 'suspended users cannot create content';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_suspended_user_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null and public.is_user_currently_suspended(new.user_id) then
    raise exception 'suspended users cannot create comments';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_suspended_user_comment on public.hospital_comments;

create trigger prevent_suspended_user_comment
before insert on public.hospital_comments
for each row
execute function public.prevent_suspended_user_comment();

drop trigger if exists prevent_suspended_user_board_post on public.board_posts;

create trigger prevent_suspended_user_board_post
before insert on public.board_posts
for each row
execute function public.prevent_suspended_user_content();

drop trigger if exists prevent_suspended_user_board_post_comment on public.board_post_comments;

create trigger prevent_suspended_user_board_post_comment
before insert on public.board_post_comments
for each row
execute function public.prevent_suspended_user_content();

revoke all on function public.prevent_suspended_user_content() from public;
revoke all on function public.prevent_suspended_user_comment() from public;
