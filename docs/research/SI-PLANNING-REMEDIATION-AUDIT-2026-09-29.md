# Audit de remédiation du planning SI

Date : 29 septembre 2026

Environnement audité : base Supabase de `test.hedsvs.ch`

Mode : lecture seule

Production : inchangée

## Objectif

Séparer les anomalies corrigeables sans interprétation des éléments qui exigent
une décision du Secrétariat, du RM ou du planificateur. Aucune donnée de planning
n'a été modifiée pendant cet audit.

## Périmètre

- année académique active : `2026-2027` ;
- 11 classes actives ;
- 1 912 créneaux analysés ;
- alias historiques `B`, `BA` et `BAC` pris en compte.

## Résultats

| Domaine | Total signalé | Correspondance unique | Décision nécessaire |
| --- | ---: | ---: | ---: |
| Liens vers un cours | 263 | 2 | 261 |
| Enseignants absents ou placeholders | 831 | 7 | 824 |
| Salles physiques absentes | 1 715 | 0 | 1 715 |
| Horaires | 11 | 4 formats normalisables | 7 horaires absents |

Parmi les 831 créneaux sans enseignant concret, 803 sont vides et 28 contiennent
uniquement un placeholder, par exemple une postulation ou une affectation à définir.

## Correction logicielle sûre

Quatre créneaux utilisaient la notation suisse `08h30` / `15h30`. Ces valeurs
étaient correctes mais le calcul ne reconnaissait pas le séparateur `h`. Le parseur
accepte désormais `HHhMM` en plus de `HH:MM`, `HH.MM` et `HHMM`.

Cette correction ne modifie aucune ligne de la base. Elle retire quatre faux
positifs et laisse visibles les sept créneaux réellement sans horaire :

- `3973` — Cyberlearn, horaire à définir ;
- `3974` — Oral, horaire à définir ;
- `4006` — Projet ETP intermodulaire ;
- `4025` — Cyberlearn éthique et communication ;
- `4046` — ECOS ;
- `4047` — Cyberlearn ;
- `4169` — Simulation interannée selon horaire de passage.

## Candidats à confirmer avant modification

Deux liens de cours possèdent une correspondance unique par module et titre :

- créneau `4560`, module `S.SI.374.2023.F.24` ;
- créneau `4562`, module `S.SI.374.3889.F.24`.

Ces correspondances restent des propositions de contrôle. Elles ne doivent être
écrites qu'après validation métier. Les sept propositions d'enseignant doivent
également être présentées dans une vue de prévisualisation avant toute écriture.

## Recommandation pour la suite

Créer un écran de remédiation avec trois états :

1. **Proposition automatique à confirmer** — comparaison avant/après et source de
   la correspondance ;
2. **Décision métier nécessaire** — sélection explicite d'un cours, enseignant ou
   salle ;
3. **Exception assumée** — motif obligatoire et exclusion documentée du score.

Les corrections doivent être unitaires, historisées, annulables et limitées au
périmètre SI de l'année académique active.

## Reproductibilité

Audit : `deploy/staging/audit-si-planning-remediation.mjs`.

La commande est protégée contre une autre destination que la base test et ne fait
aucune écriture.
