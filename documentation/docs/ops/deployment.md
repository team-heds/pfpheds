---
title: Déployer hedsvs.ch
---

## macOS et Linux

Le déploiement est manuel depuis un checkout de la branche `prod` validée sur GitHub.
Fusionner une PR sur GitHub lance les contrôles de qualité, mais ne publie pas le site.

### Préparer le poste

Utiliser Node.js 22 ou plus récent, npm, SSH, SCP, tar et curl. Installer les dépendances :

```bash
npm ci
npm ci --prefix documentation
npm ci --prefix presentation
npm exec --prefix presentation -- playwright install chromium
```

Sur les postes gérés par Portly, lancer les installations, builds et déploiements comme
jobs temporaires, par exemple depuis la racine du projet :

```bash
job_id="$(portly temp 'npm run deploy:build' --path "$PWD" --timeout 30m)"
portly wait "$job_id"
```

Créer un alias dans `~/.ssh/config` (la clé privée reste exclusivement sur le poste) :

```sshconfig
Host heds-vps
    HostName 83.228.204.5
    User ubuntu
    IdentityFile /chemin/vers/HEdSLinux.txt
    IdentitiesOnly yes
```

Restreindre les permissions de la clé avec `chmod 600 /chemin/vers/HEdSLinux.txt`.
Vérifier l'empreinte du serveur lors de la première connexion interactive `ssh heds-vps`.
Le script impose ensuite la vérification de l'hôte et ne demande aucun mot de passe.
`DEPLOY_SSH_HOST` permet de remplacer l'alias et `SSH_KEY` de préciser un autre fichier.

Créer `.env.production.local` (ignoré par Git) avec les paramètres publics du projet :

```dotenv
VITE_SUPABASE_URL=https://api2.hedsvs.ch
VITE_SUPABASE_KEY=REMPLACER_PAR_LA_CLE_PUBLIQUE_ANON_OU_PUBLISHABLE
VITE_API_BASE_URL=https://api2.hedsvs.ch/api
```

Ajouter les variables publiques Firebase et `VITE_VAPID_PUBLIC` utilisées par l'application.
Vite charge aussi `.env`, `.env.local` et `.env.production`; les variables du processus
ont priorité. Les URLs d'API doivent cibler la production. Tout `VITE_*` peut être exposé
au navigateur : ne jamais y placer une clé `service_role`, un secret serveur ou une clé privée.

### Vérifier puis publier

```bash
npm run deploy:check   # configuration + accès SSH + prérequis VPS, sans écriture distante
npm run deploy:build   # build complet et contrôle des fichiers, sans connexion au VPS
npm run deploy:prod    # build puis publication complète
```

`bash deploy_hedsvs.sh` sans option effectue uniquement la vérification.
Le mode de publication ne réutilise jamais un ancien `dist` : il reconstruit le frontend,
la documentation, les présentations et les PDF via `npm run build:all`.

La publication :

1. Vérifie l'identité du VPS, sudo sans mot de passe, Caddy, Compose et l'espace libre.
2. Construit et vérifie `dist/`, `dist/docs/` et `dist/presentation/`.
3. Transfère les archives dans un répertoire temporaire unique, puis prend un verrou distant.
4. Sauvegarde le frontend et le backend dans `/opt/pfpheds-releases/<identifiant>/`, accessible à root.
5. Synchronise le backend, y compris `backend/uploads` qui contient du code. Exclut les `.env*` et `node_modules` locaux.
6. Exécute la stack existante de `/opt/supabase` avec les deux overrides versionnés
   `supabase-healthchecks.override.yml` et `supabase-auth-security.override.yml`.
   `up -d --build --wait` reconstruit le backend et le worker et attend la disponibilité des services.
7. Vérifie `/health/ready` dans le conteneur backend, copie les fichiers frontend dans Caddy et le recharge.
8. Vérifie les réponses HTTP du site, de la documentation et des présentations.

Le script conserve les anciens fichiers frontend pour que les onglets déjà ouverts puissent
encore charger leurs assets. La copie backend conserve également les fichiers obsolètes :
une suppression de code sensible doit faire l'objet d'une intervention dédiée.
Les sauvegardes restent disponibles ; elles ne sont pas supprimées automatiquement.
Aucune migration SQL n'est appliquée. Toute migration requise par une release doit être
revue et exécutée selon sa procédure avant la publication du code dépendant.

### Espace disque : constat du 15 septembre 2026

Le VPS expose un disque système de 20 Go avec environ 2,6 Go libres et un second disque de
250 Go sans point de montage dans `lsblk`. Le script exige au moins 4 Gio libres sur les
volumes de `/opt`, `/var/www` et `/tmp`. C'est un seuil minimal, pas une garantie suffisante
pour toutes les releases. Prévoir aussi la taille des sauvegardes et des images à construire.

Avant la première publication complète, préparer une intervention de stockage : examiner
le disque de 250 Go et les sauvegardes existantes, puis libérer ou augmenter l'espace utile.
Ne pas formater le disque secondaire sans vérifier son contenu et la stratégie de sauvegarde.

### En cas d'échec

Le script s'arrête sur la première erreur ; il ne prétend pas que la publication a réussi.
Après le début des changements distants, la release peut être partiellement installée.
Les archives et le chemin de sauvegarde sont indiqués dans les logs. Il n'y a pas de retour
arrière automatique de la stack ni de la base de données.

Pour restaurer le code, un administrateur remet le backend depuis la sauvegarde, reconstruit
la stack avec les mêmes fichiers Compose, restaure le frontend sur l'hôte puis le copie
dans `supabase-caddy-1` et recharge Caddy. Contrôler la compatibilité avec les migrations
avant cette restauration. Les fichiers de sauvegarde backend peuvent contenir le `.env`
distant : les garder privés sur le VPS.

## Windows

`deploy-hedsvs.ps1` reste le point d'entrée historique. Il utilise encore un chemin de clé
propre au poste Windows et une procédure distincte. Le nouveau script Bash/Node fonctionne
sur macOS/Linux. `scripts/deploy-prod.ps1` et `docker-compose.prod.yml` ne correspondent
pas à la stack de production installée ; ne pas les utiliser pour publier ce VPS.

## GitHub

`.github/workflows/deploy-prod.yml` exécute les contrôles de qualité sur les PR et les pushes
vers `prod`. Il n'effectue aucun transfert vers le VPS. Après fusion et contrôles réussis,
mettre à jour le checkout local de `prod`, puis exécuter le déploiement manuel ci-dessus.

Référence : [Supabase auto-hébergé avec Docker](https://supabase.com/docs/guides/self-hosting/docker).
