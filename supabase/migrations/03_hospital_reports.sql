create table if not exists public.hospital_reports (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals (id) on delete set null,
  hospital_name text not null,
  street_address text not null,
  animal_categories text[] not null default '{}',
  animal_species text,
  details text,
  attachment_metadata jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'in_review', 'approved', 'rejected')),
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hospital_reports_status_idx on public.hospital_reports (status);
create index if not exists hospital_reports_created_at_idx on public.hospital_reports (created_at desc);
create index if not exists hospital_reports_hospital_name_idx on public.hospital_reports (hospital_name);

alter table public.hospital_reports enable row level security;

drop trigger if exists set_hospital_reports_updated_at on public.hospital_reports;

create trigger set_hospital_reports_updated_at
before update on public.hospital_reports
for each row
execute function public.set_updated_at();

grant select, insert, update, delete on public.hospital_reports to service_role;
