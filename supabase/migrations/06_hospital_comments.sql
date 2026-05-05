create table if not exists public.hospital_comments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 600),
  like_count integer not null default 0 check (like_count >= 0),
  status text not null default 'visible' check (status in ('visible', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hospital_comments_hospital_id_created_at_idx
on public.hospital_comments (hospital_id, created_at desc);

create index if not exists hospital_comments_user_id_idx
on public.hospital_comments (user_id);

create index if not exists hospital_comments_status_idx
on public.hospital_comments (status);

alter table public.hospital_comments enable row level security;

drop trigger if exists set_hospital_comments_updated_at on public.hospital_comments;

create trigger set_hospital_comments_updated_at
before update on public.hospital_comments
for each row
execute function public.set_updated_at();

drop policy if exists "Hospital comments are readable by everyone" on public.hospital_comments;

create policy "Hospital comments are readable by everyone"
on public.hospital_comments
for select
to anon, authenticated
using (status = 'visible');

grant select on public.hospital_comments to anon, authenticated;
grant select, insert, update, delete on public.hospital_comments to service_role;
