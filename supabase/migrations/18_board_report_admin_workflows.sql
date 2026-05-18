-- 게시글/댓글 신고 관리자 조회 및 처리 함수

create index if not exists board_post_reports_status_created_at_idx
  on public.board_post_reports (status, created_at desc);

create index if not exists board_post_comment_reports_status_created_at_idx
  on public.board_post_comment_reports (status, created_at desc);

create or replace function public.admin_list_board_reports(
  p_page      integer default 1,
  p_page_size integer default 30,
  p_status    text    default null,
  p_search    text    default null
)
returns table (
  report_id uuid,
  report_type text,
  target_id uuid,
  post_id uuid,
  comment_id uuid,
  target_user_id uuid,
  target_user_email text,
  target_user_display_name text,
  reporter_id uuid,
  reporter_email text,
  reporter_display_name text,
  reason text,
  report_status text,
  target_status text,
  board text,
  filter_tag text,
  post_title text,
  content text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with report_rows as (
    select
      bpr.id as report_id,
      'post'::text as report_type,
      bp.id as target_id,
      bp.id as post_id,
      null::uuid as comment_id,
      bp.user_id as target_user_id,
      target_profile.email as target_user_email,
      target_profile.display_name as target_user_display_name,
      bpr.reporter_id,
      reporter_profile.email as reporter_email,
      reporter_profile.display_name as reporter_display_name,
      bpr.reason,
      bpr.status::text as report_status,
      bp.status::text as target_status,
      bp.board::text as board,
      bp.filter_tag,
      bp.title as post_title,
      bp.body as content,
      bpr.created_at,
      bpr.updated_at
    from public.board_post_reports bpr
    join public.board_posts bp on bp.id = bpr.post_id
    left join public.profiles target_profile on target_profile.id = bp.user_id
    left join public.profiles reporter_profile on reporter_profile.id = bpr.reporter_id

    union all

    select
      bpcr.id as report_id,
      'comment'::text as report_type,
      bpc.id as target_id,
      bp.id as post_id,
      bpc.id as comment_id,
      bpc.user_id as target_user_id,
      target_profile.email as target_user_email,
      target_profile.display_name as target_user_display_name,
      bpcr.reporter_id,
      reporter_profile.email as reporter_email,
      reporter_profile.display_name as reporter_display_name,
      bpcr.reason,
      bpcr.status::text as report_status,
      bpc.status::text as target_status,
      bp.board::text as board,
      bp.filter_tag,
      bp.title as post_title,
      bpc.body as content,
      bpcr.created_at,
      bpcr.updated_at
    from public.board_post_comment_reports bpcr
    join public.board_post_comments bpc on bpc.id = bpcr.comment_id
    join public.board_posts bp on bp.id = bpcr.post_id
    left join public.profiles target_profile on target_profile.id = bpc.user_id
    left join public.profiles reporter_profile on reporter_profile.id = bpcr.reporter_id
  ),
  filtered as (
    select
      report_rows.*,
      count(*) over() as total_count
    from report_rows
    where (p_status is null or report_rows.report_status = p_status)
      and (
        nullif(trim(coalesce(p_search, '')), '') is null
        or report_rows.reason ilike '%' || trim(p_search) || '%'
        or report_rows.post_title ilike '%' || trim(p_search) || '%'
        or report_rows.content ilike '%' || trim(p_search) || '%'
        or report_rows.target_user_email ilike '%' || trim(p_search) || '%'
        or report_rows.target_user_display_name ilike '%' || trim(p_search) || '%'
        or report_rows.reporter_email ilike '%' || trim(p_search) || '%'
        or report_rows.reporter_display_name ilike '%' || trim(p_search) || '%'
      )
  )
  select *
  from filtered
  order by created_at desc
  limit greatest(1, least(coalesce(p_page_size, 30), 100))
  offset greatest(0, coalesce(p_page, 1) - 1)
    * greatest(1, least(coalesce(p_page_size, 30), 100))
$$;

create or replace function public.admin_update_board_report_status(
  p_report_id uuid,
  p_report_type text,
  p_status text
)
returns table (
  report_id uuid,
  report_type text,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_report_type not in ('post', 'comment') then
    raise exception 'report_type must be post or comment';
  end if;

  if p_status not in ('pending', 'reviewed', 'dismissed') then
    raise exception 'status must be pending, reviewed, or dismissed';
  end if;

  if p_report_type = 'post' then
    update public.board_post_reports
    set status = p_status
    where id = p_report_id
    returning
      id,
      'post'::text,
      board_post_reports.status::text,
      board_post_reports.updated_at
    into report_id, report_type, status, updated_at;
  else
    update public.board_post_comment_reports
    set status = p_status
    where id = p_report_id
    returning
      id,
      'comment'::text,
      board_post_comment_reports.status::text,
      board_post_comment_reports.updated_at
    into report_id, report_type, status, updated_at;
  end if;

  if report_id is null then
    raise exception 'report not found';
  end if;

  return next;
end;
$$;

revoke all on function public.admin_list_board_reports(integer, integer, text, text) from public;
revoke all on function public.admin_update_board_report_status(uuid, text, text) from public;

grant execute on function public.admin_list_board_reports(integer, integer, text, text) to service_role;
grant execute on function public.admin_update_board_report_status(uuid, text, text) to service_role;
