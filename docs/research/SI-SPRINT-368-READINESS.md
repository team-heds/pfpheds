# Sprint SI 368 — Checklist de validation avant production

Date : 29 septembre 2026  
Environnement validé : `https://test.hedsvs.ch`  
Production : inchangée

## État global

Les stories HEDS25-628 à HEDS25-639 disposent toutes d'une implémentation et de
preuves automatiques sur l'environnement de test. Elles restent volontairement en
validation manuelle avant toute promotion en production.

## Dernier passage automatique

Le 29 septembre 2026, la recette technique a été rejouée sur la base test isolée :

- session administrateur et cinq routes SI critiques chargées sans erreur JavaScript,
  erreur HTTP 4xx/5xx ni écriture au simple affichage ;
- accès anonyme refusé ;
- séparation des rôles confirmée pour `RMSoins` et `EnseignantSoins` ;
- année active `2026-2027`, 39 modules, 19 profils `EnseignantSoins` et 1 912
  créneaux visibles sur le dashboard Secrétariat ;
- feuille de charges chargée avec ses statistiques et ses diagnostics ;
- parcours navigateur de vote enseignant validé, puis données de recette supprimées ;
- cycle réel d'affectation RM et d'annulation validé, puis données de recette supprimées ;
- 51 tests unitaires ciblés réussis sur les règles d'année, d'accès, de planning,
  d'identité, de postulation et d'affectation ;
- le compte administrateur peut consulter les 65 postulations mais ne dispose plus
  de l'action « Voter ce cours », même s'il cumule une permission enseignant ;
- aucune donnée de production modifiée.

Captures de preuve : `artifacts/SI-SPRINT-368-UAT/`.

Version publiée sur test :

- index : `ec03a05057167bd1e731b1c405b1c4e0729bd527c9c8fed851a50776fa8b8c65` ;
- service worker : `dc22d1a83268eb465a6d0fd5d34bc038d903f8e0b54137a85f9338eaf2a6e03f` ;
- rollback : `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-637-20260929-215345.tar.gz`.

Le domaine public renvoie actuellement un refus Caddy `403` aux appels de recette
automatisée provenant du réseau courant. La validation fonctionnelle a donc été
rejouée via le tunnel privé vers la même base et la même API test. La publication
elle-même a été contrôlée par les empreintes du frontend monté dans le conteneur.

Le contrôle a aussi mis en évidence la dette qualité déjà suivie par HEDS25-631 :
65 créneaux complets sur 1 912, 263 sans `course_id`, 852 sans enseignant,
1 715 sans salle et 11 avec un horaire invalide. Cela ne remet pas en cause les
contrôles d'accès ni les parcours de postulation, mais ces données doivent être
traitées avant de considérer le planning et les charges comme entièrement fiables.

| Ticket | Périmètre | Preuve automatique | Contrôle humain demandé |
| --- | --- | --- | --- |
| HEDS25-628 | Sécurité des votes SI | Matrice RLS et route protégée | Vérifier qu'un Enseignant SI ne voit que ses votes |
| HEDS25-629 | Année académique active | Année 2026–2027 sur les vues critiques | Changer de vue et confirmer que l'année reste cohérente |
| HEDS25-630 | Identités enseignants | Résolution canonique et ambiguïtés testées | Comparer deux enseignants connus dans la feuille de charges |
| HEDS25-631 | Qualité du planning | Indicateurs calculés sur 1 912 créneaux | Vérifier un créneau complet et un créneau incomplet connus |
| HEDS25-632 | Rôles et menus SI | Matrice AdminSoins/RMSoins/EnseignantSoins testée | Ouvrir les menus avec les trois comptes métier |
| HEDS25-633 | Catalogue des postulations | Pagination, année et liens de cours testés | Vérifier un cours, son jour et son ouverture dans le planning |
| HEDS25-634 | Dashboards SI | Instantané partagé et pagination testés | Comparer un total d'heures et un conflit connus |
| HEDS25-635 | Responsive mobile/iPad | 25 tests et parcours vote complet | Contrôler desktop, iPad et téléphone |
| HEDS25-636 | Accessibilité clavier | 10 parcours clavier sans erreur | Parcourir un écran avec Tab, Entrée, Maj+Tab et Échap |
| HEDS25-637 | Tests métier et permissions | 48 tests, SQL RLS et smoke navigateur | Aucun contrôle supplémentaire hors échantillon métier |
| HEDS25-638 | Design SI harmonisé | 12 contrôles visuels | Vérifier la cohérence avec la charte HEdS |
| HEDS25-639 | Affectation RM et annulation | Cycle réel affectation/annulation réussi | Affecter puis annuler un créneau de recette |

## Parcours manuel recommandé

### 1. Compte EnseignantSoins

1. Ouvrir le dashboard Enseignant SI.
2. Aller dans **Cours en postulation**.
3. Rechercher un cours, voter, puis ouvrir **Voir planning**.
4. Confirmer que le bon créneau est surligné et que le planning est en lecture seule.
5. Retirer le vote.

### 2. Compte RMSoins

1. Ouvrir le dashboard RM.
2. Confirmer que seuls les modules du RM sont visibles.
3. Vérifier que le vote enseignant apparaît sur le bon créneau.
4. Affecter l'enseignant, puis utiliser **Annuler**.
5. Confirmer que le vote réapparaît et que l'état du planning est restauré.

### 3. Compte AdminSoins

1. Ouvrir le dashboard Secrétariat SI et les indicateurs qualité.
2. Contrôler l'année académique `2026-2027`.
3. Comparer un total de charge et un conflit avec un exemple connu.
4. Vérifier les six vues principales sur desktop puis sur iPad.

## Conditions de promotion

- les trois parcours manuels sont validés ;
- aucune donnée de recette ne subsiste ;
- une sauvegarde frontend et une sauvegarde de base sont créées avant promotion ;
- le même commit validé sur test est utilisé pour la production ;
- les variables de production sont contrôlées avant le build ;
- une recette courte est rejouée après publication, sans ouvrir de fonctionnalité aux utilisateurs finaux.

Tant que ces conditions ne sont pas confirmées, les tickets restent `EnCours` et
aucune publication en production n'est autorisée.
