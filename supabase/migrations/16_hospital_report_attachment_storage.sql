-- hospital_report_attachments 버킷 Storage RLS 정책
-- 병원 제보 사진은 공개 콘텐츠가 아니므로 private bucket으로 둔다.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hospital_report_attachments',
  'hospital_report_attachments',
  false,
  5242880,
  array['image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "hospital_report_attachments_insert_own" on storage.objects;
drop policy if exists "hospital_report_attachments_select_own" on storage.objects;
drop policy if exists "hospital_report_attachments_select_public" on storage.objects;
drop policy if exists "hospital_report_attachments_delete_own" on storage.objects;

create policy "hospital_report_attachments_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'hospital_report_attachments'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "hospital_report_attachments_select_own"
  on storage.objects for select
  using (
    bucket_id = 'hospital_report_attachments'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "hospital_report_attachments_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'hospital_report_attachments'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
