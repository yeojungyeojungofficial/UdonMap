create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  input_url text unique,
  name text not null,
  phone text,
  street_address text not null,
  region text not null,
  latitude double precision not null,
  longitude double precision not null,
  homepage text,
  instagram text,
  specialty boolean not null default false,
  emergency boolean not null default false,
  hours text[] not null default '{}',
  veterinarian_specs text[] not null default '{}',
  veterinarian_schedule jsonb,
  exotic_animals text[] not null default '{}',
  source_urls text[] not null default '{}',
  kakao jsonb,
  likes integer not null default 0 check (likes >= 0),
  review_count integer not null default 0 check (review_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hospitals_region_idx on public.hospitals (region);
create index if not exists hospitals_name_idx on public.hospitals (name);
create index if not exists hospitals_coordinates_idx on public.hospitals (latitude, longitude);

alter table public.hospitals enable row level security;

drop trigger if exists set_hospitals_updated_at on public.hospitals;

create trigger set_hospitals_updated_at
before update on public.hospitals
for each row
execute function public.set_updated_at();

drop policy if exists "Hospitals are readable by everyone" on public.hospitals;

create policy "Hospitals are readable by everyone"
on public.hospitals
for select
to anon, authenticated
using (true);

grant select on public.hospitals to anon, authenticated;
