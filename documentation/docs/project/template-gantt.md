---
title: "Template Gantt (Mermaid)"
---

Ce modèle vous permet de créer rapidement des Gantt de planification dans la documentation, sans outil externe.

## Utilisation rapide

- Créez un bloc de code `mermaid` avec le mot-clé `gantt`.
- Définissez `dateFormat` (AAAA-MM-JJ) et éventuellement `axisFormat`.
- Organisez vos tâches par `section`.
- Indiquez l'état (`done`, `active`, ou rien) et des identifiants facultatifs.

Exemple minimal:

```mermaid
gantt
  title Exemple simple
  dateFormat  YYYY-MM-DD
  axisFormat  %d/%m
  section Phase A
  Tâche 1          :done,    a1, 2025-01-05, 3d
  Tâche 2          :active,  a2, 2025-01-09, 5d
  section Phase B
  Tâche 3          :        b1, 2025-01-15, 4d
```

## Légende des états

- `done` = terminé (barre remplie)
- `active` = en cours (barre surlignée)
- (vide) = à faire / planifié

---

## Template Sprint (2 semaines)

```mermaid
gantt
  title Sprint (2 semaines)
  dateFormat  YYYY-MM-DD
  axisFormat  %d/%m
  section Préparation
  Backlog grooming   :done, s1a, 2025-04-01, 1d
  section Exécution
  Dev + Tests        :active, s1b, 2025-04-02, 9d
  section Clôture
  Review + Release   :       s1c, 2025-04-13, 1d
```

Astuce: dupliquez ce bloc et ne modifiez que les dates de début.

---

## Template Release (notes + fenêtre de gel)

```mermaid
gantt
  title Release x.y.z
  dateFormat  YYYY-MM-DD
  axisFormat  %d/%m
  section Pré-release
  Freeze / Stabilisation : r1, 2025-05-01, 4d
  section Release
  Release window         : r2, 2025-05-05, 3d
  section Post-release
  Monitoring & Hotfix    : r3, 2025-05-08, 3d
```

Checklist release (copier-coller):

- Version: x.y.z — Date: AAAA-MM-JJ
- Nouveautés:
- Corrections:
- Migrations:
- Bugs connus:

---

## Template Migration (cutover)

```mermaid
gantt
  title Migration (cutover)
  dateFormat  YYYY-MM-DD
  axisFormat  %d/%m
  section Préparation
  Schéma & Scripts     :done, m1, 2025-02-01, 5d
  Sauvegardes          :done, m2, 2025-02-06, 1d
  section Exécution
  Export/Import        :active, m3, 2025-02-07, 3d
  section Cutover
  Bascule prod         :       m4, 2025-02-10, 1d
  section Validation
  Tests & Monitoring   :       m5, 2025-02-11, 2d
```

Checklist migration:

- Variables d'environnement validées
- Scripts d'export/import testés
- Rollback plan documenté
- Monitoring post-cutover actif

---

## Bonnes pratiques

- Gardez les Gantt concis: sections claires, noms courts.
- Mettez à jour régulièrement (dates réalistes, états exacts).
- Liez vos Gantt depuis les pages concernées (Admin, Apps, DevOps).
- Pour des besoins interactifs avancés, préférez un outil externe (Asana/Jira/Notion) et intégrez un lien depuis la doc.
