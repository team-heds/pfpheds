---
title: Algorithme de tirage au sort — Priority Score v2.0
---

# Algorithme de Tirage au Sort — Priority Score v2.0

> Dernière mise à jour : 9 mars 2026

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

## Algorithme d'attribution (Backend)

### Étape 0 — Charger les assignations existantes
- Les étudiants déjà assignés (manuellement, par votation prioritaire) sont **exclus**
- La capacité des places est **réduite** par les assignations existantes

### Étape 1 — Calculer la popularité de chaque place
- Compter combien de fois chaque place apparaît dans les choix des étudiants

### Étape 2 — Attribution par place (moins populaires → plus populaires)
Pour chaque place (en commençant par les moins demandées) :
1. Trouver tous les candidats qui ont choisi cette place
2. **Trier** :
   - Par **rang de choix** (1er choix d'abord)
   - À rang égal, par **priorityScore** (descendant — plus élevé = plus prioritaire)
   - À score égal, **aléatoire**
3. Assigner jusqu'à la capacité restante

### Étape 3 — Attribution aléatoire des restants
- Étudiants non assignés → places avec capacité restante (ordre aléatoire)
- `assigned_rank = 99` pour identifier les attributions aléatoires

---

## Fichiers impliqués

| Fichier | Rôle |
|---|---|
| `src/views/admin/formation-pratique/VotationPFPViewPHYFP.vue` | Frontend : UI votation, calcul priorityScore, appel API |
| `backend/supabase/resultatVotationStoreBackend.js` | Backend : algo d'attribution, batch upsert résultats |
| `src/stores/resultatVotationService.js` | Service frontend : appel `POST /api/resultat-votation/run-algorithm` |

---

## Historique des versions

| Version | Date | Changements |
|---|---|---|
| v1.0 | Fév 2026 | `Math.random() * 100` — Score entièrement aléatoire |
| v2.0 | 9 mars 2026 | Score basé sur critères métier (critères manquants, DE/SYSINT bonus, SAE, cas particulier, pondération PFP). Fusion pfp_valided + student_result_vote. Tiebreaker réduit à 0-1 pt. |
