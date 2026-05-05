alter table public.hospitals
add column if not exists dislikes integer not null default 0 check (dislikes >= 0);

alter table public.hospital_comments
add column if not exists dislike_count integer not null default 0 check (dislike_count >= 0);

create table if not exists public.hospital_reactions (
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (hospital_id, user_id)
);

create index if not exists hospital_reactions_user_id_idx
on public.hospital_reactions (user_id);

create table if not exists public.hospital_comment_reactions (
  comment_id uuid not null references public.hospital_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists hospital_comment_reactions_user_id_idx
on public.hospital_comment_reactions (user_id);

alter table public.hospital_reactions enable row level security;
alter table public.hospital_comment_reactions enable row level security;

drop trigger if exists set_hospital_reactions_updated_at on public.hospital_reactions;

create trigger set_hospital_reactions_updated_at
before update on public.hospital_reactions
for each row
execute function public.set_updated_at();

drop trigger if exists set_hospital_comment_reactions_updated_at on public.hospital_comment_reactions;

create trigger set_hospital_comment_reactions_updated_at
before update on public.hospital_comment_reactions
for each row
execute function public.set_updated_at();

drop policy if exists "Hospital reactions are readable by owner" on public.hospital_reactions;

create policy "Hospital reactions are readable by owner"
on public.hospital_reactions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Hospital comment reactions are readable by owner" on public.hospital_comment_reactions;

create policy "Hospital comment reactions are readable by owner"
on public.hospital_comment_reactions
for select
to authenticated
using (auth.uid() = user_id);

grant select on public.hospital_reactions to authenticated;
grant select on public.hospital_comment_reactions to authenticated;
grant select, insert, update, delete on public.hospital_reactions to service_role;
grant select, insert, update, delete on public.hospital_comment_reactions to service_role;

create or replace function public.set_hospital_reaction(
  p_hospital_id uuid,
  p_user_id uuid,
  p_reaction_type text
)
returns table (
  likes integer,
  dislikes integer,
  reaction_type text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_reaction text;
  next_reaction text;
  like_delta integer := 0;
  dislike_delta integer := 0;
begin
  if p_reaction_type not in ('like', 'dislike') then
    raise exception 'invalid reaction type';
  end if;

  perform 1
  from public.hospitals
  where id = p_hospital_id
  for update;

  if not found then
    raise exception 'hospital not found';
  end if;

  select hr.reaction_type
  into current_reaction
  from public.hospital_reactions hr
  where hr.hospital_id = p_hospital_id
    and hr.user_id = p_user_id
  for update;

  if current_reaction = p_reaction_type then
    delete from public.hospital_reactions hr
    where hr.hospital_id = p_hospital_id
      and hr.user_id = p_user_id;

    if p_reaction_type = 'like' then
      like_delta := -1;
    else
      dislike_delta := -1;
    end if;

    next_reaction := null;
  elsif current_reaction is null then
    insert into public.hospital_reactions (
      hospital_id,
      user_id,
      reaction_type
    )
    values (
      p_hospital_id,
      p_user_id,
      p_reaction_type
    );

    if p_reaction_type = 'like' then
      like_delta := 1;
    else
      dislike_delta := 1;
    end if;

    next_reaction := p_reaction_type;
  else
    update public.hospital_reactions hr
    set reaction_type = p_reaction_type
    where hr.hospital_id = p_hospital_id
      and hr.user_id = p_user_id;

    if p_reaction_type = 'like' then
      like_delta := 1;
      dislike_delta := -1;
    else
      like_delta := -1;
      dislike_delta := 1;
    end if;

    next_reaction := p_reaction_type;
  end if;

  update public.hospitals h
  set
    likes = greatest(0, h.likes + like_delta),
    dislikes = greatest(0, h.dislikes + dislike_delta)
  where h.id = p_hospital_id
  returning h.likes, h.dislikes
  into likes, dislikes;

  reaction_type := next_reaction;
  return next;
end;
$$;

create or replace function public.set_hospital_comment_reaction(
  p_hospital_id uuid,
  p_comment_id uuid,
  p_user_id uuid,
  p_reaction_type text
)
returns table (
  like_count integer,
  dislike_count integer,
  reaction_type text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_reaction text;
  next_reaction text;
  like_delta integer := 0;
  dislike_delta integer := 0;
begin
  if p_reaction_type not in ('like', 'dislike') then
    raise exception 'invalid reaction type';
  end if;

  perform 1
  from public.hospital_comments
  where id = p_comment_id
    and hospital_id = p_hospital_id
    and status = 'visible'
  for update;

  if not found then
    raise exception 'comment not found';
  end if;

  select hcr.reaction_type
  into current_reaction
  from public.hospital_comment_reactions hcr
  where hcr.comment_id = p_comment_id
    and hcr.user_id = p_user_id
  for update;

  if current_reaction = p_reaction_type then
    delete from public.hospital_comment_reactions hcr
    where hcr.comment_id = p_comment_id
      and hcr.user_id = p_user_id;

    if p_reaction_type = 'like' then
      like_delta := -1;
    else
      dislike_delta := -1;
    end if;

    next_reaction := null;
  elsif current_reaction is null then
    insert into public.hospital_comment_reactions (
      comment_id,
      user_id,
      reaction_type
    )
    values (
      p_comment_id,
      p_user_id,
      p_reaction_type
    );

    if p_reaction_type = 'like' then
      like_delta := 1;
    else
      dislike_delta := 1;
    end if;

    next_reaction := p_reaction_type;
  else
    update public.hospital_comment_reactions hcr
    set reaction_type = p_reaction_type
    where hcr.comment_id = p_comment_id
      and hcr.user_id = p_user_id;

    if p_reaction_type = 'like' then
      like_delta := 1;
      dislike_delta := -1;
    else
      like_delta := -1;
      dislike_delta := 1;
    end if;

    next_reaction := p_reaction_type;
  end if;

  update public.hospital_comments hc
  set
    like_count = greatest(0, hc.like_count + like_delta),
    dislike_count = greatest(0, hc.dislike_count + dislike_delta)
  where hc.id = p_comment_id
    and hc.hospital_id = p_hospital_id
  returning hc.like_count, hc.dislike_count
  into like_count, dislike_count;

  reaction_type := next_reaction;
  return next;
end;
$$;

revoke all on function public.set_hospital_reaction(uuid, uuid, text)
from public, anon, authenticated;
revoke all on function public.set_hospital_comment_reaction(uuid, uuid, uuid, text)
from public, anon, authenticated;

grant execute on function public.set_hospital_reaction(uuid, uuid, text) to service_role;
grant execute on function public.set_hospital_comment_reaction(uuid, uuid, uuid, text) to service_role;
