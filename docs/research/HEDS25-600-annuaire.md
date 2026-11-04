# Complément HEDS25-600 — Annuaire étudiant par année

## Cause vérifiée

`backend/supabase/audienceDirectoryBackend.js`, `loadPhysioByUserId`, lit toutes
les lignes StudentsPhysio sans champ `year` ni tri puis construit une Map par
user_id. Une ligne historique peut donc remplacer celle de la campagne.
`mapStudent` utilise cette ligne pour classe, SAE et répondant : sélectionner
seulement le dernier répondant non vide mélangerait plusieurs années.

`src/service/studentDirectoryService.js` possède un cache unique de cinq minutes
et appelle `/audiences/students` sans année. Les vues de votation normale et
prioritaire appellent `getAllStudents()` sans paramètre malgré leur année de campagne.
Tests existants : `tests/unit/studentDirectoryService.spec.js` (API et cache).
Le backend utilise node:test via `backend/package.json`.
Le contrat partagé `backend/domain/academicPeriod.mjs` normalise année académique
et clé de fin d'année ; aucune nouvelle convention annuelle n'est nécessaire.

## Constat métier déjà vérifié en lecture seule

Les deux dossiers signalés possèdent un répondant en 2026 et 2027 ; le champ
est vide sur leurs lignes 2025. Aucune donnée nominative n'est nécessaire aux tests.
Ne pas remplir rétrospectivement 2025 pour masquer le défaut de lecture.

## Risques et limites

Préserver filtres d'audience, authentification et priorité de la classe issue de
StudentsPhysio. Ne pas substituer silencieusement une autre année quand une
campagne explicite n'a pas de ligne. Signaler les doublons d'une même année.
Les appels sans année doivent conserver une convention documentée, distincte
des requêtes de campagne. Aucune migration, permission ou donnée à modifier.
