# HEDS25-631 — Rapport de validation test

Date : 2026-09-29  
Environnement modifié : `test.hedsvs.ch` uniquement

## Corrections réalisées

- Filtrage strict du diagnostic par les codes et alias des classes de l'année active.
- Refus explicite d'un repli non borné si `academic_year_id` est indisponible et qu'aucune classe active n'est fournie.
- Un créneau sans enseignant valide ne compte qu'une fois dans l'indicateur visible.
- Ajout de `completeSlots`, `slotsWithAnyIssue`, `teacherIssueSlots` et `qualityScore`.
- Les activités explicitement distantes ou asynchrones ne produisent plus de faux positif de salle ; une activité asynchrone ne produit plus de faux positif d'horaire.
- Calcul partagé entre les dashboards Secrétariat et RM Soins.

## Audit de la base test

- `planning_time_slots.academic_year_id` : colonne absente.
- Classes actives 2026–2027 : 11 classes (`B24`, `B25`, `B26` et variantes EE/PA/TP).
- Créneaux appartenant à ces classes via les alias `B…`/`BAC…` : 1 912.
- Valeurs brutes avant règles d'exception :
  - 263 sans rattachement `course_id` ;
  - 0 sans activité ;
  - 1 892 sans salle brute ;
  - 134 sans horaire brut ;
  - 803 sans enseignant déclaré.

## Preuves automatisées

- 18 tests SI ciblés réussis sur 4 fichiers.
- ESLint ciblé réussi.
- Build isolé avec configuration test réussi.
- Déploiement test réussi avec sauvegarde.

## Contrôle visuel sur `test.hedsvs.ch`

### Dashboard Secrétariat SI

- Année active affichée : 2026–2027.
- Classes actives : 11.
- Modules SI : 39.
- Enseignants SI : 18.
- Créneaux du planning : 1 912 ; créneaux scannés : 1 912.
- Qualité : 3,4 %, soit 65 créneaux complets sur 1 912.
- 263 créneaux sans cours rattaché.
- 852 créneaux avec un problème d'enseignant, comptés une seule fois par créneau.
- 1 715 créneaux sans salle après application des exceptions distant/asynchrone.
- 11 créneaux avec un horaire invalide après application de l'exception asynchrone.

### Dashboard RM Soins

Le compte administrateur de test ne possède qu'un module RM fictif sans créneau. Le dashboard affiche donc correctement :

- `Qualité : —` ;
- `Créneaux scannés : 0` ;
- un message indiquant qu'aucun créneau des modules du RM n'est disponible pour l'année active.

Ce cas ne produit plus de faux score de qualité à 100 %.

## Déploiement test

- Script : `deploy/staging/deploy-heds631-test.sh`.
- Sauvegarde : `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-631-20260929-130038`.
- SHA-256 de `index.html` : `dc8812b44e9d71b3b30bede5f259b1f5bff72f6eed99315f2f0dd5ed781f1c12`.
- SHA-256 du service worker : `1acae204dfbde6e519fb4218658225f2bf3cb34b2af6b6996e7cd96551d32d1e`.
- Production non modifiée.

## Conclusion

La correction est validée sur l'environnement de test. Les indicateurs restent des diagnostics en lecture seule : aucune donnée de planning n'est corrigée automatiquement. Aucune promotion en production ne doit être faite sans validation fonctionnelle explicite.

## Complément du 29 septembre 2026

L'audit de remédiation a identifié quatre faux positifs dus à la notation d'heure
`HHhMM`. Le parseur accepte désormais ce format sans modifier les lignes de la base.
Le diagnostic attendu passe ainsi de 11 horaires invalides à 7 horaires réellement
absents.

Preuves : 18 tests SI ciblés et lint réussis. L'analyse détaillée est disponible
dans `docs/research/SI-PLANNING-REMEDIATION-AUDIT-2026-09-29.md`.

Déploiement complémentaire sur test :

- dashboard contrôlé visuellement avec `7` horaires à corriger ;
- index : `0b653ab485dbc83fa9e8b742ad9700e497e1a18e1855ecfb5d6577de71b2c645` ;
- service worker : `a1072a45eab0f978d7a36feca7ded35cdb5c60d2afaa5fea9c2614665a09e7ea` ;
- rollback : `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-631-20260929-220302.tar.gz` ;
- production inchangée.

## Interface de remédiation en lecture seule — 29 septembre 2026

Une interface dédiée est maintenant disponible sur l'environnement de test à
`/admin/soins-infirmiers/qualite-planning`. Elle reprend le diagnostic HEDS25-631,
classe les anomalies par niveau de décision et présente les correspondances
uniques sans effectuer aucune écriture.

Rapport détaillé :
`docs/research/SI-PLANNING-REMEDIATION-UI-2026-09-29.md`.
