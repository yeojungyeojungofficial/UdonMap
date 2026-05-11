-- 게시판 게시글 테이블
create table if not exists public.board_posts (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references auth.users (id) on delete set null,
  board        text        not null
                           check (board in ('병원후기 게시판', '자유게시판', '꿀팁 게시판')),
  filter_tag   text        null,         -- 병원후기 = 지역, 꿀팁 = 동물 카테고리
  title        text        not null,
  body         text        not null default '',
  status       text        not null default 'visible'
                           check (status in ('visible', 'hidden', 'deleted')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create trigger board_posts_set_updated_at
  before update on public.board_posts
  for each row execute function public.set_updated_at();

-- 인덱스: 내 게시글 조회 (user_id + 최신순)
create index if not exists board_posts_user_id_created_at_idx
  on public.board_posts (user_id, created_at desc);

-- 인덱스: 게시판별 최신 목록 조회
create index if not exists board_posts_board_created_at_idx
  on public.board_posts (board, created_at desc);

-- RLS 활성화
alter table public.board_posts enable row level security;

-- 정책: 본인 게시글만 insert 가능
create policy "board_posts_insert_own"
  on public.board_posts for insert
  with check (auth.uid() = user_id);

-- 정책: visible 게시글은 누구나 읽기 가능
create policy "board_posts_select_visible"
  on public.board_posts for select
  using (status = 'visible' or auth.uid() = user_id);

-- 정책: 본인 게시글만 update 가능
create policy "board_posts_update_own"
  on public.board_posts for update
  using (auth.uid() = user_id);

-- 정책: 본인 게시글만 delete 가능
create policy "board_posts_delete_own"
  on public.board_posts for delete
  using (auth.uid() = user_id);
