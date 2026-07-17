---
title: Formation Pratique — vue fonctionnelle complète
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Vue métier, pas technique</div>
    <h2 class="docs-section-head__title">Ce que fait réellement la plateforme pour la Formation Pratique</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page explique le domaine en langage fonctionnel : qui fait quoi, dans quel ordre, pourquoi. Pour le détail technique (fichiers, endpoints, tables), voir `domains/formation-pratique-flows.md`, `domains/formation-pratique-traceability.md`, `domains/votation-algorithm.md` et `domains/pfp-services-deep-dive.md`.
  </p>
</div>

## De quoi il s'agit

La "Formation Pratique" (PFP) est le dispositif de **stages cliniques obligatoires** du Bachelor en Physiothérapie. Chaque étudiant doit effectuer une série de stages dans des institutions partenaires (hôpitaux, cliniques, cabinets) réparties sur les 3 années de formation. La plateforme gère l'intégralité du cycle : référencement des lieux de stage, campagnes d'offres, vœux des étudiants, attribution algorithmique des places, validation administrative, et suivi jusqu'à la note finale.

## Les 5 étapes du parcours étudiant

Un·e étudiant·e physiothérapie passe par 5 stages progressifs, chacun avec ses propres règles :

| Stage | Signification | Particularité |
| --- | --- | --- |
| **PFP1A** | 1er stage, 1ère partie | Premier contact avec le terrain |
| **PFP1B** | 1er stage, 2e partie | Suite du premier cycle |
| **PFP2** | 2e stage | Milieu de cursus |
| **PFP3** | 3e stage | Propositions personnalisées par étudiant (voir plus bas) |
| **PFP4** | 4e stage (dernier) | Règles d'attribution les plus complexes, propositions générées automatiquement selon les critères manquants de l'étudiant |

Chaque stage peut être **repris** en cas d'échec (`pfpXX_retake` dans le schéma de données) et fait l'objet d'un suivi d'absences et de remarques individuelles.

## Les acteurs

- **Étudiant·e** : exprime ses vœux de places lors d'une campagne de votation, suit le statut de ses stages, consulte ses résultats d'attribution.
- **Secrétariat Formation Pratique** : maintient le référentiel institutions/places, prépare et suit les campagnes d'offres, vérifie les critères, gère les cas particuliers, produit les récapitulatifs.
- **Répondant HES** : enseignant référent d'un étudiant ou d'un groupe, impliqué dans la signature des conventions de stage.
- **Praticien formateur** : professionnel dans l'institution d'accueil qui encadre l'étudiant sur le terrain.
- **Administrateur Physio** : pilote les campagnes de votation, lance l'algorithme d'attribution, valide les résultats finaux.

## Le cycle complet, étape par étape

### 1. Maintenir le référentiel (en continu, toute l'année)

Le secrétariat tient à jour :
- la liste des **institutions** partenaires (nom, canton, coordonnées, accords-cadres, conventions signées) ;
- les **places** de stage que chaque institution propose, avec leurs caractéristiques : spécialités couvertes (musculo-squelettique, système intégré, neuro-gériatrie, soins aigus, réhabilitation, ambulatoire) et langues parlées sur place (français, allemand, italien, anglais) ;
- les **praticiens formateurs** rattachés à chaque place.

### 2. Campagne d'offres (annuelle, par institution)

Chaque année, les institutions communiquent combien de places elles peuvent offrir, par stage (PFP1A à PFP4). Le secrétariat suit l'envoi et la réception de ces offres institution par institution, avec un tableau récapitulatif consolidé.

### 3. Votation étudiante (par campagne, par cohorte)

Une **session de votation** s'ouvre pour une cohorte donnée (ex. tous les étudiants de 2e année) et un type de stage donné (ex. PFP2). Pendant la fenêtre ouverte, chaque étudiant exprime ses préférences parmi les places disponibles.

Deux mécanismes de votation coexistent :
- **Votation standard** : tout étudiant éligible peut voter.
- **Votation prioritaire** : réservée à une liste précise d'étudiants (ex. étudiants "lésés" par une attribution précédente), avec des raisons de priorité enregistrées explicitement.

