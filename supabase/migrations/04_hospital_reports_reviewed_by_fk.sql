alter table public.hospital_reports
  add constraint hospital_reports_reviewed_by_fkey
  foreign key (reviewed_by)
  references auth.users (id)
  on delete set null;
