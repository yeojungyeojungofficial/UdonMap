alter table public.hospital_comments
add column if not exists deleted_at timestamptz;

alter table public.hospital_comments
add column if not exists deleted_by uuid references auth.users (id) on delete set null;

alter table public.hospital_comments
add column if not exists deleted_reason text;

create table if not exists public.comment_moderation_actions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.hospital_comments (id) on delete cascade,
  target_user_id uuid not null references auth.users (id) on delete cascade,
  admin_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('delete', 'restore')),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists comment_moderation_actions_comment_id_idx
on public.comment_moderation_actions (comment_id, created_at desc);

create index if not exists comment_moderation_actions_target_user_id_idx
on public.comment_moderation_actions (target_user_id, created_at desc);

create table if not exists public.user_suspensions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  duration text not null check (duration in ('3d', '7d', 'permanent')),
  reason text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users (id) on delete set null,
  revoke_reason text,
  check (
    (duration = 'permanent' and ends_at is null) or
    (duration <> 'permanent' and ends_at is not null)
  )
);

create index if not exists user_suspensions_user_id_idx
on public.user_suspensions (user_id, starts_at desc);

create index if not exists user_suspensions_active_idx
on public.user_suspensions (user_id, revoked_at, ends_at);

alter table public.comment_moderation_actions enable row level security;
alter table public.user_suspensions enable row level security;

grant select, insert on public.comment_moderation_actions to service_role;
grant select, insert, update on public.user_suspensions to service_role;

create or replace function public.set_hospital_comment_deleted_metadata()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'deleted' and old.status is distinct from 'deleted' then
    new.deleted_at := coalesce(new.deleted_at, now());
  end if;

  if new.status <> 'deleted' and old.status = 'deleted' then
    new.deleted_at := null;
    new.deleted_by := null;
    new.deleted_reason := null;
  end if;

  return new;
end;
$$;

drop trigger if exists set_hospital_comment_deleted_metadata on public.hospital_comments;

create trigger set_hospital_comment_deleted_metadata
before update of status on public.hospital_comments
for each row
execute function public.set_hospital_comment_deleted_metadata();

create or replace function public.sync_hospital_review_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'visible' then
      update public.hospitals
      set review_count = review_count + 1
      where id = new.hospital_id;
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status <> 'visible' and new.status = 'visible' then
      update public.hospitals
      set review_count = review_count + 1
      where id = new.hospital_id;
    elsif old.status = 'visible' and new.status <> 'visible' then
      update public.hospitals
      set review_count = greatest(0, review_count - 1)
      where id = old.hospital_id;
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status = 'visible' then
      update public.hospitals
      set review_count = greatest(0, review_count - 1)
      where id = old.hospital_id;
    end if;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists sync_hospital_review_count on public.hospital_comments;

create trigger sync_hospital_review_count
after insert or update of status or delete on public.hospital_comments
for each row
execute function public.sync_hospital_review_count();

update public.hospitals h
set review_count = visible_comments.visible_count
from (
  select hospital_id, count(*)::integer as visible_count
  from public.hospital_comments
  where status = 'visible'
  group by hospital_id
) visible_comments
where h.id = visible_comments.hospital_id
  and h.review_count is distinct from visible_comments.visible_count;

update public.hospitals h
set review_count = 0
where not exists (
  select 1
  from public.hospital_comments hc
  where hc.hospital_id = h.id
    and hc.status = 'visible'
)
  and h.review_count <> 0;

