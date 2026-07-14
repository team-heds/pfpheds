---
title: Supabase RLS et sécurité
---

## Principe

RLS (`Row Level Security`) est le seul niveau qui protège les données si le front, le router ou `roleStore` sont contournés (appel direct à l'API REST avec la clé anon, par exemple via `curl` ou Postman). C'est le niveau 4 de la chaîne décrite dans `auth/overview.md`.

## Policies storage réellement en place (3 buckets, patterns différents)

### `institutions` — écriture ouverte à tout authentifié

```sql
-- 20260609_enable_institutions_storage.sql
CREATE POLICY "institutions_images_select_public" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'institutions');

CREATE POLICY "institutions_images_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'institutions');

CREATE POLICY "institutions_images_update_authenticated" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'institutions') WITH CHECK (bucket_id = 'institutions');

CREATE POLICY "institutions_images_delete_authenticated" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'institutions');
```

**N'importe quel utilisateur authentifié peut insérer, modifier ou supprimer n'importe quel fichier du bucket `institutions`**, pas seulement ceux qu'il a lui-même uploadés — il n'y a aucune restriction par dossier ou par propriétaire, contrairement aux deux buckets suivants. Le commentaire dans la migration précise même que des policies plus restrictives (`_insert_admin`, `_update_admin`, `_delete_admin`) ont été `DROP`-ées avant d'être remplacées par ces versions ouvertes — c'est un changement de politique volontaire et récent, pas un oubli, mais ça reste le bucket le moins restreint des trois.

### `avatars` et `student-documents` — écriture restreinte au propriétaire (pattern identique)

```sql
-- 20260610_enable_avatars_storage.sql (idem pour student-documents avec bucket_id différent)
CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own_folder" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own_folder" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_delete_own_folder" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

Le contrôle d'accès repose sur `storage.foldername(name)[1]` — le **premier segment du chemin du fichier doit être égal à `auth.uid()`**. Convention implicite : tout code qui upload dans ces deux buckets **doit** préfixer le chemin par l'UUID de l'utilisateur (`{user_id}/avatar.png`), sinon l'upload échoue avec une erreur RLS. C'est vérifié côté client dans `src/service/supabaseStorageService.js` (utilisé par `CardNameProfile.vue` pour l'upload d'avatar).

Config des buckets (limites réelles) :

| Bucket | Public | Taille max | MIME autorisés |
| --- | --- | --- | --- |
| `institutions` | oui | 5 MB | jpeg, png, webp, gif |
| `avatars` | oui | 5 MB | jpeg, png, webp, gif |
| `student-documents` | oui | 10 MB | pdf, jpeg, png, gif |

Les trois buckets sont **publics en lecture** (`FOR SELECT TO public`) — n'importe qui connaissant l'URL peut lire un fichier sans authentification, y compris les documents étudiants. Ce n'est pas une fuite si les URLs sont non devinables (tokens signés Supabase), mais ça signifie qu'il n'y a **aucun contrôle d'accès en lecture** basé sur l'identité — à garder en tête si un document doit un jour devenir confidentiel.

## Grants SQL requis en plus des policies (spécifique self-hosted)

Voir `backend/supabase/overview.md` pour le détail — retenir la règle : sur cette instance, `CREATE POLICY` seul ne suffit jamais pour le storage, il faut aussi les `GRANT` sur `storage.buckets` / `storage.objects` / `storage.s3_multipart_uploads*`.

## Tables où l'existence a été vérifiée mais l'accès `service_role` est bloqué

Vérifié en base le 2026-07-14 (voir `auth/security-services-legacy.md`) : `user_roles` et `user_track_roles` répondent `42501 permission denied for table` au `service_role` — signature d'un `GRANT` manquant, identique au problème storage déjà rencontré et corrigé une fois. Si un jour un flux applicatif dépend réellement de ces deux tables (actuellement leur usage effectif est marginal, voir `auth/overview.md`), il faudra une migration `GRANT` du même type que `20260610_fix_storage_grants_self_hosted.sql`.

## Ce que RLS ne protège pas

Le backend Node (`backend/supabaseClient.js` → `supabaseAdmin`) utilise le **service role**, qui **bypass RLS entièrement**. Toute route backend qui expose une opération utilisant `supabaseAdmin` doit donc réimplémenter elle-même le contrôle d'accès (vérification de session/permission côté Express), RLS ne le fera pas à sa place. C'est le cas de la création de comptes admin (`auth.admin.createUser`), qui n'est protégée par aucune policy — la seule barrière est la possession de la clé `SUPABASE_SERVICE_ROLE_KEY`.

## Zones critiques à auditer avant modification

| Table / bucket | Sensibilité | Pourquoi |
| --- | --- | --- |
| `user_profiles` | Très haute | Source de vérité des permissions (`role`, `permissions`) — voir `auth/overview.md` |
| `student-documents` (storage) | Haute | Documents étudiants nominatifs, lecture publique sans auth |
| `student_result_vote`, `votation_sessions` | Haute | Résultats d'attribution de places PFP, impact direct sur les étudiants |
| `institutions` (storage) | Moyenne | Écriture ouverte à tout authentifié, pas de restriction par propriétaire |
| `avatars` (storage) | Faible | Restreint par dossier utilisateur, impact limité en cas d'abus |

## Réflexe d'audit avant modification d'une table sensible

1. `SELECT` : qui peut lire une ligne qui n'est pas la sienne ?
2. `INSERT` : la policy vérifie-t-elle `auth.uid()` contre une colonne `user_id`/`owner_id`, ou est-elle ouverte à tout `authenticated` (comme `institutions`) ?
3. `UPDATE`/`DELETE` : mêmes questions, et vérifier si `USING` et `WITH CHECK` sont bien tous les deux définis (un `UPDATE` sans `WITH CHECK` peut permettre de modifier une ligne pour qu'elle appartienne ensuite à quelqu'un d'autre).
4. Le backend contourne-t-il RLS pour ce flux via `supabaseAdmin` ? Si oui, où est le contrôle d'accès équivalent côté Express ?
