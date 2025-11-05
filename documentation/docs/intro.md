---
id: intro
title: Introduction
slug: /
---

Bienvenue dans la documentation technique de la Plateforme HEdS.

Cette documentation couvre:

- Architecture générale (frontend Vue 3 + Vite, Firebase/Supabase, services)
- Administration (utilisateurs, institutions, places, votations)
- Applications intégrées (chat, mail, notes, calendrier, files, events, tools)
- Gamification (maisons, défis, quêtes, badges, analytics)
- Déploiement et variables d'environnement

```mermaid
graph TD;
  A[Client - Vue 3] -->|Vue Router + Pinia| B[App]
  B --> C[Firebase]
  B --> D[Supabase]
  C --> E[Auth / DB / Storage]
  D --> F[Auth / Postgres / Storage]
```
