create table if not exists public.hospital_bookmarks (
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (hospital_id, user_id)
);

create index if not exists hospital_bookmarks_user_id_created_at_idx
on public.hospital_bookmarks (user_id, created_at desc);

alter table public.hospital_bookmarks enable row level security;

drop policy if exists "Hospital bookmarks are readable by owner" on public.hospital_bookmarks;

create policy "Hospital bookmarks are readable by owner"
on public.hospital_bookmarks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Hospital bookmarks are insertable by owner" on public.hospital_bookmarks;

create policy "Hospital bookmarks are insertable by owner"
on public.hospital_bookmarks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Hospital bookmarks are deletable by owner" on public.hospital_bookmarks;

create policy "Hospital bookmarks are deletable by owner"
on public.hospital_bookmarks
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, delete on public.hospital_bookmarks to authenticated;
