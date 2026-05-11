alter table public.hospital_reports
add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists hospital_reports_user_id_created_at_idx
on public.hospital_reports (user_id, created_at desc);
