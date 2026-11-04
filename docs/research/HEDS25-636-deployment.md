# HEDS25-636 — Validation et déploiement test

Date : 29 septembre 2026  
Environnement : `https://test.hedsvs.ch` uniquement  
Production : inchangée

## Contenu livré

- Navigation clavier des raccourcis du dashboard Secrétariat SI.
- Noms accessibles sur les boutons icône et les panneaux repliables.
- Libellés associés aux recherches, filtres et listes déroulantes SI.
- Anneau de focus jaune conforme à la charte et non écrasé par le thème PrimeVue.
- Transfert du focus au titre principal après une navigation SPA.
- Menu d'administration mobile ouvrable avec Entrée, focus piégé dans le tiroir, fermeture avec Échap et restitution du focus.
- Navigation clavier du menu latéral, y compris lorsqu'il est réduit.

## Écrans contrôlés

- Dashboard Secrétariat SI
- Dashboard RM Soins Infirmiers
- Vue journalière / salles
- Feuille de charges SI
- Cours en postulation SI

## Preuves automatiques

- Tests unitaires SI : 40 réussis sur 40.
- Build staging : réussi.
- Parcours clavier : 10 combinaisons réussies (5 écrans × desktop/mobile).
- Boutons visibles sans nom accessible : 0.
- `tabindex` positif : 0.
- Erreurs JavaScript pendant les parcours : 0.
- Non-régression responsive : 15 combinaisons réussies (5 écrans × desktop/iPad/mobile).
- Débordement horizontal détecté : 0.
- Écriture de données pendant les contrôles : 0.

## Empreintes déployées

- `index.html` : `449de5f85401abd48d8d3b4023eb312091a207e00833fdd5d6127c97055e036d`
- `sw.js` : `5a4022a09aa61275ab94a17bcf935d8a7b73b307569b53d103e9bbf16c1d74f0`

## Retour arrière

- État avant HEDS25-636 : `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-636-20260929-164606.tar.gz`
- État juste avant la version finale : `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-636-20260929-165643.tar.gz`

Les sauvegardes intermédiaires créées pendant les corrections ont été supprimées après validation. Les sauvegardes de données et la production n'ont pas été modifiées.
