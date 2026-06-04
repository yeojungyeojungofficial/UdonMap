alter table public.profiles
  add column if not exists privacy_policy_agreed boolean not null default false,
  add column if not exists privacy_policy_agreed_at timestamptz,
  add column if not exists privacy_policy_version text;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  policy_agreed boolean := false;
  policy_agreed_at timestamptz := null;
  policy_version text := null;
  raw_policy_agreed text := lower(coalesce(new.raw_user_meta_data ->> 'privacy_policy_agreed', 'false'));
  raw_policy_agreed_at text := nullif(new.raw_user_meta_data ->> 'privacy_policy_agreed_at', '');
begin
  policy_agreed := raw_policy_agreed in ('true', '1', 'yes', 'on');
  policy_version := nullif(new.raw_user_meta_data ->> 'privacy_policy_version', '');

  if raw_policy_agreed_at ~ '^\d{4}-\d{2}-\d{2}T' then
    policy_agreed_at := raw_policy_agreed_at::timestamptz;
  end if;

  insert into public.profiles (
    id,
    email,
    display_name,
    privacy_policy_agreed,
    privacy_policy_agreed_at,
    privacy_policy_version
  )
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), ''),
    policy_agreed,
    policy_agreed_at,
    policy_version
  )
  on conflict (id) do update
  set
    email = excluded.email,
    privacy_policy_agreed =
      public.profiles.privacy_policy_agreed or excluded.privacy_policy_agreed,
    privacy_policy_agreed_at =
      coalesce(public.profiles.privacy_policy_agreed_at, excluded.privacy_policy_agreed_at),
    privacy_policy_version =
      coalesce(public.profiles.privacy_policy_version, excluded.privacy_policy_version);

  return new;
end;
$$;