create or replace function public.get_user_active_suspension(p_user_id uuid)
returns table (
  suspension_id uuid,
  user_id uuid,
  duration text,
  reason text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    us.id,
    us.user_id,
    us.duration,
    us.reason,
    us.starts_at,
    us.ends_at,
    us.created_by,
    us.created_at
  from public.user_suspensions us
  where us.user_id = p_user_id
    and us.revoked_at is null
    and us.starts_at <= now()
    and (us.ends_at is null or us.ends_at > now())
  order by us.created_at desc
  limit 1
$$;

create or replace function public.is_user_currently_suspended(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.get_user_active_suspension(p_user_id)
  )
$$;

create or replace function public.prevent_suspended_user_comment()
returns trigger
language plpgsql
as $$
begin
  if public.is_user_currently_suspended(new.user_id) then
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

create or replace function public.admin_list_hospital_comments(
  p_page integer default 1,
  p_page_size integer default 30,
  p_user_id uuid default null,
  p_hospital_id uuid default null,
  p_status text default null,
  p_search text default null
)
returns table (
  comment_id uuid,
  hospital_id uuid,
  hospital_name text,
  user_id uuid,
  user_email text,
  user_display_name text,
  author_name text,
  body text,
  like_count integer,
  dislike_count integer,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid,
  deleted_reason text,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtered_comments as (
    select
      hc.id as comment_id,
      hc.hospital_id,
      h.name as hospital_name,
      hc.user_id,
      p.email as user_email,
      p.display_name as user_display_name,
      hc.author_name,
      hc.body,
      hc.like_count,
      hc.dislike_count,
      hc.status,
      hc.created_at,
      hc.updated_at,
      hc.deleted_at,
      hc.deleted_by,
      hc.deleted_reason,
      count(*) over() as total_count
    from public.hospital_comments hc
    join public.hospitals h on h.id = hc.hospital_id
    left join public.profiles p on p.id = hc.user_id
    where (p_user_id is null or hc.user_id = p_user_id)
      and (p_hospital_id is null or hc.hospital_id = p_hospital_id)
      and (p_status is null or hc.status = p_status)
      and (
        nullif(trim(coalesce(p_search, '')), '') is null or
        hc.body ilike '%' || trim(p_search) || '%' or
        hc.author_name ilike '%' || trim(p_search) || '%' or
        p.email ilike '%' || trim(p_search) || '%' or
        p.display_name ilike '%' || trim(p_search) || '%'
      )
  )
  select *
  from filtered_comments
  order by created_at desc
  limit greatest(1, least(coalesce(p_page_size, 30), 100))
  offset greatest(0, coalesce(p_page, 1) - 1)
    * greatest(1, least(coalesce(p_page_size, 30), 100))
$$;

create or replace function public.admin_delete_hospital_comment(
  p_comment_id uuid,
  p_admin_id uuid default null,
  p_reason text default null
)
returns table (
  comment_id uuid,
  user_id uuid,
  status text,
  deleted_at timestamptz,
  deleted_by uuid,
  deleted_reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_comment public.hospital_comments%rowtype;
begin
  select *
  into target_comment
  from public.hospital_comments
  where id = p_comment_id
  for update;

  if not found then
    raise exception 'comment not found';
  end if;

  update public.hospital_comments
  set
    status = 'deleted',
    deleted_at = now(),
    deleted_by = p_admin_id,
    deleted_reason = nullif(trim(coalesce(p_reason, '')), '')
  where id = p_comment_id
  returning
    id,
    hospital_comments.user_id,
    hospital_comments.status,
    hospital_comments.deleted_at,
    hospital_comments.deleted_by,
    hospital_comments.deleted_reason
  into
    comment_id,
    user_id,
    status,
    deleted_at,
    deleted_by,
    deleted_reason;

  insert into public.comment_moderation_actions (
    comment_id,
    target_user_id,
    admin_id,
    action,
    reason
  )
  values (
    p_comment_id,
    target_comment.user_id,
    p_admin_id,
    'delete',
    nullif(trim(coalesce(p_reason, '')), '')
  );

  return next;
end;
$$;

create or replace function public.admin_restore_hospital_comment(
  p_comment_id uuid,
  p_admin_id uuid default null,
  p_reason text default null
)
returns table (
  comment_id uuid,
  user_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_comment public.hospital_comments%rowtype;
begin
  select *
  into target_comment
  from public.hospital_comments
  where id = p_comment_id
  for update;

  if not found then
    raise exception 'comment not found';
  end if;

  update public.hospital_comments
  set
    status = 'visible',
    deleted_at = null,
    deleted_by = null,
    deleted_reason = null
  where id = p_comment_id
  returning
    id,
    hospital_comments.user_id,
    hospital_comments.status
  into
    comment_id,
    user_id,
    status;

  insert into public.comment_moderation_actions (
    comment_id,
    target_user_id,
    admin_id,
    action,
    reason
  )
  values (
    p_comment_id,
    target_comment.user_id,
    p_admin_id,
    'restore',
    nullif(trim(coalesce(p_reason, '')), '')
  );

  return next;
end;
$$;

create or replace function public.admin_suspend_user(
  p_user_id uuid,
  p_duration text,
  p_admin_id uuid default null,
  p_reason text default null
)
returns table (
  suspension_id uuid,
  user_id uuid,
  duration text,
  starts_at timestamptz,
  ends_at timestamptz,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  next_ends_at timestamptz;
begin
  if p_duration not in ('3d', '7d', 'permanent') then
    raise exception 'duration must be 3d, 7d, or permanent';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'user not found';
  end if;

  next_ends_at := case
    when p_duration = '3d' then now() + interval '3 days'
    when p_duration = '7d' then now() + interval '7 days'
    else null
  end;

  update public.user_suspensions
  set
    revoked_at = now(),
    revoked_by = p_admin_id,
    revoke_reason = 'replaced by new suspension'
  where user_suspensions.user_id = p_user_id
    and revoked_at is null
    and (ends_at is null or ends_at > now());

  insert into public.user_suspensions (
    user_id,
    duration,
    reason,
    ends_at,
    created_by
  )
  values (
    p_user_id,
    p_duration,
    nullif(trim(coalesce(p_reason, '')), ''),
    next_ends_at,
    p_admin_id
  )
  returning
    id,
    user_suspensions.user_id,
    user_suspensions.duration,
    user_suspensions.starts_at,
    user_suspensions.ends_at,
    user_suspensions.reason
  into
    suspension_id,
    user_id,
    duration,
    starts_at,
    ends_at,
    reason;

  return next;
end;
$$;

create or replace function public.admin_revoke_user_suspension(
  p_suspension_id uuid,
  p_admin_id uuid default null,
  p_reason text default null
)
returns table (
  suspension_id uuid,
  user_id uuid,
  revoked_at timestamptz,
  revoked_by uuid,
  revoke_reason text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_suspensions
  set
    revoked_at = now(),
    revoked_by = p_admin_id,
    revoke_reason = nullif(trim(coalesce(p_reason, '')), '')
  where id = p_suspension_id
    and revoked_at is null
  returning
    id,
    user_suspensions.user_id,
    user_suspensions.revoked_at,
    user_suspensions.revoked_by,
    user_suspensions.revoke_reason
  into
    suspension_id,
    user_id,
    revoked_at,
    revoked_by,
    revoke_reason;

  if suspension_id is null then
    raise exception 'active suspension not found';
  end if;

  return next;
end;
$$;

create or replace function public.admin_list_user_suspensions(
  p_page integer default 1,
  p_page_size integer default 30,
  p_user_id uuid default null,
  p_include_inactive boolean default false,
  p_search text default null
)
returns table (
  suspension_id uuid,
  user_id uuid,
  user_email text,
  user_display_name text,
  duration text,
  reason text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid,
  revoke_reason text,
  is_active boolean,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtered_suspensions as (
    select
      us.id as suspension_id,
      us.user_id,
      p.email as user_email,
      p.display_name as user_display_name,
      us.duration,
      us.reason,
      us.starts_at,
      us.ends_at,
      us.created_by,
      us.created_at,
      us.revoked_at,
      us.revoked_by,
      us.revoke_reason,
      (
        us.revoked_at is null and
        us.starts_at <= now() and
        (us.ends_at is null or us.ends_at > now())
      ) as is_active,
      count(*) over() as total_count
    from public.user_suspensions us
    left join public.profiles p on p.id = us.user_id
    where (p_user_id is null or us.user_id = p_user_id)
      and (
        p_include_inactive or
        (
          us.revoked_at is null and
          us.starts_at <= now() and
          (us.ends_at is null or us.ends_at > now())
        )
      )
      and (
        nullif(trim(coalesce(p_search, '')), '') is null or
        p.email ilike '%' || trim(p_search) || '%' or
        p.display_name ilike '%' || trim(p_search) || '%'
      )
  )
  select *
  from filtered_suspensions
  order by created_at desc
  limit greatest(1, least(coalesce(p_page_size, 30), 100))
  offset greatest(0, coalesce(p_page, 1) - 1)
    * greatest(1, least(coalesce(p_page_size, 30), 100))
$$;

revoke all on function public.admin_list_hospital_comments(integer, integer, uuid, uuid, text, text) from public;
revoke all on function public.admin_delete_hospital_comment(uuid, uuid, text) from public;
revoke all on function public.admin_restore_hospital_comment(uuid, uuid, text) from public;
revoke all on function public.admin_suspend_user(uuid, text, uuid, text) from public;
revoke all on function public.admin_revoke_user_suspension(uuid, uuid, text) from public;
revoke all on function public.admin_list_user_suspensions(integer, integer, uuid, boolean, text) from public;

grant execute on function public.admin_list_hospital_comments(integer, integer, uuid, uuid, text, text) to service_role;
grant execute on function public.admin_delete_hospital_comment(uuid, uuid, text) to service_role;
grant execute on function public.admin_restore_hospital_comment(uuid, uuid, text) to service_role;
grant execute on function public.admin_suspend_user(uuid, text, uuid, text) to service_role;
grant execute on function public.admin_revoke_user_suspension(uuid, uuid, text) to service_role;
grant execute on function public.admin_list_user_suspensions(integer, integer, uuid, boolean, text) to service_role;

revoke all on function public.get_user_active_suspension(uuid) from public;
revoke all on function public.is_user_currently_suspended(uuid) from public;

grant execute on function public.get_user_active_suspension(uuid) to service_role;
grant execute on function public.is_user_currently_suspended(uuid) to service_role;
