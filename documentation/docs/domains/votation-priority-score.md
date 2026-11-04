---
title: Algorithme de tirage au sort — choix pondérés (v6.0)
---

# Algorithme de Tirage au Sort — choix pondérés (v6.0)

> Dernière mise à jour : 4 novembre 2026

## Vue d'ensemble

L'algorithme d'attribution des places de stage PFP fonctionne en 2 étapes :
1. **Frontend** (`VotationPFPViewPHYFP.vue`) : calcule un `priorityScore` pour chaque étudiant éligible
2. **Backend** (`resultatVotationStoreBackend.js`) : attribue les places en traitant les places par popularité croissante, puis en triant les candidats par rang de choix + priorityScore

---

## Barème du Priority Score (max ~100 pts)

| Composante | Points | Description |
|---|---|---|
| **A. Critères manquants globaux** | 0–40 pts | `(nbManquants / 8) × 40` — Plus il manque de critères, plus le score est élevé |
| **B. Bonus DE manquant** | +15 pts | Le critère DE (allemand) est rare et obligatoire pour le diplôme |
| **B. Bonus SYSINT manquant** | +10 pts | Le critère SYSINT est rare, places limitées |
| **C. Bonus SAE** | +12 pts | Situation d'Apprentissage Exceptionnelle — priorité renforcée |
| **D. Bonus cas particulier** | +8 pts | Cas particulier identifié par l'administration |
| **E. Multiplicateur PFP** | ×1.0 à ×1.15 | PFP4: ×1.15 (dernière chance), PFP3: ×1.05, autres: ×1.0 |
| **F. Tiebreaker aléatoire** | 0–1 pt | Départage les vrais ex-aequo uniquement |

### Formule

```
rawScore = missingGlobalScore + bonusDE + bonusSYSINT + bonusSAE + bonusCas + tiebreaker
finalScore = rawScore × pfpMultiplier
```

### Exemples

| Étudiant | Manquants | SAE | Cas part. | PFP | Score approx. |
|---|---|---|---|---|---|
| Étudiant A | DE, SYSINT, MSQ (3/8) | Oui | Non | PFP4 | (15+15+10+12) × 1.15 ≈ **60** |
| Étudiant B | REHAB (1/8) | Non | Non | PFP3 | (5+0+0+0) × 1.05 ≈ **5** |
| Étudiant C | DE, SYSINT, MSQ, NEUROGER, AIGU (5/8) | Non | Oui | PFP4 | (25+15+10+8) × 1.15 ≈ **67** |
| Étudiant D | Aucun (0/8) | Non | Non | PFP2 | (0+0+0+0) × 1.0 ≈ **0.5** (tiebreaker) |

---

## Sources de données pour les critères

Le score est calculé en fusionnant **2 sources** pour avoir la vue la plus complète :

### Source 1 : `StudentsPhysio.pfp_valided` (JSONB array)
- Contient l'historique des stages validés avec leurs critères
- Chaque entrée : `{ PlaceId, pfp_type, MSQ: true/false, SYSINT: true/false, ... }`

### Source 2 : `student_result_vote` (table relationnelle)
- Contient les assignations validées (`pfp_validee = true`)
- Les critères sont résolus via la table `places` (lookup par `assigned_place_id`)

### Fusion
- Pour chaque critère (MSQ, SYSINT, etc.), on incrémente le compteur si validé dans l'une ou l'autre source
- Un critère est "manquant" si son compteur = 0 après fusion des 2 sources

---

## Algorithme d'attribution (Backend) — v6.0 choix pondérés

Code : `backend/domain/weightedChoiceAssignment.js`, appelé par `POST /api/resultat-votation/run-algorithm`.

L'attribution est calculée **pour toute la volée en une fois** (affectation optimale, méthode hongroise sur les créneaux de capacité), et non étudiant par étudiant. Règles, dans cet ordre strict :

| Priorité | Règle | Détail |
|---|---|---|
| 1 | **Le moins de lésés possible** | Un « lésé » n'obtient aucun de ses 5 choix. Ce nombre est minimisé avant tout le reste. |
| 2 | **Pondération des choix** | Coût : choix 1 → 0, choix 2 → 1, choix 3 → 3, choix 4 → 6, choix 5 → 10. La somme est minimisée pour la volée : on évite de donner un 5e choix à quelqu'un pour offrir un 1er choix à un autre. |
| 3 | **SAE et cas particuliers** | Coût de rang ×2 (SAE) ou ×1,5 (cas particulier) : à égalité, ils obtiennent la place disputée et évitent d'être lésés. |
| 4 | **Hors choix** | La place restante qui couvre le plus de critères manquants (allemand d'abord pour un étudiant qui n'a qu'un stage et à qui il manque DE). |
| 5 | **Tirage au sort** | Ne départage que les vrais ex aequo. La graine est renvoyée dans `stats.seed` et notée sur chaque attribution : le tirage est rejouable à l'identique (paramètre `seed`). |

Contraintes toujours respectées :
- les attributions existantes (manuelles, votation prioritaire) sont **conservées** et leur capacité est retirée des places disponibles ;
- une place déjà effectuée par l'étudiant ne lui est **jamais** attribuée ;
- aucune place ne dépasse sa capacité `pfpX_proposition[année]`.

### Sens de `assigned_rank`

| Valeur | Signification |
|---|---|
| 1 à 5 | Rang du choix obtenu |
| 99 | Hors choix (lésé) |
| 0 | Attribution directe (manuelle, prioritaire) |

Le résultat de l'aperçu est enregistré avec le statut `assigned` (affiché « Attribué » dans *Places assignées*), puis publié vers le profil étudiant depuis cette page.

### Exemple réel — BA25 PFP2 2026-2027

58 étudiants à placer pour 58 places. L'ancienne v5.0 (qui n'utilisait les choix que comme indicateur de popularité) aurait laissé 43 étudiants hors de leurs choix. La v6.0 en laisse 8, ce qui est le minimum possible : 6 places restantes n'avaient été choisies par personne.

## Fichiers impliqués

| Fichier | Rôle |
|---|---|
| `src/views/admin/formation-pratique/VotationPFPViewPHYFP.vue` | Frontend : UI votation, calcul priorityScore, appel API |
| `backend/domain/weightedChoiceAssignment.js` | Backend : affectation optimale par choix pondérés (v6.0) |
| `backend/supabase/resultatVotationStoreBackend.js` | Backend : route `run-algorithm`, conservation des existants, statistiques, upsert |
| `src/stores/resultatVotationService.js` | Service frontend : appel `POST /api/resultat-votation/run-algorithm` |

---

## Historique des versions

| Version | Date | Changements |
|---|---|---|
| v1.0 | Fév 2026 | `Math.random() * 100` — Score entièrement aléatoire |
| v2.0 | 9 mars 2026 | Score basé sur critères métier (critères manquants, DE/SYSINT bonus, SAE, cas particulier, pondération PFP). Fusion pfp_valided + student_result_vote. Tiebreaker réduit à 0-1 pt. |
| v5.0 | sept. 2026 | Attribution par critères manquants ; les choix ne servaient plus qu'à mesurer la popularité (régression). |
| v6.0 | 4 nov. 2026 | Choix pondérés, lésés minimisés pour toute la volée, SAE prioritaires, tirage seedé. `assigned_rank` = rang du choix. |
