---
title: Documentation HEdS
slug: /landing
hide_table_of_contents: true
---

import Link from '@docusaurus/Link';

<div className="docs-hero docs-hero--split">
  <div className="docs-hero__content">
    <div className="docs-kicker">Documentation technique</div>
    <h1 className="docs-hero__title">Plateforme HEdS</h1>
    <p className="docs-hero__subtitle">
      Une documentation de reprise pensée comme un vrai cockpit technique :
      architecture, modules métier, données, exploitation, déploiement et maintenance.
    </p>
    <div className="docs-hero__cta">
      <Link className="button button--primary button--lg" to="/docs/getting-started">Commencer</Link>
      <Link className="button button--secondary button--lg" to="/docs/architecture">Architecture</Link>
      <Link className="button button--secondary button--lg" to="/docs/system/project-structure">Carte du repo</Link>
    </div>
    <div className="docs-hero__meta">
      <span className="badge">Vue 3</span>
      <span className="badge">Vite</span>
      <span className="badge">PrimeVue</span>
      <span className="badge">Firebase</span>
      <span className="badge">Supabase</span>
      <span className="badge">Express</span>
    </div>
    <div className="docs-hero__hint">Navigation rapide vers les zones critiques du projet.</div>
  </div>
  <div className="docs-hero__visual">
    <div className="docs-preview-panel">
      <div className="docs-preview-panel__header">
        <span className="docs-dot docs-dot--gold"></span>
        <span className="docs-dot"></span>
        <span className="docs-dot"></span>
      </div>
      <div className="docs-preview-panel__body">
        <div className="docs-preview-line docs-preview-line--strong"></div>
        <div className="docs-preview-line"></div>
        <div className="docs-preview-line docs-preview-line--short"></div>
        <div className="docs-preview-grid">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  </div>
</div>

<div className="stats-grid">
  <div className="stat-card"><div className="stat-value">223</div><div className="stat-label">vues</div></div>
  <div className="stat-card"><div className="stat-value">280</div><div className="stat-label">composants</div></div>
  <div className="stat-card"><div className="stat-value">48</div><div className="stat-label">services métier</div></div>
  <div className="stat-card"><div className="stat-value">20</div><div className="stat-label">stores Pinia</div></div>
</div>

<div className="feature-strip">
  <div className="feature-strip__item"><span className="feature-strip__icon">◆</span><span>Architecture réelle</span></div>
  <div className="feature-strip__item"><span className="feature-strip__icon">◆</span><span>Flux métier</span></div>
  <div className="feature-strip__item"><span className="feature-strip__icon">◆</span><span>Sources de données</span></div>
  <div className="feature-strip__item"><span className="feature-strip__icon">◆</span><span>Exploitation & runbook</span></div>
</div>

<div className="docs-section-head">
  <div>
    <div className="docs-section-head__eyebrow">Parcours conseillé</div>
    <h2 className="docs-section-head__title">Commencer par les bonnes entrées</h2>
  </div>
  <p className="docs-section-head__text">
    Les pages ci-dessous couvrent les zones qui permettent réellement de reprendre le projet.
  </p>
</div>

<div className="docs-grid docs-grid--featured">
  <a className="docs-card docs-card--featured" href="/docs/getting-started">
    <span className="docs-card__tag">01</span>
    <span className="docs-card__icon">↗</span>
    <h3>Démarrage</h3>
    <p>Installer, lancer et remettre un environnement en route rapidement.</p>
  </a>
  <a className="docs-card docs-card--featured" href="/docs/architecture">
    <span className="docs-card__tag">02</span>
    <span className="docs-card__icon">⌘</span>
    <h3>Architecture</h3>
    <p>Comprendre les couches, les flux techniques et les points de couplage.</p>
  </a>
  <a className="docs-card docs-card--featured" href="/docs/system/project-structure">
    <span className="docs-card__tag">03</span>
    <span className="docs-card__icon">#</span>
    <h3>Carte du repository</h3>
    <p>Retrouver les zones du code sans perdre du temps dans l'arborescence.</p>
  </a>
</div>

<div className="docs-section-head">
  <div>
    <div className="docs-section-head__eyebrow">Navigation intelligente</div>
    <h2 className="docs-section-head__title">Accès direct par domaine</h2>
  </div>
</div>

<div className="docs-grid">
  <a className="docs-card" href="/docs/frontend/bootstrap">
    <span className="docs-card__icon">◌</span>
    <h3>Frontend</h3>
    <p>Bootstrap Vue, routing, Pinia, UI, services et structure applicative.</p>
  </a>
  <a className="docs-card" href="/docs/backend/overview">
    <span className="docs-card__icon">◫</span>
    <h3>Backend & données</h3>
    <p>Node, Firebase, Supabase, routes, services et stratégie de cohabitation.</p>
  </a>
  <a className="docs-card" href="/docs/domains/formation-pratique">
    <span className="docs-card__icon">◇</span>
    <h3>Domaines métier</h3>
    <p>Formation pratique, soins, social, gamification et applications intégrées.</p>
  </a>
  <a className="docs-card" href="/docs/ops/deployment">
    <span className="docs-card__icon">▣</span>
    <h3>Exploitation</h3>
    <p>Build, déploiement, runbook, diagnostics et points d'attention production.</p>
  </a>
  <a className="docs-card" href="/docs/auth/overview">
    <span className="docs-card__icon">●</span>
    <h3>Auth & permissions</h3>
    <p>Sessions, rôles, accès et points de contrôle côté front et base.</p>
  </a>
  <a className="docs-card" href="/docs/contrib/workflow">
    <span className="docs-card__icon">△</span>
    <h3>Contribution</h3>
    <p>Workflow Git, conventions, qualité et règles de maintenance du projet.</p>
  </a>
</div>
