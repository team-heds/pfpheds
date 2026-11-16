-- Sécurité : limiter les dépôts de médias de stories pour protéger le disque du serveur.
--
-- Faille corrigée : le compartiment « stories » (20261110170000) accepte des fichiers de
-- 30 Mo sans limite de nombre. Les médias des stories expirées ne sont pas effacés. Un
-- étudiant pouvait, par un simple script, déposer quelques centaines de vidéos et remplir le
-- disque du serveur (environ 5 Go libres le 16.11.2026), ce qui arrête toute la plateforme.
--
-- Maintenant, chaque compte peut déposer au plus 6 médias de story par 24 heures et 40 par
-- 30 jours (largement au-delà d'un usage normal). Au-delà, le dépôt est refusé. Le reste de
-- la règle est inchangé (dépôt seulement dans son propre dossier).

create or replace function private.story_upload_quota_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      select count(*) filter (where o.created_at > now() - interval '24 hours') < 6
         and count(*) < 40
      from storage.objects o
      where o.bucket_id = 'stories'
        and o.name like (select auth.uid())::text || '/%'
        and o.created_at > now() - interval '30 days'
    );
$$;

revoke all on function private.story_upload_quota_ok() from public, anon;
grant execute on function private.story_upload_quota_ok() to authenticated;

alter policy stories_media_insert_own_folder
  on storage.objects
  with check (
    bucket_id = 'stories'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select private.story_upload_quota_ok())
  );
