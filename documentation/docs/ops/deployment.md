---
title: Procédure de déploiement réelle
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Procédure vérifiée</div>
    <h2 class="docs-section-head__title">Comment le projet est réellement déployé (pas via CI/CD)</h2>
  </div>
  <p class="docs-section-head__text">
    Voir `ops/vps-topology.md` pour l'architecture cible. Cette page couvre la procédure opérationnelle : une seule commande, exécutée manuellement depuis un poste de développeur Windows.
  </p>
</div>

## Un seul point d'entrée : `deploy-hedsvs.ps1`

```powershell
.\deploy-hedsvs.ps1
```

Exécuté à la racine du dépôt, depuis Windows (PowerShell), avec une clé SSH locale au poste du développeur (**le chemin de la clé est en dur dans le script**, à généraliser/paramétrer si l'équipe change). Ce script fait, dans l'ordre :

1. **Build local** : `npm run build:all` (frontend Vite + documentation Docusaurus + copie de la doc dans `dist/docs`).
2. **Packaging** : `tar` du dossier `dist/` en `.tar.gz`.
3. **Transfert** : `scp` de l'archive vers `/tmp` sur le VPS.
4. **Déploiement frontend** : extraction sur le VPS dans `/var/www/pfpheds-frontend`, puis `docker cp` de ce dossier **dans** le conteneur `supabase-caddy-1` (qui sert les fichiers statiques directement depuis l'intérieur du conteneur), puis `caddy reload`.
5. **Synchronisation backend** : `tar` du dossier `backend/` (hors `node_modules`, `.env*`, `uploads`), transfert et extraction dans `/opt/pfpheds-backend` sur le VPS (sans écraser le `.env` distant, qui contient les vrais secrets).
6. **Mise à jour de toute la stack** : `cd /opt/supabase && docker-compose up -d --build` — reconstruit `backend` et `push-worker` avec le nouveau code, **et garantit que tous les autres services (rest, auth, storage, realtime, meta, studio, caddy, db) sont démarrés**, même s'ils avaient été arrêtés/supprimés entre-temps.

Cette dernière étape (6) a été ajoutée le 2026-07-17 après un incident où le service `rest` avait disparu silencieusement de la stack — voir `ops/vps-topology.md`.

### Options du script

```powershell
.\deploy-hedsvs.ps1 -SkipBuild      # réutilise le dist/ déjà construit
.\deploy-hedsvs.ps1 -SkipBackend    # ne déploie que le frontend + la doc
.\deploy-hedsvs.ps1 -Force          # réinstalle node_modules avant de builder
```

## Ce qui N'EST PAS une procédure de déploiement valide

- **`.github/workflows/deploy-prod.yml`** (déclenché sur push vers `prod`) : construit puis envoie par FTP vers un serveur **sans rapport avec le VPS de production**. N'a jamais déployé quoi que ce soit de visible sur `hedsvs.ch`. À ignorer, supprimer, ou reconfigurer entièrement avant de s'y fier.
- **`scripts/deploy-prod.ps1`** : ce script s'appuie sur `docker-compose.prod.yml` (racine du dépôt) et l'exécute en **local**, pas sur le VPS — il ne correspond pas à l'infrastructure réellement utilisée non plus.
- **`npm run build` seul** ne suffit jamais : il ne construit que le frontend, pas la documentation. Toujours utiliser `npm run build:all` ou passer par `deploy-hedsvs.ps1`.

## Build manuel (sans déploiement), pour tester en local

```bash
npm run build:all
```

Produit :
- `dist/` — build Vite du frontend
- `dist/docs/` — build Docusaurus copié (via `scripts/copy-docs-to-dist.js`)

## Prérequis pour pouvoir déployer

- Accès SSH au VPS de production avec la clé privée dédiée — à obtenir auprès de l'équipe actuelle (ni l'IP, ni la clé ne sont dans le dépôt).
- `documentation/node_modules` installé (`npm ci --prefix documentation`) — Docusaurus nécessite **Node.js ≥ 20** (le dépôt racine tourne sous Node 18/22 selon les scripts, attention à la version active dans le terminal qui lance le déploiement).
- `tar` et `ssh`/`scp` disponibles dans le PATH Windows (fournis nativement par Windows 10/11 récents, ou via Git Bash).

## Vérification post-déploiement

```bash
curl -I https://hedsvs.ch/            # frontend
curl -I https://hedsvs.ch/docs/       # documentation
curl -H "Origin: https://hedsvs.ch" -I "https://api2.hedsvs.ch/rest/v1/institutions?select=InstitutionId&limit=1"   # API + CORS
```

La troisième commande doit renvoyer `Access-Control-Allow-Origin: https://hedsvs.ch` et un `200 OK` — sinon, un service backend est probablement down (voir `ops/vps-topology.md`, section incidents).

## Recommandation pour une reprise externe

Ce mode de déploiement (script PowerShell manuel + SSH direct depuis un poste de dev) n'est pas une pratique de CI/CD standard et dépend d'un poste de travail spécifique (chemin de clé SSH en dur, etc.). Pour une reprise sérieuse, il est recommandé de :
1. Migrer vers une vraie CI/CD (GitHub Actions correctement configuré vers le VPS, ou GitLab CI, etc.) avec les secrets stockés côté plateforme, pas sur un poste local.
2. Faire de `/opt/pfpheds-backend` un vrai checkout git au lieu d'une synchronisation par tar/scp.
3. Ajouter un monitoring qui aurait détecté immédiatement la disparition du service `rest` plutôt que d'attendre un rapport utilisateur.
