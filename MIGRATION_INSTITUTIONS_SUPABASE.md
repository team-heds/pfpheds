# Migration des institutions vers Supabase

## 1. Objectif

Migrer les données d'institutions actuellement stockées dans Firebase Realtime Database vers la table `institutions` de Supabase et aligner le front (`src/views/institutions/Institution.vue`) et les stores (`src/stores/institutionsStore.js`) sur cette nouvelle source.

## 2. Prérequis

- Accès au projet Supabase (console + clé anon + service role si besoin).
- Accès au projet Firebase HEdS et export JSON des institutions (`backend/firebasedata/pfpheds-default-rtdb-export.json`).
- Variables d'environnement configurées :
  - `VITE_SUPABASE_REST_URL`
  - `VITE_SUPABASE_KEY`
  - (optionnel pour scripts d'import) `SUPABASE_SERVICE_ROLE`.
- `supabase` CLI ou `psql` disponible pour pousser les migrations.

## 3. Création du schéma Supabase

1. Ajouter une migration SQL dans `supabase_migrations/` (ex. `20251028_create_institutions.sql`).
2. Contenu suggéré :
   ```sql
   create table if not exists public.institutions (
     "InstitutionId" text primary key,
     "Name" text not null,
     "Category" text,
     "Address" text,
     "Locality" text,
     "Canton" text,
     "NPA" text,
     "Language" text,
     "Description" text,
     "URL" text,
     "CyberleanURL" text,
     "MailChef" text,
     "NomChef" text,
     "PhoneChef" text,
     "IdResponsablePhysio" text,
     "AccordCadreDate" date,
     "AccordCadrePDF" text,
     "ConventionDate" date,
     "ConventionPDF" text,
     "ImageURL" jsonb default '[]'::jsonb,
     "Latitude" numeric,
     "Longitude" numeric,
     "CreatedAt" timestamptz default now(),
     "UpdatedAt" timestamptz default now()
   );

   create trigger set_updated_at
     before update on public.institutions
     for each row
     execute procedure public.set_current_timestamp_updated_at();

   alter table public.institutions enable row level security;
   ```
3. Définir les politiques RLS (lecture ouverte ou filtrée selon les rôles). Exemple de lecture publique :
   ```sql
   create policy "Institutions read access"
     on public.institutions
     for select
     using (true);
   ```
4. Pousser la migration :
   ```bash
   supabase db push
   ```

## 4. Export Firebase

1. Depuis la console Firebase, exporter le nœud `institutions` au format JSON ou utiliser l’export existant : `backend/firebasedata/pfpheds-default-rtdb-export.json`.
2. Vérifier la structure (champs `Name`, `Locality`, `Canton`, `Language`, `Description`, `URL`, `ImageURL`, etc.).

## 5. Script d’import vers Supabase

1. Utiliser le script Node `backend/supabase/importInstitutions.js` (mis à jour). Il :
   - accepte une variable `INSTITUTIONS_JSON_PATH` (par défaut `backend/firebasedata/pfpheds-default-rtdb-export.json`)
   - convertit les dates au format ISO (`YYYY-MM-DD`)
   - normalise `ImageURL` en tableau JSON
   - caste les coordonnées en `numeric`
   - upsert via PostgREST avec `onConflict: 'InstitutionId'`
2. Exécution :
   ```bash
   INSTITUTIONS_JSON_PATH=./backend/firebasedata/pfpheds-default-rtdb-export.json \
   SUPABASE_URL=https://xxx.supabase.co \
   SUPABASE_SERVICE_ROLE=... \
   node backend/supabase/importInstitutions.js
   ```
3. Vérifier le résultat dans la console Supabase (`select * from institutions limit 5`).

## 6. Ajustements frontend

1. Vérifier que `src/stores/institutionsStore.js` pointe bien sur Supabase (déjà le cas) et que `VITE_SUPABASE_*` sont présents.
2. Tester `Institution.vue` : `npm run dev` → `/institutions` → vérifier le listing.
3. Supprimer les appels résiduels à Firebase pour les institutions si encore présents (chercher `firebase.database()` ou `ref` liés aux institutions).
4. Mettre à jour la recherche globale (`src/components/common/utils/GlobalSearch.vue`) pour interroger la table Supabase (via un service dédié) au lieu de Firebase.

## 7. Validation post-migration

- Comparer le nombre d’institutions (Supabase vs ancien export).
- Tester les filtres (cantons, langues, PFP). Adapter si certains filtres nécessitent des tables annexes.
- Vérifier l’admin (`src/views/admin/...`) et les pages dépendantes (`InstitutionListView.vue`, `PlaceManagementView.vue`).
- Monitorer les logs Supabase (erreurs RLS, insert bloqués).

## 8. Nettoyage & suivi

- Retirer les exports/données Firebase devenues obsolètes après validation.
- Documenter les nouvelles instructions dans `DEPLOIEMENT.md` et `SEARCH_IMPROVEMENTS.md`.
- Planifier la migration des autres entités liées (ex. posts) selon le même processus.