Pour **PFP3**, le mécanisme diffère : ce sont des **propositions personnalisées** générées ou saisies par étudiant, pas un simple vœu parmi une liste ouverte.

Pour **PFP4**, les propositions sont **générées automatiquement** par le système selon les critères encore manquants dans le parcours de l'étudiant (ex. un étudiant qui n'a jamais fait de stage en allemand se voit proposer prioritairement des places germanophones).

### 4. Attribution algorithmique (déclenchée par un admin)

Une fois la votation fermée, un administrateur lance l'algorithme d'attribution. Le principe (détaillé dans `domains/votation-algorithm.md`) :
- l'algorithme **ne repart jamais de zéro** — il conserve les attributions déjà faites manuellement ou publiées ;
- il trie les étudiants par **score de priorité**, pas par ordre alphabétique ni par date d'inscription ;
- pour chaque étudiant, il cherche la place qui couvre le **plus de critères manquants** dans son parcours (pas juste "sa place préférée") ;
- s'il n'existe aucune place qui couvre les critères manquants, l'étudiant est quand même assigné à une place disponible, mais le résultat est marqué "hors ciblage" (fallback) — un signal que l'attribution est valide administrativement mais pas idéale pédagogiquement.

Le résultat est d'abord calculé en **aperçu**, puis doit être explicitement **confirmé** par un admin pour devenir définitif.

### 5. Validation et signature

Une fois l'attribution confirmée, chaque stage attribué passe par un circuit de validation administrative :
- vérification des critères couverts par l'étudiant ;
- désignation d'un **répondant HES** et d'un **signataire HES** ;
- enregistrement du **lieu de signature** de la convention (en présentiel, en visioconférence, ou directement par l'étudiant) ;
- validation formelle de la place, puis validation du stage PFP lui-même.

### 6. Suivi et clôture

Pendant et après le stage :
- suivi des **absences** de l'étudiant (chiffré par stage) ;
- remarques libres par stage ;
- statut final : **validé**, **échoué**, ou **arrêté en cours** (avec un commentaire obligatoire expliquant l'arrêt) ;
- suivi des **cas particuliers** identifiés en dehors du circuit standard (par ex. un étudiant avec une situation médicale ou personnelle nécessitant un traitement spécifique) ;
- un **centre d'alertes** signale les situations qui demandent une attention (échéances manquées, cas bloqués, incohérences).

## Les écrans qui portent ce cycle (vue rapide)

| Étape du cycle | Écrans admin correspondants |
| --- | --- |
| Référentiel | Étudiants, Institutions, Enseignants Physio, Praticiens Formateurs, Places |
| Offres | Gestion Offres, Suivi Envoi Offres, Tableau Offres |
| Votation | Votation lésé, Votation PFP |
| Attribution | Places Assignées, Validation Places, Validation PFP |
| Secrétariat / suivi | Vue d'ensemble FP, Vérification Critères, Suivi Institutions, Récap PFP Notes, Récap CPT Évaluation, Suivi Cas Particuliers, Centre d'Alertes |

Détail technique de chaque écran (fichier Vue, store, endpoint, table) : `domains/formation-pratique-traceability.md`.

## Ce qu'il faut retenir pour redévelopper ce domaine

1. **L'algorithme d'attribution est le cœur métier le plus complexe du projet** — toute réécriture doit d'abord comprendre la logique de conservation de l'existant et de couverture des critères manquants avant de toucher au code (`domains/votation-algorithm.md`).
2. **PFP3 et PFP4 ne suivent pas le même mécanisme que PFP1A/1B/PFP2** — ce ne sont pas 5 variantes d'un même flux, mais 2 familles de règles différentes.
3. Les données étudiantes ont accumulé de la dette de schéma réelle (colonnes redondantes `pfp2`/`pfp_2`/`pfp2_data`, typo `pf1b`) — voir `data/schema-supabase.md` avant d'écrire une nouvelle requête sur `StudentsPhysio`.
4. `student_result_vote` est la table la plus sollicitée de toute la plateforme (43 points d'accès directs mesurés) — tout changement de schéma dessus a un impact large, majoritairement dans les vues, pas dans une couche service centralisée (voir `backend/supabase/services.md`).
