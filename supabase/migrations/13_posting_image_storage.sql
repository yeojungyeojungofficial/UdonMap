-- posting_image 버킷 Storage RLS 정책
-- 버킷은 Supabase 대시보드에서 이미 생성됨 (public bucket)

-- 로그인 사용자는 자신의 폴더(user_id/)에 업로드 가능
create policy "posting_image_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'posting_image'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- public 버킷이므로 누구나 읽기 가능
create policy "posting_image_select_public"
  on storage.objects for select
  using (bucket_id = 'posting_image');

-- 본인이 올린 파일만 삭제 가능
create policy "posting_image_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'posting_image'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
