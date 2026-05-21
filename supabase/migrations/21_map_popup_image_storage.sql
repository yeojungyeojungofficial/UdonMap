-- 우동맵 팝업 이미지 공개 Storage 버킷

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'map_popup_images',
  'map_popup_images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "map_popup_images_select_public" on storage.objects;
create policy "map_popup_images_select_public"
  on storage.objects for select
  using (bucket_id = 'map_popup_images');
