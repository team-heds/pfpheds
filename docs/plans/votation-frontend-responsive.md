# Votation — amélioration du frontend étudiant

Date : 22 septembre 2026  
Environnement : test uniquement

## Périmètre validé

La demande porte uniquement sur la présentation et l'ergonomie. Les règles de
sélection, les cinq rangs, les propositions de campagne, les critères et
l'enregistrement Supabase ne changent pas.

## Travaux

- [x] Auditer `/votation` aux formats mobile, iPad et desktop.
- [x] Conserver le tableau complet sur desktop.
- [x] Ajouter des cartes de places tactiles sur mobile et iPad.
- [x] Rendre les cinq rangs explicites et utilisables au clavier.
- [x] Ajouter un récapitulatif de progression des cinq choix.
- [x] Ajouter une recherche par institution, place, catégorie ou critère.
- [x] Clarifier l'état d'une campagne ouverte sans place proposée.
- [x] Préserver le mode administrateur en lecture seule.
- [x] Vérifier le build applicatif isolé.
- [x] Publier et contrôler sur `test.hedsvs.ch`.

## Preuves — 22 septembre 2026

- 11 tests ciblés et lint : Portly `tmp_0ce1b102`.
- Rendu isolé des cartes mobile/iPad : Portly `tmp_d3a986a5`, sans erreur ni
  débordement.
- Build applicatif isolé : Portly `tmp_21585686`.
- Déploiement et contrôle réel de `/votation` : Portly `tmp_6292f9d5`, sans
  erreur JavaScript ni débordement aux largeurs 390, 834 et 1440 px.
- Sauvegarde :
  `/opt/pfpheds-staging/backups/frontend-dist-before-votation-responsive-20260922`.
- Empreinte du frontend test publié :
  `476428b569f45b60edc25b1605cb2df8ee65b58b8802965ac2d30fc6a50ecbae`.
- Aucune écriture de données et aucun changement de campagne.
- Production non modifiée ; contrôle HTTP public : 200.
# Finition du formulaire de votation — 22 septembre 2026

- Le formulaire conserve ses cinq choix visibles sur ordinateur, tablette et mobile.
- L’aperçu administrateur reprend la présentation étudiant en lecture seule.
- Les colonnes de classement et de statistiques sont mieux différenciées visuellement.
- La largeur utile, les espacements et les zones de sélection ont été améliorés.
- Pour la PFP2, un lieu déjà fréquenté n’est plus reproposé.
- Tant qu’il reste des critères à valider, seules les places couvrant au moins un critère manquant sont proposées; une fois tous les critères validés, toutes les autres places redeviennent disponibles.
