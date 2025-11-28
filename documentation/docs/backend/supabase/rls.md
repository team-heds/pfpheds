---
title: "Supabase RLS & Sécurité"
---

Aperçu des règles RLS (Row‑Level Security) utilisées côté Supabase/Postgres.

- RLS activée sur les tables clés: `user_profiles`, `gamification_data`, `institutions`, `places`.
- Policies d’exemple créées dans les migrations SQL (lecture authenticated/anon, écriture `service_role`, etc.).
- Les permissions applicatives sont exposées via des fonctions RPC (ex: `get_user_permissions`) et consommées par le front (`useRoleStore`).

Pour le détail des patterns, exemples de policies et bonnes pratiques, voir `security/supabase-rls`.

Références:
- Répertoire migrations: `supabase_migrations/`
- Schéma: `data/schema-supabase`
