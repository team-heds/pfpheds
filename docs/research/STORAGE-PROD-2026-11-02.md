# Médias Supabase — production, 2 novembre 2026

Déploiement demandé explicitement par l’utilisateur après la validation en test.
Les nouveaux médias utilisent Supabase. Les originaux Firebase restent bloqués
par Google ; aucune facturation Google n’a été activée.

## Publication

- Backend : `supabase-backend:storage-20261102-114750`, overlay des six fichiers
  de stockage sur l’image qui tournait réellement en production. Pas de copie
  de l’index backend local modifié par d’autres travaux.
- Nouveaux buckets privés `file-physio` et `pfp-documents`, limite 20 Mio.
- PDF signés pour 300 secondes après les contrôles de référence et d’accès.
- Photos d’institutions publiques dans le bucket existant `institutions`.
- Affichage de secours local lorsque la photo historique ne peut pas charger.
- Correction du réglage historique du stockage nécessaire à la suppression des
  objets : voir `STORAGE-PROD-DELETE-LEGACY-BUCKET-2026-11-02.md`.

Le frontend courant avait des corrections de votation publiées directement
dans ses modules versionnés. Pour les conserver, la publication ajoute onze
fichiers médias versionnés, puis remplace uniquement l’entrée HTML et le
manifeste du service worker. Aucun ancien fichier JavaScript n’est écrasé.

Les générateurs Acorn/MagicString appliquent des modifications ciblées avec
empreintes et assertions de structure. Les sources Vue/services sont également
conservées dans le dépôt pour une future reconstruction à partir d’une branche
de production réconciliée. Ne pas reconstruire aveuglément depuis HEAD : il ne
représente pas à lui seul tous les correctifs déjà déployés.

## Chargement de l’application

Le contrôle réel dans le navigateur a détecté un second bootstrap historique :
des modules chargés à la demande importaient `index-Eg7w2WHW.js`, qui relançait
un ancien routeur et remettait l’ancien formulaire.

Une importmap placée avant le script d’entrée redirige exactement cette ancienne
URL vers l’entrée active `index-HEDS25-storage-v1.js`. Les exports sont identiques.
Le code des deux entrées est équivalent après normalisation des seuls noms de
modules JavaScript. Cela conserve un seul ensemble de services et de routes,
sans modifier l’ancien asset ni affaiblir une politique de sécurité.

## Vérifications terminées

- Tests unitaires ciblés et tests du parcours complet admin/étudiant sur test.
- Six contrôles Storage réels en production : origines publiques, confidentialité
  et limites, refus anonyme et CORS, upload/lecture des trois buckets.
- Nettoyage exact des objets synthétiques ; aucun `media-smoke` résiduel.
- Aucun compte connecté par les scripts, aucun profil ni vote modifié, aucune
  ligne métier créée pour les vérifications de production.
- Onze fichiers publiés vérifiés par HTTP, type de contenu et SHA256 ; pages
  accessibles sur `hedsvs.ch` et `www.hedsvs.ch`, API saine, worker vérifié.
- 793 dépendances de modules vérifiées, exports compatibles avec les modules
  production conservés ; 150 assets liés aux votations inchangés en SHA256.
- Contrôle indépendant du code : entrée identique octet pour octet après
  inversion des seuls changements de noms de fichiers médias.
- Navigateur connecté : page Documents PFP et formulaire ajout ouverts ; champ
  fichier confirmé avec `.pdf,.docx,.xlsx,.pptx,.jpg,.jpeg,.png,.webp,.txt`.
- Navigation interne vers Institutions : 97 images, dont 95 affichages de
  secours locaux et deux photos Supabase existantes. Les anciennes photos ne
  sont donc pas annoncées comme récupérées.

Le test de production n’a pas envoyé de document métier depuis le compte réel
ou modifié un document existant. Les contrôles admin/étudiant complets restent
ceux de l’environnement de test ; les contrôles production vérifient le stockage,
les protections HTTP et le formulaire réellement chargé.

## Empreintes finales et sauvegardes

- HTML : `b285680aa113007c1cffc52f2ace53b462d5b773cb7172cd3e03b5127e15fed9`.
- Worker : `9b7b7717ca5999230cada055dbe4651125464eff9e3019cdc2e440fb47948061`.
- Backup backend d’origine :
  `/opt/pfpheds-production-backups/storage-20261102-114750/`.
- Image backend précédente :
  `supabase-backend:before-storage-20261102-114750`.
- Frontend avant toute publication médias :
  `/opt/pfpheds-production-backups/storage-frontend-20261102-115840/frontend-before.tar.gz`.
- Sauvegarde avant canonicalisation de l’entrée :
  `/opt/pfpheds-production-backups/storage-frontend-20261102-120624/`.
- Configuration Storage avant correction :
  `/opt/supabase/backups/storage-config-20261102T115637Z/docker-compose.yml`.

Pour un rollback applicatif, rétablir uniquement l’image du service backend et
les fichiers d’entrée HTML/worker sauvegardés. Conserver les buckets et médias
nouvellement ajoutés. Éviter de restaurer tout le compose à partir du backup du
backend, car cela annulerait aussi la correction durable du réglage Storage.
Les anciens assets sont conservés pour les onglets déjà ouverts.

## Reste à faire

Récupérer les 438 originaux du bucket Firebase principal et les documents du
second ancien bucket. L’utilisateur ne connaît pas de sauvegarde. Une demande
d’export sans activation de facturation est préparée dans la note TEST ; elle
n’a pas été envoyée. Les références historiques restent intactes.
