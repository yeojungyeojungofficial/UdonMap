alter table public.hospital_reports
add column if not exists reporter_email text,
add column if not exists contact_info text,
add column if not exists marketing_consent boolean not null default false;

update public.hospital_reports hr
set reporter_email = p.email
from public.profiles p
where hr.user_id = p.id
  and hr.reporter_email is null
  and p.email is not null;

create index if not exists hospital_reports_reporter_email_idx
on public.hospital_reports (reporter_email);

create index if not exists hospital_reports_marketing_consent_idx
on public.hospital_reports (marketing_consent)
where marketing_consent = true;
