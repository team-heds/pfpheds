# Stockage médias — déploiement TEST du 2 novembre 2026

## Résultat

Les nouveaux uploads FilePhysio, PDF institutions/places et photos d’institutions
utilisent Supabase sur `https://test.hedsvs.ch`. Aucun déploiement en production.
Les médias historiques Firebase ne sont pas encore récupérés.

- `file-physio` : privé, 20 Mo, documents généraux ; téléchargement signé par ID
  enregistré, pour les utilisateurs authentifiés.
- `pfp-documents` : privé, 20 Mo, PDF institutions/places ; téléchargement signé
  après vérification de la référence et de la visibilité de l’institution.
- `institutions` : images publiques, uploads réservés aux admins par le backend.
- Liens signés : 300 secondes. URLs navigateur sur l’origine publique du test.
- CORS : origine test autorisée dans l’image backend de test uniquement.
- Image manquante : emplacement « Photo indisponible », sans substitution par
  une photographie sans rapport.

Les tables, comptes, profils, votes et affectations existants n’ont pas été modifiés.

## Vérifications

- 16 tests ciblés de code réussis avant déploiement ; build Vite/PWA réussi.
- Build test isolé : `tmp_143b03ee` (Portly).
- Déploiement backend : `tmp_f6d03988` ; frontend : `tmp_562b7828`.
- Smoke réel : `tmp_d6c2fc27`, dix contrôles réussis : authentification admin et
  étudiant, buckets privés, refus 401/403, upload et téléchargement FilePhysio,
  PDF institution, PDF place, image publique, CORS, origines des URLs.
- Trois lignes et quatre objets de test jetables créés pour le smoke, puis
  supprimés par leurs identifiants exacts ; absence vérifiée.
- Production : absence des deux nouveaux buckets vérifiée en lecture seule.
- Le navigateur intégré n’a pas pu franchir la protection HTTP du site test.
  Le contrôle visuel connecté reste à effectuer avec les accès habituels.

Pages à contrôler : `/documents_pfp`, `/institution`,
`/admin/formation-pratique/places`.

## Sauvegardes et retour arrière

Sur le VPS, exclusivement sous `/opt/pfpheds-staging` :

- Backend/config avant déploiement :
  `backups/storage-before-20261102-113212/`.
- Image précédente :
  `pfpheds-staging-backend:before-storage-20261102-113212`.
- Image publiée : `pfpheds-staging-backend:storage-20261102-113212`.
- Frontend précédent :
  `backups/frontend-before-storage-20261102-113304.tar.gz`.
- SHA256 index publié :
  `02e388853e7f7ba090853cc093c3332633db4ed0c9852850c5e12178d455c037`.

Le premier essai s’est arrêté pendant le démarrage de Storage ; son retour
automatique à la version précédente a été vérifié. Le second essai attend la
disponibilité effective de Storage avant de créer les buckets.

Pour revenir en arrière : rétablir le compose sauvegardé, restaurer les fichiers
backend depuis son archive, retagger l’image précédente en
`pfpheds-staging-backend`, puis recréer uniquement `backend` et `storage` avec
`--no-deps --no-build`. Restaurer l’archive frontend dans `frontend-dist`.
Conserver les buckets et objets nouvellement ajoutés : une restauration du code
ne justifie pas de les supprimer.

## Blocage des anciens fichiers

Google autorise l’inventaire mais refuse le téléchargement authentifié :

- `pfpheds.appspot.com` : compte de facturation fermé, HTTP 403.
- `fpformationheds.appspot.com` : compte de facturation absent, HTTP 403.
- Inventaire principal : 438 objets, 132 475 104 octets (126,34 Mio).
- Références Firebase dans la base de production : 88 institutions,
  105 places et 33 documents FilePhysio. Ce sont des nombres de lignes, pas un
  nombre de fichiers uniques à migrer.
- Aucune sauvegarde des originaux connue de l’utilisateur.
- Aucune offre payante ni facturation Google réactivée.

La copie des originaux demeure impossible tant que Google ne permet pas leur
export. Les URL historiques sont conservées pour permettre une reprise ; elles
ne doivent pas être remplacées par des URL Supabase avant la copie et la
vérification des fichiers correspondants.

## Brouillon de demande à Google — non envoyé

Bonjour,

Nous devons récupérer les fichiers existants des buckets
`pfpheds.appspot.com` et `fpformationheds.appspot.com` pour les transférer vers
notre propre serveur. Le compte propriétaire peut lister les objets, mais le
téléchargement authentifié échoue avec HTTP 403, en raison d’un compte de
facturation fermé ou absent.

Pouvez-vous nous indiquer une procédure d’export ou de restitution des données
qui n’active pas de facturation ni de service payant ? Le premier bucket contient
environ 126 Mio. Nous souhaitons conserver les originaux jusqu’à la vérification
complète de leur récupération.

Merci.
