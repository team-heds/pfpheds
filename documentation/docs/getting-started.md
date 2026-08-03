---
title: Démarrage rapide et reprise sur un nouveau poste
---

Cette page décrit ce qu'il faut faire quand on récupère le projet sur un nouveau PC, puis les commandes à utiliser au quotidien pour lancer le frontend, le backend, la documentation, la présentation, Docker et le déploiement VPS.

## Vue d'ensemble

| Besoin | Commande principale | URL locale habituelle |
| --- | --- | --- |
| Frontend Vue/Vite | `npm run dev` | `http://localhost:5173` |
| Backend Express | `npm --prefix backend run dev` | `http://localhost:3000` |
| Documentation Docusaurus | `npm run docs:dev` | `http://localhost:3000/docs/` ou port proposé |
| Présentation Reveal.js | `npm run presentation:dev` | port Vite affiché dans le terminal |
| Build complet app + docs + présentation | `npm run build:all` | sortie dans `dist/` |
| Déploiement réel VPS | `.\deploy-hedsvs.ps1` | `https://hedsvs.ch` |

## 1. Préparer un nouveau PC

Installer au minimum :

- Git ;
- Node.js 18+ ;
- npm 9+ ;
- Docker Desktop, si vous devez lancer le backend conteneurisé ou tester une image locale ;
- PowerShell récent sur Windows ;
- accès au dépôt GitHub ;
- accès aux fichiers `.env` réels transmis par l'équipe, hors dépôt ;
- accès SSH au VPS uniquement si vous devez déployer.

Vérifier les versions :

```powershell
git --version
node -v
npm -v
docker --version
```

## 2. Récupérer le projet

```powershell
git clone https://github.com/team-heds/pfpheds.git
cd pfpheds
git checkout prod
git pull
```

La branche `prod` est la branche utilisée actuellement pour les déploiements visibles. Ne pas supposer qu'un push GitHub déploie automatiquement : la production réelle passe par `deploy-hedsvs.ps1`.

## 3. Installer les dépendances

Installer les dépendances racine :

```powershell
npm install
```

Installer les dépendances du backend :

```powershell
npm install --prefix backend
```

Installer les dépendances de la documentation si elles ne sont pas déjà présentes :

```powershell
npm install --prefix documentation
```

Installer les dépendances de la présentation Reveal.js :

```powershell
npm install --prefix presentation
```

## 4. Configurer les fichiers d'environnement

Le projet a plusieurs couches. Il faut distinguer les variables publiques frontend et les secrets backend.

### Frontend racine

Créer `.env` à la racine du projet à partir d'un modèle ou d'un fichier transmis :

```powershell
Copy-Item .env.production.example .env
```

À compléter avec les valeurs réelles :

```env
VITE_SUPABASE_URL=https://api2.hedsvs.ch
VITE_SUPABASE_KEY=anon-public-key
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_URL=...
```

Règles :

- les variables `VITE_*` sont visibles dans le bundle frontend ;
- ne jamais mettre de clé `service_role`, clé privée SSH, mot de passe serveur ou secret API privé dans `.env` frontend ;
- redémarrer `npm run dev` après toute modification du `.env`.

### Backend

Créer `backend/.env` :

```powershell
Copy-Item backend/.env.example backend/.env
```

À compléter selon le besoin :

```env
SUPABASE_URL=https://api2.hedsvs.ch
SUPABASE_KEY=anon-or-service-key-selon-le-flux
SUPABASE_SERVICE_ROLE_KEY=service-role-key-si-necessaire
GEMINI_API_KEY=...
OPENAI_API_KEY=...
PORT=3000
NODE_ENV=development
```

Règles :

- `backend/.env` peut contenir des secrets et ne doit pas être committé ;
- si une route backend utilise `supabaseAdmin`, elle contourne RLS : vérifier explicitement les contrôles d'accès côté Express ;
- en local, ne pas modifier les secrets de production directement dans le dépôt.

## 5. Lancer le frontend

```powershell
npm run dev
```

Ouvrir l'URL affichée par Vite, généralement :

```text
http://localhost:5173
```

Si Vite semble servir une ancienne version après une modification d'import ou de route :

```powershell
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
npm run dev
```

## 6. Lancer le backend local

Dans un second terminal :

```powershell
npm --prefix backend run dev
```

Le backend écoute par défaut sur :

```text
http://localhost:3000
```

À vérifier :

- `backend/.env` existe ;
- `PORT=3000` n'est pas déjà utilisé ;
- le frontend pointe vers la bonne URL API si une variable `VITE_API_BASE_URL` ou équivalent est utilisée ;
- les endpoints actifs sont montés dans `backend/index.js`.

## 7. Lancer la documentation

```powershell
npm run docs:dev
```

Si le port 3000 est déjà pris par le backend, Docusaurus proposera un autre port. Accepter le port proposé.

Build de la documentation :

```powershell
npm run docs:build
```

## 8. Lancer la présentation Reveal.js

