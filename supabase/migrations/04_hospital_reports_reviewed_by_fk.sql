do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hospital_reports_reviewed_by_fkey'
      and conrelid = 'public.hospital_reports'::regclass
  ) then
    alter table public.hospital_reports
      add constraint hospital_reports_reviewed_by_fkey
      foreign key (reviewed_by)
      references auth.users (id)
      on delete set null;
  end if;
end;
$$;
