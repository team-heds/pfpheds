---
title: Services Supabase
---

## Principe

Les accès Supabase doivent rester centralisés dans les services métier ou dans des stores bien identifiés.

## Niveaux concernés

- `src/service/`
- `src/stores/`
- `backend/supabase/` côté serveur

## Bonnes pratiques

- éviter les requêtes brutes dispersées dans les vues
- laisser les vues orchestrer, pas porter la logique de données
- penser RLS et permissions au moment de la requête, pas après

## Exemples de services critiques

- `rolesService.js`
- `studentsService.js`
- `planningService.js`
- `resultatVotationService.js`
- `gamificationServiceSupabase.js`
