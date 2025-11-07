---
title: Schémas d’architecture (Mermaid)
sidebar_label: Architecture (schémas)
---

Cette page présente des schémas Mermaid illustrant l’architecture globale et les flux clés (Frontend, Backends, Déploiement, Sécurité).

## Vue d’ensemble — Modules principaux

```mermaid
flowchart LR
  subgraph App["Vue 3 (Vite)<br/>Pinia / PrimeVue"]
    UI["UI Components"]
    Store["Stores (Pinia)"]
    Router["Vue Router"]
  end

  App -->|REST / SDK| Supabase["Supabase<br/>Postgres / RLS"]
  App -->|SDK| Firebase["Firebase<br/>Auth / RTDB / Storage"]

  subgraph Services
    Supabase
    Firebase
  end

  classDef app fill:#0b213f,stroke:#7aa0ff,stroke-width:1px,color:#fff
  classDef svc fill:#0b213f,stroke:#f3c300,stroke-width:1px,color:#fff
  class App,UI,Store,Router app
  class Supabase,Firebase svc
```

## Flux déploiement (dev → prod)

```mermaid
sequenceDiagram
  participant Dev as Dev
  participant Vite as Build Vite
  participant Docs as Build Docusaurus
  participant VPS as VPS (Caddy/Nginx)
  participant FB as Firebase Hosting

  Dev->>Vite: npm run build
  Dev->>Docs: npm run docs:build
  Dev->>VPS: Copier artefacts (dist/)
  Dev->>FB: Déploiement si besoin
  VPS-->>Dev: URL prod
  FB-->>Dev: URL hosting
```

## Authentification & Rôles (vue d’ensemble)

```mermaid
flowchart TB
  User["Utilisateur"] --> App
  App -->|Sign-in| FirebaseAuth["Firebase Auth"]
  FirebaseAuth -->|Token| App
  App -->|Bearer token| SupabaseAPI["Supabase API"]
  SupabaseAPI -->|RLS| Postgres["Tables RLS"]
  RLSNote["RLS: filtre selon rôle / appartenance"] --- Postgres
```

## Notes

- L’app peut consommer à la fois Supabase (Postgres + RLS) et Firebase (Auth / RTDB / Storage) selon les besoins.
- Déploiement: selon les cibles, via VPS (Caddy/Nginx) et/ou Firebase Hosting.
- Sécurité: côté Supabase, privilégier RLS; côté Firebase, utiliser les règles RTDB / Storage.

## Données & migrations (Firebase → Supabase)

```mermaid
flowchart LR
  FirebaseRTDB["Firebase RTDB<br/>JSON"] -->|export| Export["NDJSON / CSV"]
  Export -->|transform| Scripts["Scripts de migration"]
  Scripts -->|import| SupabaseDB["Supabase Postgres<br/>Tables / Relations"]
  SupabaseDB -->|RLS| Policies["Policies RLS"]

  classDef node fill:#0b213f,stroke:#7aa0ff,stroke-width:1px,color:#fff
  class FirebaseRTDB,Export,Scripts,SupabaseDB,Policies node
```
