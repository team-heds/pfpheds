---
title: Supabase - vue d'ensemble
---

## Ce n'est pas Supabase Cloud

Variable réelle du `.env` racine :

```
SUPABASE_REST_URL=https://api2.hedsvs.ch/rest/v1
VITE_SUPABASE_URL=https://api2.hedsvs.ch
```

`api2.hedsvs.ch` est un domaine propre à l'établissement (HES-SO Valais), pas `*.supabase.co`. C'est une stack Supabase **self-hosted** (Postgres + PostgREST + GoTrue + Storage API + Realtime, probablement via Docker, derrière un reverse-proxy Infomaniak). Conséquences concrètes vécues :

1. **Aucun outil MCP Supabase Cloud ne voit ce projet** (`list_projects` ne le liste pas). Toute inspection de schéma nécessite soit l'API REST directe, soit un script Node avec le service role.
2. **Les nouvelles tables et le nouveau storage n'héritent pas automatiquement des grants PostgREST** attendus sur une instance Cloud standard — voir la section Storage ci-dessous et `20260610_fix_storage_grants_self_hosted.sql`. Ce n'est pas une fatalité universelle des instances self-hosted, mais un point à vérifier systématiquement après `CREATE TABLE` sur *cette* instance précise.
3. **La création de compte via `auth.admin.createUser()`** (API admin GoTrue) produit un compte dont le login échoue ensuite avec `invalid_grant` de façon reproductible sur cette instance — contourné en utilisant le flux `signUp()` public suivi d'une confirmation email forcée via `updateUserById({ email_confirm: true })`. Observé et reproduit le 2026-07-14 (voir `troubleshooting/user-provisioning.md`).

## Client frontend (`src/supabase.js`)

```js
import { createClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY

// Garde-fou : normalise une URL mal configurée avec /rest/v1 en suffixe
if (supabaseUrl && /\/rest\/v1\/?$/i.test(supabaseUrl)) {
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/i, '')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
  },
})
```

Ce client utilise la clé **anon** (`VITE_SUPABASE_KEY`) — toute écriture depuis le frontend passe donc par RLS, jamais par un bypass.

## Client backend (`backend/supabaseClient.js`) — deux exports différents, piège fréquent

```js
const supabase = createClient(supabaseUrl, baseClientKey);      // clé anon (ou service si anon absente)

const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : supabase;

module.exports = supabase;               // export par défaut = client ANON
module.exports.supabaseAdmin = supabaseAdmin;  // export nommé = client SERVICE ROLE (bypass RLS + accès auth.admin.*)
```

**Piège vérifié en pratique (2026-07-14)** : un script qui fait `const supabase = require('./supabaseClient')` récupère le client **anon**, pas le client admin. Appeler `supabase.auth.admin.listUsers()` sur ce client échoue avec `"User not allowed"` — pas une erreur réseau, une erreur de permission côté GoTrue liée à l'usage de la mauvaise clé. Le bon accès est `const { supabaseAdmin } = require('./supabaseClient')`.

## Storage : bucket + policy ne suffisent pas sur cette instance

Sur Supabase self-hosted, l'API Storage passe par les tables `storage.buckets` et `storage.objects`, mais **les rôles PostgREST (`anon`, `authenticated`, `service_role`) n'ont par défaut aucun privilège SQL sur ces tables** tant qu'un `GRANT` explicite n'est pas fait — indépendamment des policies RLS définies dessus. C'est documenté noir sur blanc dans une migration dédiée :

```sql
-- supabase/migrations/20260610_fix_storage_grants_self_hosted.sql
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT SELECT ON TABLE storage.buckets TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE storage.buckets TO service_role;
GRANT SELECT ON TABLE storage.objects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage.objects TO authenticated;
GRANT ALL PRIVILEGES ON TABLE storage.objects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
```

**Règle à appliquer pour tout futur bucket** : créer le bucket + les policies RLS (`CREATE POLICY ... ON storage.objects`) **ne suffit pas** sur cette instance. Il faut vérifier que les `GRANT` ci-dessus couvrent bien les tables concernées, sinon les requêtes échouent avec des erreurs de permission opaques côté client (souvent un simple 400/403 sans détail).

## Fichiers backend Node qui parlent à Supabase

| Fichier | Rôle |
| --- | --- |
| `backend/supabaseClient.js` | Fabrique des deux clients (anon / admin) |
| `backend/supabase/importUsers.js` | Import batch Firebase → Supabase (`auth.admin.createUser` + upsert `user_profiles`) |
| `backend/seed_demo_ba00.js` | Script de seed de démo |

## Conséquence de maintenance

Une évolution du schéma Supabase peut impacter simultanément : `roleStore` (permissions), les policies RLS, les 48 services de `src/service/`, et **directement les vues** — voir `backend/supabase/services.md` pour la mesure exacte de contournement de la couche service.
