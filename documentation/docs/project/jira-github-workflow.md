---
title: Workflow Jira ↔ GitHub
sidebar_label: Jira ↔ GitHub
---

Ce guide décrit le workflow projet entre Jira (Kanban/Sprints) et GitHub.

## Vue d’ensemble

- Planification dans Jira (Kanban classique par Sprint)
- Développement dans GitHub (branches par ticket)
- PRs liées aux tickets (clef Jira dans le titre et/ou commits)
- Déploiement via GitHub Actions (branche `prod`)

## Board Jira (Kanban/Sprint)

- Colonnes typiques: Backlog → À faire → En cours → En revue → Fait
- Sprint: 1-2 semaines (au choix)
- Definition of Done: PR fusionnée + build OK + déployé (ou prêt à déployer) + doc à jour si nécessaire

## Branching & Naming

- Branches par ticket:
  - `feature/JIRA-123-ajouter-filtre-carte`
  - `fix/JIRA-456-corriger-erreur-auth`
- PR: `JIRA-123: Ajouter filtre carte`
- Commits: commencer par la clef si possible `JIRA-123: message court`

## Lier Jira et GitHub

- Dans Jira: intégrer le repo GitHub (GitHub for Jira)
- La clef dans les commits/PR permet l’auto‑liaison (smart commits)

## Cycle d’une tâche

1. Prendre un ticket (assignation) → passe en "En cours"
2. Créer la branche Git correspondante
3. Développer, tests locaux, mise à jour docs si besoin
4. Ouvrir une PR → passe en "En revue"
5. Relecture / Corrections → merge PR
6. CI: build & déploiement si sur branche `prod` (ou staging si existant)
7. Ticket → "Fait"

## Rituels (conseils)

- Stand‑up rapide (quotidien)
- Revue de sprint et rétrospective
- Grooming du backlog

## Assets & Captures

- Intégrer des captures dans les tickets
- Joindre des images dans la doc (`documentation/static/img/`) et référencer via `/img/...`

## Notes

- Si tu veux, je peux intégrer des captures (screens Jira/Kanban) que tu me fournis et les lier ici.
