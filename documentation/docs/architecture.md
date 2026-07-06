---
id: architecture
title: Architecture globale
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Vue d'ensemble</div>
    <h2 class="docs-section-head__title">Les trois couches à garder en tête</h2>
  </div>
  <p class="docs-section-head__text">
    Toute reprise du projet doit relier l'interface, la logique métier et la vraie source de données.
  </p>
</div>

<div class="feature-strip">
  <div class="feature-strip__item"><span class="feature-strip__icon">◆</span><span>Frontend Vue 3</span></div>
  <div class="feature-strip__item"><span class="feature-strip__icon">◆</span><span>Services métier & stores</span></div>
  <div class="feature-strip__item"><span class="feature-strip__icon">◆</span><span>Firebase, Supabase, backend</span></div>
</div>

## Résumé

Le projet est une application Vue 3 qui agrège plusieurs domaines métier et utilise :

- Firebase pour une partie legacy
- Supabase comme cible principale
- un backend Node/Express pour certaines API et intégrations

## Schéma

```mermaid
flowchart LR
  U[Utilisateurs] --> F[Frontend Vue 3]
  F --> R[Vue Router]
  F --> S[Stores Pinia]
  S --> M[Services métier]
  M --> FB[Firebase]
  M --> SB[Supabase]
  F --> API[Backend Express]
  API --> SB
```

## Fichiers structurants

- `src/main.js`
- `src/router.js`
- `src/firebase.js`
- `src/supabase.js`
- `backend/index.js`
- `supabase/migrations/`
