-- 우동맵 웹 팝업 공지/업데이트

create table if not exists public.map_popups (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null check (char_length(trim(title)) between 1 and 120),
  body        text        not null check (char_length(trim(body)) between 1 and 1000),
  popup_type  text        not null default 'notice'
                          check (popup_type in ('notice', 'update', 'maintenance')),
  placement   text        not null default 'all'
                          check (placement in ('home', 'map', 'all')),
  link_url    text,
  link_label  text,
  image_url   text,
  priority    integer     not null default 0,
  is_active   boolean     not null default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  dismiss_key text        not null unique default ('map-popup-' || gen_random_uuid()::text),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (starts_at is null or ends_at is null or starts_at <= ends_at)
);

drop trigger if exists map_popups_set_updated_at on public.map_popups;
create trigger map_popups_set_updated_at
  before update on public.map_popups
  for each row execute function public.set_updated_at();

create index if not exists map_popups_active_schedule_idx
  on public.map_popups (is_active, starts_at, ends_at, priority desc);

create index if not exists map_popups_updated_at_idx
  on public.map_popups (updated_at desc);

alter table public.map_popups enable row level security;

drop policy if exists "map_popups_public_active_select" on public.map_popups;
create policy "map_popups_public_active_select"
  on public.map_popups for select
  to anon, authenticated
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );
