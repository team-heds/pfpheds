---
title: Documentation HEdS
slug: /landing
hide_table_of_contents: true
---

import Link from '@docusaurus/Link';

<div className="docs-hero">
  <h1 className="docs-hero__title">Plateforme HEdS — Documentation</h1>
  <p className="docs-hero__subtitle">Tout pour développer, configurer et déployer la plateforme</p>
  <div className="docs-hero__cta">
    <Link className="button button--primary button--lg" to="/docs/getting-started">Commencer</Link>
    <Link className="button button--secondary button--lg" to="/docs/architecture">Architecture</Link>
  </div>
  <div className="docs-hero__meta">
    <span className="badge">Vue 3</span>
    <span className="badge">Vite</span>
    <span className="badge">Firebase</span>
    <span className="badge">Supabase</span>
  </div>
  <div className="docs-hero__hint">Astuce: cliquez sur "Accueil" dans la barre pour ouvrir la doc avec la sidebar</div>
  
</div>

<div className="docs-grid">
  <a className="docs-card" href="/docs/frontend/structure">
    <h3>Frontend (Vue 3)</h3>
    <p>Structure, routing, state (Pinia), UI</p>
  </a>
  <a className="docs-card" href="/docs/backend/supabase/overview">
    <h3>Backends</h3>
    <p>Firebase & Supabase: services, auth, RLS, migrations</p>
  </a>
  <a className="docs-card" href="/docs/admin/dashboard">
    <h3>Administration</h3>
    <p>Dashboard, utilisateurs, institutions, votations</p>
  </a>
  <a className="docs-card" href="/docs/apps/notes">
    <h3>Applications</h3>
    <p>Chat, Mail, Notes (TipTap), Calendar, Files, Events</p>
  </a>
  <a className="docs-card" href="/docs/gamification/quests">
    <h3>Gamification</h3>
    <p>Quêtes, défis, maisons HES, admin</p>
  </a>
  <a className="docs-card" href="/docs/map/overview">
    <h3>Carte & Institutions</h3>
    <p>Fiches, filtres, navigation, lieux</p>
  </a>
  <a className="docs-card" href="/docs/media/modules">
    <h3>Médias & Vimeo</h3>
    <p>Modules, vidéos, configuration, services</p>
  </a>
  <a className="docs-card" href="/docs/devops/firebase-hosting">
    <h3>Déploiement & DevOps</h3>
    <p>Firebase Hosting, VPS Caddy/Nginx, Docker, CI/CD</p>
  </a>
</div>
