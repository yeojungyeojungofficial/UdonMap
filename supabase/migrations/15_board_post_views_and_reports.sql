alter table public.board_posts
  add column if not exists view_count integer not null default 0;

create index if not exists board_posts_view_count_idx
  on public.board_posts (view_count desc);

drop policy if exists "board_posts_select_visible" on public.board_posts;
create policy "board_posts_select_visible"
  on public.board_posts for select
  using (
    (board_posts.status = 'visible' and board_posts.user_id is not null)
    or auth.uid() = board_posts.user_id
  );

create or replace function public.increment_board_post_view_count(p_post_id uuid)
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
begin
  return query
  update public.board_posts bp
  set view_count = bp.view_count + 1
  where bp.id = p_post_id
    and bp.status = 'visible'
    and bp.user_id is not null
  returning
    bp.id,
    bp.user_id,
    bp.board,
    bp.filter_tag,
    bp.title,
    bp.body,
    bp.comment_count,
    bp.view_count,
    bp.status,
    bp.created_at,
    bp.updated_at;
end;
$$;

revoke all on function public.increment_board_post_view_count(uuid) from public;
grant execute on function public.increment_board_post_view_count(uuid) to service_role;

create table if not exists public.board_post_reports (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.board_posts (id) on delete cascade,
  reporter_id uuid        references auth.users (id) on delete set null,
  reason      text,
  status      text        not null default 'pending'
                          check (status in ('pending', 'reviewed', 'dismissed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (post_id, reporter_id)
);

drop trigger if exists board_post_reports_set_updated_at on public.board_post_reports;
create trigger board_post_reports_set_updated_at
  before update on public.board_post_reports
  for each row execute function public.set_updated_at();

create index if not exists board_post_reports_post_id_created_at_idx
  on public.board_post_reports (post_id, created_at desc);

create index if not exists board_post_reports_reporter_id_created_at_idx
  on public.board_post_reports (reporter_id, created_at desc);

alter table public.board_post_reports enable row level security;

drop policy if exists "board_post_reports_insert_own" on public.board_post_reports;
create policy "board_post_reports_insert_own"
  on public.board_post_reports for insert
  with check (
    auth.uid() = reporter_id
    and exists (
      select 1
      from public.board_posts bp
      where bp.id = board_post_reports.post_id
        and bp.status = 'visible'
        and bp.user_id is not null
    )
  );

drop policy if exists "board_post_reports_select_own" on public.board_post_reports;
create policy "board_post_reports_select_own"
  on public.board_post_reports for select
  using (auth.uid() = reporter_id);

create table if not exists public.board_post_comment_reports (
  id          uuid        primary key default gen_random_uuid(),
  comment_id  uuid        not null references public.board_post_comments (id) on delete cascade,
  post_id     uuid        not null references public.board_posts (id) on delete cascade,
  reporter_id uuid        references auth.users (id) on delete set null,
  reason      text,
  status      text        not null default 'pending'
                          check (status in ('pending', 'reviewed', 'dismissed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (comment_id, reporter_id)
);

drop trigger if exists board_post_comment_reports_set_updated_at on public.board_post_comment_reports;
create trigger board_post_comment_reports_set_updated_at
  before update on public.board_post_comment_reports
  for each row execute function public.set_updated_at();

create index if not exists board_post_comment_reports_comment_id_created_at_idx
  on public.board_post_comment_reports (comment_id, created_at desc);

create index if not exists board_post_comment_reports_post_id_created_at_idx
  on public.board_post_comment_reports (post_id, created_at desc);

create index if not exists board_post_comment_reports_reporter_id_created_at_idx
  on public.board_post_comment_reports (reporter_id, created_at desc);

alter table public.board_post_comment_reports enable row level security;

drop policy if exists "board_post_comment_reports_insert_own" on public.board_post_comment_reports;
create policy "board_post_comment_reports_insert_own"
  on public.board_post_comment_reports for insert
  with check (
    auth.uid() = reporter_id
    and exists (
      select 1
      from public.board_post_comments bpc
      join public.board_posts bp on bp.id = bpc.post_id
      where bpc.id = board_post_comment_reports.comment_id
        and bpc.post_id = board_post_comment_reports.post_id
        and bpc.status = 'visible'
        and bp.status = 'visible'
        and bp.user_id is not null
    )
  );

drop policy if exists "board_post_comment_reports_select_own" on public.board_post_comment_reports;
create policy "board_post_comment_reports_select_own"
  on public.board_post_comment_reports for select
  using (auth.uid() = reporter_id);

drop policy if exists "board_post_comments_select_visible" on public.board_post_comments;
create policy "board_post_comments_select_visible"
  on public.board_post_comments for select
  using (
    (
      board_post_comments.status = 'visible'
      and exists (
        select 1
        from public.board_posts bp
        where bp.id = board_post_comments.post_id
          and bp.status = 'visible'
          and bp.user_id is not null
      )
    )
    or auth.uid() = board_post_comments.user_id
  );
