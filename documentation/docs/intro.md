---
id: intro
title: Documentation technique de référence
slug: /
---

<div class="docs-hero docs-hero--split">
  <div class="docs-hero__content">
    <div class="docs-kicker">Documentation technique</div>
    <h2 class="docs-hero__title">Plateforme HEdS</h2>
    <p class="docs-hero__subtitle">
      Documentation technique de reprise pour comprendre l'architecture, remettre
      l'environnement en route, maintenir le code et faire évoluer la plateforme.
    </p>
    <div class="docs-hero__cta">
      <a class="button button--primary button--lg" href="/docs/getting-started">Démarrage</a>
      <a class="button button--secondary button--lg" href="/docs/architecture">Architecture</a>
      <a class="button button--secondary button--lg" href="/docs/system/project-structure">Carte du repo</a>
    </div>
    <div class="docs-hero__meta">
      <span class="badge">Vue 3</span>
      <span class="badge">Vite</span>
      <span class="badge">PrimeVue</span>
      <span class="badge">Firebase</span>
      <span class="badge">Supabase</span>
      <span class="badge">Express</span>
    </div>
  </div>
  <div class="docs-hero__visual">
    <div class="docs-preview-panel">
      <div class="docs-preview-panel__header">
        <span class="docs-dot docs-dot--gold"></span>
        <span class="docs-dot"></span>
        <span class="docs-dot"></span>
      </div>
      <div class="docs-preview-panel__body">
        <div class="docs-preview-line docs-preview-line--strong"></div>
        <div class="docs-preview-line"></div>
        <div class="docs-preview-line docs-preview-line--short"></div>
        <div class="docs-preview-grid">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="feature-strip">
  <div class="feature-strip__item"><span class="feature-strip__icon">◆</span><span>Architecture réelle</span></div>
  <div class="feature-strip__item"><span class="feature-strip__icon">◆</span><span>Flux métier</span></div>
  <div class="feature-strip__item"><span class="feature-strip__icon">◆</span><span>Sources de données</span></div>
  <div class="feature-strip__item"><span class="feature-strip__icon">◆</span><span>Exploitation & runbook</span></div>
</div>

## Finalité

Cette documentation doit permettre à une nouvelle personne technique de :

- relancer le projet
- comprendre l'architecture
- retrouver rapidement où modifier une fonctionnalité
- déployer et diagnostiquer la plateforme

## Réalité du projet

La plateforme regroupe plusieurs sous-systèmes dans une seule base de code :

- frontend Vue 3
- administration académique
- formation pratique
- workflows soins infirmiers
- social et gamification
- applications intégrées
- backend Node
- coexistence Firebase et Supabase

## Chiffres utiles

<div class="stats-grid">
  <div class="stat-card"><div class="stat-value">223</div><div class="stat-label">vues</div></div>
  <div class="stat-card"><div class="stat-value">280</div><div class="stat-label">composants</div></div>
  <div class="stat-card"><div class="stat-value">48</div><div class="stat-label">services métier</div></div>
  <div class="stat-card"><div class="stat-value">20</div><div class="stat-label">stores Pinia</div></div>
</div>

## Lecture recommandée

<div class="docs-grid docs-grid--featured">
  <a class="docs-card docs-card--featured" href="/docs/getting-started"><span class="docs-card__tag">01</span><span class="docs-card__icon">↗</span><h3>Démarrage</h3><p>Installer et lancer.</p></a>
  <a class="docs-card docs-card--featured" href="/docs/architecture"><span class="docs-card__tag">02</span><span class="docs-card__icon">⌘</span><h3>Architecture</h3><p>Comprendre les couches.</p></a>
  <a class="docs-card docs-card--featured" href="/docs/system/project-structure"><span class="docs-card__tag">03</span><span class="docs-card__icon">#</span><h3>Carte du repo</h3><p>Retrouver le bon code.</p></a>
  <a class="docs-card docs-card--featured" href="/docs/domains/priorite-extension-soins-infirmiers-et-profil-etudiant"><span class="docs-card__tag">!</span><span class="docs-card__icon">★</span><h3>Chantier prioritaire</h3><p>Extension Soins Infirmiers + profil étudiant.</p></a>
  <a class="docs-card" href="/docs/auth/overview"><span class="docs-card__icon">●</span><h3>Auth</h3><p>Session, rôles, permissions.</p></a>
  <a class="docs-card" href="/docs/data/overview"><span class="docs-card__icon">◫</span><h3>Données</h3><p>Firebase, Supabase, migration.</p></a>
  <a class="docs-card" href="/docs/ops/deployment"><span class="docs-card__icon">▣</span><h3>Déploiement</h3><p>Build app et docs.</p></a>
</div>
