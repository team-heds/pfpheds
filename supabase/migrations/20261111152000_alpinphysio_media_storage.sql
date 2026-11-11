-- Alp'in Physio : espace de stockage des photos choisies depuis l'ordinateur
-- (événements et page publique) et du contrat de partenariat (PDF).
--
-- Lecture publique (les fichiers illustrent la page publique). Envoi,
-- remplacement et retrait réservés aux responsables Alp'in Physio.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'alpinphysio', 'alpinphysio', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'alpinphysio_media_public_read') then
    create policy alpinphysio_media_public_read on storage.objects
      for select to public
      using (bucket_id = 'alpinphysio');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'alpinphysio_media_manager_insert') then
    create policy alpinphysio_media_manager_insert on storage.objects
      for insert to authenticated
      with check (bucket_id = 'alpinphysio' and (select public.app_is_alpinphysio_manager()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'alpinphysio_media_manager_update') then
    create policy alpinphysio_media_manager_update on storage.objects
      for update to authenticated
      using (bucket_id = 'alpinphysio' and (select public.app_is_alpinphysio_manager()))
      with check (bucket_id = 'alpinphysio' and (select public.app_is_alpinphysio_manager()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'alpinphysio_media_manager_delete') then
    create policy alpinphysio_media_manager_delete on storage.objects
      for delete to authenticated
      using (bucket_id = 'alpinphysio' and (select public.app_is_alpinphysio_manager()));
  end if;
end
$policies$;
