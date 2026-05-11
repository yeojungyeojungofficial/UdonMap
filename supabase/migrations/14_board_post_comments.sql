-- 게시판 게시글 댓글 테이블
create table if not exists public.board_post_comments (
  id             uuid        primary key default gen_random_uuid(),
  post_id        uuid        not null references public.board_posts (id) on delete cascade,
  user_id        uuid        references auth.users (id) on delete set null,
  author_name    text        not null,
  body           text        not null,
  like_count     integer     not null default 0,
  dislike_count  integer     not null default 0,
  status         text        not null default 'visible'
                             check (status in ('visible', 'hidden', 'deleted')),
  deleted_at     timestamptz,
  deleted_by     uuid        references auth.users (id) on delete set null,
  deleted_reason text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger board_post_comments_set_updated_at
  before update on public.board_post_comments
  for each row execute function public.set_updated_at();

create index if not exists board_post_comments_post_id_idx
  on public.board_post_comments (post_id, created_at desc);

create index if not exists board_post_comments_user_id_idx
  on public.board_post_comments (user_id, created_at desc);

alter table public.board_post_comments enable row level security;

create policy "board_post_comments_select_visible"
  on public.board_post_comments for select
  using (status = 'visible' or auth.uid() = user_id);

create policy "board_post_comments_insert_own"
  on public.board_post_comments for insert
  with check (auth.uid() = user_id);

create policy "board_post_comments_update_own"
  on public.board_post_comments for update
  using (auth.uid() = user_id);

-- 게시글 댓글 수 컬럼 추가
alter table public.board_posts
  add column if not exists comment_count integer not null default 0;

-- 댓글 수 자동 동기화 트리거
create or replace function public.sync_board_post_comment_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'visible' then
      update public.board_posts set comment_count = comment_count + 1 where id = new.post_id;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status <> 'visible' and new.status = 'visible' then
      update public.board_posts set comment_count = comment_count + 1 where id = new.post_id;
    elsif old.status = 'visible' and new.status <> 'visible' then
      update public.board_posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status = 'visible' then
      update public.board_posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    end if;
    return old;
  end if;

  return null;
end;
$$;

create trigger sync_board_post_comment_count
  after insert or update of status or delete on public.board_post_comments
  for each row execute function public.sync_board_post_comment_count();

-- ----------------------------------------------------------------
-- admin 함수: 게시글 목록 (내용 포함)
-- ----------------------------------------------------------------
create or replace function public.admin_list_board_posts(
  p_page       integer default 1,
  p_page_size  integer default 30,
  p_board      text    default null,
  p_status     text    default null,
  p_search     text    default null
)
returns table (
  post_id         uuid,
  board           text,
  filter_tag      text,
  title           text,
  body            text,
  comment_count   integer,
  user_id         uuid,
  user_email      text,
  user_display_name text,
  status          text,
  created_at      timestamptz,
  updated_at      timestamptz,
  total_count     bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
    select
      bp.id              as post_id,
      bp.board,
      bp.filter_tag,
      bp.title,
      bp.body,
      bp.comment_count,
      bp.user_id,
      p.email            as user_email,
      p.display_name     as user_display_name,
      bp.status,
      bp.created_at,
      bp.updated_at,
      count(*) over()    as total_count
    from public.board_posts bp
    left join public.profiles p on p.id = bp.user_id
    where (p_board  is null or bp.board  = p_board)
      and (p_status is null or bp.status = p_status)
      and (
        nullif(trim(coalesce(p_search, '')), '') is null
        or bp.title ilike '%' || trim(p_search) || '%'
        or bp.body  ilike '%' || trim(p_search) || '%'
        or p.email  ilike '%' || trim(p_search) || '%'
        or p.display_name ilike '%' || trim(p_search) || '%'
      )
  )
  select * from filtered
  order by created_at desc
  limit  greatest(1, least(coalesce(p_page_size, 30), 100))
  offset greatest(0, coalesce(p_page, 1) - 1)
       * greatest(1, least(coalesce(p_page_size, 30), 100))
$$;

-- ----------------------------------------------------------------
-- admin 함수: 게시글 상태 변경
-- ----------------------------------------------------------------
create or replace function public.admin_update_board_post_status(
  p_post_id  uuid,
  p_status   text,
  p_admin_id uuid default null
)
returns table (
  post_id    uuid,
  user_id    uuid,
  status     text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.board_posts
  set status = p_status
  where id = p_post_id
  returning
    id,
    board_posts.user_id,
    board_posts.status,
    board_posts.updated_at
  into post_id, user_id, status, updated_at;

  if post_id is null then
    raise exception 'post not found';
  end if;

  return next;
end;
$$;

-- ----------------------------------------------------------------
-- admin 함수: 게시글 댓글 목록
-- ----------------------------------------------------------------
create or replace function public.admin_list_board_post_comments(
  p_page      integer default 1,
  p_page_size integer default 30,
  p_post_id   uuid    default null,
  p_status    text    default null,
  p_search    text    default null
)
returns table (
  comment_id        uuid,
  post_id           uuid,
  post_title        text,
  post_board        text,
  user_id           uuid,
  user_email        text,
  user_display_name text,
  author_name       text,
  body              text,
  like_count        integer,
  dislike_count     integer,
  status            text,
  created_at        timestamptz,
  updated_at        timestamptz,
  deleted_at        timestamptz,
  deleted_by        uuid,
  deleted_reason    text,
  total_count       bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
    select
      bpc.id                as comment_id,
      bpc.post_id,
      bp.title              as post_title,
      bp.board              as post_board,
      bpc.user_id,
      p.email               as user_email,
      p.display_name        as user_display_name,
      bpc.author_name,
      bpc.body,
      bpc.like_count,
      bpc.dislike_count,
      bpc.status,
      bpc.created_at,
      bpc.updated_at,
      bpc.deleted_at,
      bpc.deleted_by,
      bpc.deleted_reason,
      count(*) over()       as total_count
    from public.board_post_comments bpc
    join public.board_posts bp on bp.id = bpc.post_id
    left join public.profiles p on p.id = bpc.user_id
    where (p_post_id is null or bpc.post_id = p_post_id)
      and (p_status  is null or bpc.status  = p_status)
      and (
        nullif(trim(coalesce(p_search, '')), '') is null
        or bpc.body        ilike '%' || trim(p_search) || '%'
        or bpc.author_name ilike '%' || trim(p_search) || '%'
        or p.email         ilike '%' || trim(p_search) || '%'
        or p.display_name  ilike '%' || trim(p_search) || '%'
      )
  )
  select * from filtered
  order by created_at desc
  limit  greatest(1, least(coalesce(p_page_size, 30), 100))
  offset greatest(0, coalesce(p_page, 1) - 1)
       * greatest(1, least(coalesce(p_page_size, 30), 100))
$$;

-- ----------------------------------------------------------------
-- admin 함수: 게시글 댓글 삭제 (soft delete)
-- ----------------------------------------------------------------
create or replace function public.admin_delete_board_post_comment(
  p_comment_id uuid,
  p_admin_id   uuid default null,
  p_reason     text default null
)
returns table (
  comment_id     uuid,
  user_id        uuid,
  status         text,
  deleted_at     timestamptz,
  deleted_by     uuid,
  deleted_reason text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.board_post_comments
  set
    status         = 'deleted',
    deleted_at     = now(),
    deleted_by     = p_admin_id,
    deleted_reason = nullif(trim(coalesce(p_reason, '')), '')
  where id = p_comment_id
  returning
    id,
    board_post_comments.user_id,
    board_post_comments.status,
    board_post_comments.deleted_at,
    board_post_comments.deleted_by,
    board_post_comments.deleted_reason
  into comment_id, user_id, status, deleted_at, deleted_by, deleted_reason;

  if comment_id is null then
    raise exception 'comment not found';
  end if;

  return next;
end;
$$;

-- ----------------------------------------------------------------
-- admin 함수: 게시글 댓글 복원
-- ----------------------------------------------------------------
create or replace function public.admin_restore_board_post_comment(
  p_comment_id uuid,
  p_admin_id   uuid default null,
  p_reason     text default null
)
returns table (
  comment_id uuid,
  user_id    uuid,
  status     text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.board_post_comments
  set
    status         = 'visible',
    deleted_at     = null,
    deleted_by     = null,
    deleted_reason = null
  where id = p_comment_id
  returning
    id,
    board_post_comments.user_id,
    board_post_comments.status
  into comment_id, user_id, status;

  if comment_id is null then
    raise exception 'comment not found';
  end if;

  return next;
end;
$$;

-- admin 함수 권한: public 접근 차단, service_role만 허용
revoke all on function public.admin_list_board_posts(integer, integer, text, text, text) from public;
revoke all on function public.admin_update_board_post_status(uuid, text, uuid) from public;
revoke all on function public.admin_list_board_post_comments(integer, integer, uuid, text, text) from public;
revoke all on function public.admin_delete_board_post_comment(uuid, uuid, text) from public;
revoke all on function public.admin_restore_board_post_comment(uuid, uuid, text) from public;

grant execute on function public.admin_list_board_posts(integer, integer, text, text, text) to service_role;
grant execute on function public.admin_update_board_post_status(uuid, text, uuid) to service_role;
grant execute on function public.admin_list_board_post_comments(integer, integer, uuid, text, text) to service_role;
grant execute on function public.admin_delete_board_post_comment(uuid, uuid, text) to service_role;
grant execute on function public.admin_restore_board_post_comment(uuid, uuid, text) to service_role;
