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

  if not exists (select 1 from auth.users au where au.id = p_user_id) then
    raise exception 'user not found';
  end if;

  next_ends_at := case
    when p_duration = '3d' then now() + interval '3 days'
    when p_duration = '7d' then now() + interval '7 days'
    else null
  end;

  update public.user_suspensions us
  set
    revoked_at = now(),
    revoked_by = p_admin_id,
    revoke_reason = 'replaced by new suspension'
  where us.user_id = p_user_id
    and us.revoked_at is null
    and (us.ends_at is null or us.ends_at > now());

  insert into public.user_suspensions as us (
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
    us.id,
    us.user_id,
    us.duration,
    us.starts_at,
    us.ends_at,
    us.reason
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
  update public.user_suspensions us
  set
    revoked_at = now(),
    revoked_by = p_admin_id,
    revoke_reason = nullif(trim(coalesce(p_reason, '')), '')
  where us.id = p_suspension_id
    and us.revoked_at is null
  returning
    us.id,
    us.user_id,
    us.revoked_at,
    us.revoked_by,
    us.revoke_reason
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

revoke all on function public.admin_suspend_user(uuid, text, uuid, text) from public;
revoke all on function public.admin_revoke_user_suspension(uuid, uuid, text) from public;

grant execute on function public.admin_suspend_user(uuid, text, uuid, text) to service_role;
grant execute on function public.admin_revoke_user_suspension(uuid, uuid, text) to service_role;
