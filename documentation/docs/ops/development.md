---
title: Exploitation locale et développement
---

Cette page sert de mémo court pour lancer le projet au quotidien. Pour l'installation complète sur un nouveau PC, lire d'abord `getting-started`.

## Commandes de base

| Besoin | Commande |
| --- | --- |
| Frontend Vue/Vite | `npm run dev` |
| Backend Express | `npm --prefix backend run dev` |
| Documentation | `npm run docs:dev` |
| Présentation Reveal.js | `npm run presentation:dev` |
| Build frontend | `npm run build` |
| Build complet app + docs + présentation | `npm run build:all` |
| Tests unitaires | `npm run test:unit` |

## Lancement local recommandé

Terminal 1 :

```powershell
npm run dev
```

Terminal 2, seulement si une fonctionnalité appelle `/api/*` :

```powershell
npm --prefix backend run dev
```

Terminal 3, seulement si vous travaillez sur la doc :

```powershell
npm run docs:dev
```

## Backend

Le backend actif est dans `backend/`.

Points à vérifier avant de modifier une route :

1. l'endpoint est-il monté dans `backend/index.js` ?
2. le frontend appelle-t-il cet endpoint ou lit-il Supabase directement ?
3. le fichier utilise-t-il le client anon ou le client admin Supabase ?
4. si le client admin est utilisé, le contrôle d'accès doit être fait dans Express.

## Docker local

Le développement courant ne nécessite pas Docker.

Utiliser Docker uniquement pour tester le build servi ou un backend conteneurisé :

```powershell
npm run build
docker compose -f docker-compose.dev.yml up -d --build
```

Arrêt :

```powershell
docker compose -f docker-compose.dev.yml down
```

Ports :

- frontend conteneurisé : `http://localhost:3002`
- backend conteneurisé : `http://localhost:3001`

## Déploiement VPS

Le déploiement réel est manuel :

```powershell
.\deploy-hedsvs.ps1
```

Ne pas utiliser `docker-compose.prod.yml` comme vérité de production : la production réelle tourne sur le VPS avec Caddy et une stack Supabase self-hosted. Voir `ops/deployment` et `ops/vps-topology`.

## Checklist avant commit

Selon le type de changement :

- frontend : `npm run build`
- logique testable : `npm run test:unit`
- documentation : `npm run docs:build`
- présentation : `npm run presentation:build`
- backend : vérifier manuellement l'endpoint concerné et les logs backend

## Nettoyage utile

Si Vite garde un ancien état :

```powershell
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
npm run dev
```

Si Docusaurus bloque sur un cache Windows :

```powershell
Remove-Item -Recurse -Force documentation\.docusaurus -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force documentation\build -ErrorAction SilentlyContinue
npm run docs:dev
```