```powershell
npm run presentation:dev
```

Build de la présentation :

```powershell
npm run presentation:build
```

Créer un squelette de nouvelle présentation :

```powershell
npm run presentation:new -- "Titre de la présentation"
```

Ensuite, ajouter l'entrée correspondante dans `src/config/presentationCatalog.js` si la présentation doit apparaître dans l'espace admin Formations.

## 9. Docker local

Docker n'est pas le chemin principal pour développer le frontend au quotidien. Le flux recommandé reste :

```powershell
npm run dev
npm --prefix backend run dev
```

Utiliser Docker seulement si vous devez tester une image ou un comportement proche conteneur.

Build frontend puis lancement du compose dev :

```powershell
npm run build
docker compose -f docker-compose.dev.yml up -d --build
```

Services exposés par ce compose :

| Service | Rôle | Port |
| --- | --- | --- |
| `frontend-dev` | sert le dossier `dist/` via Nginx | `3002` |
| `backend-dev` | backend Express conteneurisé | `3001 -> 3000` |

Arrêter :

```powershell
docker compose -f docker-compose.dev.yml down
```

Important : `docker-compose.prod.yml` décrit une architecture générique locale. Ce n'est pas la topologie réelle du VPS de production, qui passe par la stack Supabase self-hosted et Caddy. Pour la prod, utiliser `deploy-hedsvs.ps1`.

## 10. Supabase et base de données

L'instance réelle est self-hosted sur :

```text
https://api2.hedsvs.ch
```

Pour développer :

- le frontend utilise la clé anon via `VITE_SUPABASE_KEY` ;
- le backend peut utiliser la clé service role via `backend/.env` ;
- les migrations du dépôt ne sont pas encore un système unique et fiable ;
- avant toute modification RLS ou SQL, lire `backend/supabase/overview`, `backend/supabase/rls` et `backend/supabase/migrations`.

Ne jamais appliquer une migration sur la production sans :

1. identifier la table ou RPC concernée ;
2. vérifier les policies RLS ;
3. vérifier les `GRANT` nécessaires sur cette instance self-hosted ;
4. garder une trace claire de la commande exécutée.

## 11. Déployer sur le VPS

Prérequis :

- être sur un poste qui possède la clé SSH du VPS ;
- être sur une branche propre ;
- avoir exécuté les tests/builds utiles ;
- savoir que le workflow GitHub `.github/workflows/deploy-prod.yml` ne correspond pas à la production réelle.

Commande réelle :

```powershell
.\deploy-hedsvs.ps1
```

Ce script fait :

1. `npm run build:all` ;
2. build frontend, docs et présentation ;
3. copie de `dist/` vers le VPS ;
4. mise à jour du contenu servi par Caddy ;
5. synchronisation du dossier `backend/` vers `/opt/pfpheds-backend` ;
6. rebuild/redémarrage de la stack Docker Supabase côté VPS.

Options utiles :

```powershell
.\deploy-hedsvs.ps1 -SkipBuild
.\deploy-hedsvs.ps1 -SkipBackend
.\deploy-hedsvs.ps1 -Force
```

Après déploiement, vérifier :

```powershell
curl.exe -I -L https://hedsvs.ch
curl.exe -I -L https://hedsvs.ch/docs/
curl.exe -I -L https://hedsvs.ch/presentation/
curl.exe -I -L https://api2.hedsvs.ch
```

## 12. Routine quotidienne

Au début d'une journée :

```powershell
git checkout prod
git pull
npm install
npm run dev
```

Si backend nécessaire :

```powershell
npm --prefix backend run dev
```

Avant commit :

```powershell
npm run build
npm run test:unit
```

Pour une modification de documentation :

```powershell
npm run docs:build
```

Pour une modification de présentation :

```powershell
npm run presentation:build
```

## 13. Problèmes fréquents

| Symptôme | Cause probable | Action |
| --- | --- | --- |
| Vite garde une ancienne erreur d'import | cache `node_modules/.vite` | supprimer `node_modules\.vite`, relancer |
| variables `.env` ignorées | serveur Vite non redémarré | arrêter/reprendre `npm run dev` |
| port 3000 occupé | backend et docs lancés en même temps | accepter le port Docusaurus proposé ou arrêter le backend |
| connexion Supabase impossible | URL ou clé anon incorrecte | vérifier `.env` et que l'URL ne contient pas `/rest/v1` |
| route backend 404 | endpoint non monté | vérifier `backend/index.js` |
| accès refusé malgré rôle visible | permissions/RLS divergentes | vérifier `roleStore`, `api_my_permissions`, puis RLS |
| prod pas à jour après push | push GitHub seul insuffisant | exécuter `.\deploy-hedsvs.ps1` |

## 14. Pages à lire ensuite

- `architecture`
- `system/project-structure`
- `frontend/bootstrap`
- `backend/overview`
- `backend/supabase/overview`
- `backend/supabase/rls`
- `ops/deployment`
- `ops/vps-topology`
- `ops/vps-operations`
