# Baseline Supabase canonique

Cette baseline décrit le schéma de production observé en lecture seule le 24 août 2026. Elle ne contient aucune donnée métier et ne doit jamais être exécutée sur la production existante.

## Artefacts

- `public-schema.sql` : DDL, types, tables, vues, fonctions, policies, grants, triggers et contraintes du seul schéma exposé `public`.
- `internal-dependencies.sql` : extensions publiques et quelques dépendances `auth`/`storage` nécessaires pour reconstruire `public` sur une stack Supabase neuve.
- `catalog.json` : catalogue structuré des relations, fonctions, policies, grants, triggers, clés étrangères et dépendances de vues.
- `stack.json` : versions de la stack self-hosted, schémas exposés/internes, nombres d’objets et empreintes SHA-256.
- `canonical-migrations-manifest.json` : empreintes des migrations déjà déployées dans `supabase/migrations`; elles sont immuables.
- `legacy-sql-manifest.json` : empreintes des anciennes lignées SQL, conservées uniquement pour l’historique et interdites à toute évolution.

## Commandes

Vérification locale et CI, sans accès à la production :

```powershell
npm run db:schema:check
```

Nouvel export en lecture seule :

```powershell
./scripts/supabase/export-schema-baseline.ps1 -SSHHost <user@host> -SSHKey <chemin-cle>
```

Test de restauration dans un conteneur Supabase éphémère isolé :

```powershell
./scripts/supabase/test-schema-restore.ps1 -SSHHost <user@host> -SSHKey <chemin-cle>
```

Le test attend l’initialisation complète de l’image, neutralise uniquement ses event triggers internes dans le conteneur temporaire, applique les dépendances puis le dump, compare les nombres d’objets et supprime le conteneur. Il ne se connecte jamais à la base de production.

## Règles pour les futures migrations

1. Créer toute nouvelle migration avec la CLI Supabase dans `supabase/migrations/`.
2. Utiliser un timestamp UTC complet sur 14 chiffres et un nom en `snake_case`.
3. Ne jamais modifier, supprimer ou renommer une migration déjà déployée : la CI compare la branche à `prod` et n'autorise que les nouveaux fichiers append-only.
4. Toute opération destructive (`DROP`, `ALTER … DROP`, `TRUNCATE`, `DELETE`, `UPDATE`, désactivation RLS) est bloquée par défaut. Une exception exige une validation humaine, une justification et une empreinte explicite.
5. Ne rien ajouter sous `migrations/`, `src/database/migrations/`, `backend/supabase/migrations/` ou `sql/`.
6. Tester d’abord sur une base éphémère ou staging. Ne jamais utiliser une commande de reset liée à la production.

## Stack inventoriée

- PostgreSQL 15.6 (`supabase/postgres:15.6.1.101`).
- PostgREST 12.2.3, avec `PGRST_DB_SCHEMAS=public`.
- Gateway actuelle : Caddy 2.8.
- Schémas internes distingués : `auth`, `realtime`, `storage`.

La migration vers PostgreSQL 17 ou vers Envoy est volontairement exclue de cette baseline : ces mises à niveau self-hosted sont cassantes et doivent être réalisées dans des tickets dédiés avec sauvegarde et procédure de retour arrière.
