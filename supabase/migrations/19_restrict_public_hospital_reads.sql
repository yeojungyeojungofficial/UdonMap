drop policy if exists "Hospitals are readable by everyone" on public.hospitals;
drop policy if exists "Hospital comments are readable by everyone" on public.hospital_comments;

revoke select on public.hospitals from anon, authenticated;
revoke select on public.hospital_comments from anon, authenticated;

grant select on public.hospitals to service_role;
grant select on public.hospital_comments to service_role;
