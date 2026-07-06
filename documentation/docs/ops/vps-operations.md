---
title: Exploitation VPS et opérations
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Opérations</div>
    <h2 class="docs-section-head__title">Ce qu'il faut faire sur un VPS pour exploiter la plateforme</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page vise l'exploitation concrète : build, lancement, vérification, incident et points de contrôle côté VPS.
  </p>
</div>

## Hypothèse de topologie

Le repo supporte une topologie Docker simple :

- un conteneur backend Node ;
- un conteneur frontend Nginx ;
- un réseau Docker interne ;
- proxy `/api` et `/health` par Nginx.

## Fichiers à connaître

- `docker-compose.prod.yml`
- `Dockerfile.frontend.prod`
- `deploy/nginx.frontend.prod.conf`
- `backend/.env`
- `firebase.json` si mode Hosting

## Commandes de base

### Build complet

```bash
npm run build:all
```

### Lancement Docker prod

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Vérifier les conteneurs

```bash
docker ps
```

### Vérifier les logs

```bash
docker logs pfpheds-backend
docker logs pfpheds-frontend
```

## Contrôles post-déploiement

À tester systématiquement :

- `/`
- `/docs`
- `/health`
- `/api/ping`
- `/api/ftp/diagnostic`

## Vérifications backend

Contrôler :

- présence de `backend/.env` ;
- variables Supabase correctes ;
- éventuelles variables FTP présentes ;
- santé du backend via `/health`.

## Vérifications frontend

Contrôler :

- présence du build dans `dist/` ;
- présence de la doc dans `dist/docs` si build global ;
- bon routage SPA via Nginx ;
- disponibilité des assets statiques.

## Vérifications Nginx

La conf du repo attend :

- un root sur `/usr/share/nginx/html`
- `try_files $uri $uri/ /index.html`
- proxy `/api/` vers `backend:3000`
- proxy `/health` vers le backend

Si l'app charge mais que l'API ne répond pas, vérifier d'abord ce point.

## Symptômes courants sur VPS

### Le frontend charge mais l'app est cassée

Causes probables :

- proxy `/api` cassé ;
- backend down ;
- variables frontend mal injectées ;
- CORS si déploiement hybride.

### `/health` KO

Causes probables :

- backend non démarré ;
- env backend invalide ;
- container unhealthy ;
- port interne incorrect.

### `/docs` manquant

Causes probables :

- `npm run build:all` non exécuté ;
- `dist/docs` absent ;
- déploiement frontend fait sans copie de la documentation.

## Procédure d'incident minimale

1. vérifier `docker ps`
2. vérifier `/health`
3. vérifier `/api/ping`
4. lire les logs backend
5. lire les logs frontend
6. vérifier ensuite Supabase / FTP / service tiers

## Checklist de redéploiement

- code à jour ;
- variables présentes ;
- build app OK ;
- build docs OK ;
- conteneurs rebuildés ;
- endpoints de santé OK ;
- page `/docs` accessible.
