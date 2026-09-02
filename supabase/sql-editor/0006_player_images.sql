begin;

alter table public.players
  add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('player-images', 'player-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can view player images" on storage.objects;
create policy "Authenticated users can view player images" on storage.objects for select to authenticated
using (bucket_id = 'player-images');

drop policy if exists "Admins and importers can upload player images" on storage.objects;
create policy "Admins and importers can upload player images" on storage.objects for insert to authenticated
with check (bucket_id = 'player-images' and public.current_user_role() in ('admin', 'importer'));

drop policy if exists "Admins and importers can update player images" on storage.objects;
create policy "Admins and importers can update player images" on storage.objects for update to authenticated
using (bucket_id = 'player-images' and public.current_user_role() in ('admin', 'importer'))
with check (bucket_id = 'player-images' and public.current_user_role() in ('admin', 'importer'));

drop policy if exists "Admins and importers can delete player images" on storage.objects;
create policy "Admins and importers can delete player images" on storage.objects for delete to authenticated
using (bucket_id = 'player-images' and public.current_user_role() in ('admin', 'importer'));

commit;
