-- 유저별 게시글 조회 이력 테이블 (24시간 중복 방지용)
create table if not exists public.board_post_views (
  user_id   uuid        not null references auth.users (id) on delete cascade,
  post_id   uuid        not null references public.board_posts (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists board_post_views_user_id_idx
  on public.board_post_views (user_id);

create index if not exists board_post_views_post_id_idx
  on public.board_post_views (post_id);

-- 기존 함수 교체: p_user_id가 있으면 24시간 내 중복 조회 시 조회수 증가 X
create or replace function public.increment_board_post_view_count(
  p_post_id uuid,
  p_user_id uuid default null
)
returns table (
  id uuid,
  user_id uuid,
  board text,
  filter_tag text,
  title text,
  body text,
  comment_count integer,
  view_count integer,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_already_viewed boolean := false;
begin
  -- 로그인 유저인 경우 24시간 내 조회 여부 확인
  if p_user_id is not null then
    select exists (
      select 1
      from public.board_post_views bpv
      where bpv.user_id = p_user_id
        and bpv.post_id = p_post_id
        and bpv.viewed_at > now() - interval '24 hours'
    ) into v_already_viewed;

    -- 24시간 내 재조회면 조회수 증가 없이 게시글만 반환
    if v_already_viewed then
      return query
        select
          bp.id,
          bp.user_id,
          bp.board::text,
          bp.filter_tag,
          bp.title,
          bp.body,
          bp.comment_count,
          bp.view_count,
          bp.status::text,
          bp.created_at,
          bp.updated_at
        from public.board_posts bp
        where bp.id = p_post_id
          and bp.status = 'visible'
          and bp.user_id is not null;
      return;
    end if;

    -- 조회 이력 upsert (24시간 경과 후 재조회 포함)
    insert into public.board_post_views (user_id, post_id, viewed_at)
    values (p_user_id, p_post_id, now())
    on conflict (user_id, post_id) do update
      set viewed_at = now();
  end if;

  -- 조회수 증가
  return query
    update public.board_posts bp
    set view_count = bp.view_count + 1
    where bp.id = p_post_id
      and bp.status = 'visible'
      and bp.user_id is not null
    returning
      bp.id,
      bp.user_id,
      bp.board::text,
      bp.filter_tag,
      bp.title,
      bp.body,
      bp.comment_count,
      bp.view_count,
      bp.status::text,
      bp.created_at,
      bp.updated_at;
end;
$$;

revoke all on function public.increment_board_post_view_count(uuid, uuid) from public;
grant execute on function public.increment_board_post_view_count(uuid, uuid) to service_role;

-- 구버전 단일 파라미터 시그니처 제거 (15번 마이그레이션에서 생성, 17번으로 대체됨)
revoke all on function public.increment_board_post_view_count(uuid) from public;
drop function if exists public.increment_board_post_view_count(uuid);

-- hospital_reports.hospital_id 인덱스 추가 (병원별 제보 조회 시 풀스캔 방지)
create index if not exists hospital_reports_hospital_id_idx
  on public.hospital_reports (hospital_id);
