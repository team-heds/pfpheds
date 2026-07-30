---
title: Systeme multi-filieres SI / PHY
---

# 🏥 Système Multi-Filières SI/PHY - Rapport d'Inspection & Plan

## 📋 Ce que j'ai compris

### Objectif Principal
Créer un système **RBAC multi-filières** pour séparer strictement :
- **SI** = Soins Infirmiers
- **PHY** = Physiothérapie

### Règle d'Or
> Un RM SI ne doit **JAMAIS** voir les données PHY et vice-versa (sauf rôles globaux).

### Multi-casquettes
Un utilisateur peut cumuler plusieurs rôles :
- `TEACHER_SI + RM_SI` ✅
- `TEACHER_PHY + RM_PHY` ✅
- `TEACHER_SI + TEACHER_PHY` ✅ (rare mais possible)

---

## 🎭 Hiérarchie des Rôles

### Rôles Globaux (accès aux DEUX filières)

| Rôle | Code | Droits |
|------|------|--------|
| **SuperAdmin** | `SUPER_ADMIN` | 🔓 TOUS les droits, toutes filières, configuration système |
| **Secrétariat SI** | `SECRETARIAT_SI` | 📋 Vue complète SI, gestion administrative SI, lecture PHY limitée |
| **Secrétariat PHY** | `SECRETARIAT_PHY` | 📋 Vue complète PHY, gestion administrative PHY, lecture SI limitée |

### Rôles par Filière

| Rôle | SI | PHY | Droits |
|------|----|----|--------|
| **Responsable Filière (RF)** | `RF_SI` | `RF_PHY` | 👁️ Vue d'ensemble filière, stats globales, supervision |
| **Admin Filière** | `ADMIN_SI` | `ADMIN_PHY` | ⚙️ Configuration filière, gestion users filière |
| **Responsable Module (RM)** | `RM_SI` | `RM_PHY` | 📚 Gestion modules assignés, planning, enseignants |
| **Enseignant** | `TEACHER_SI` | `TEACHER_PHY` | 👨‍🏫 Voir son planning, ses cours, ses étudiants |
| **Étudiant** | `STUDENT_SI` | `STUDENT_PHY` | 🎓 Voir son planning, ses notes |

### Matrice des Permissions

```
                        │ SuperAdmin │ Secr.SI │ RF_SI │ Admin_SI │ RM_SI │ Teacher_SI │
────────────────────────┼────────────┼─────────┼───────┼──────────┼───────┼────────────┤
Voir modules SI         │     ✅     │    ✅   │   ✅  │    ✅    │  ✅*  │     ✅*    │
Modifier modules SI     │     ✅     │    ✅   │   ❌  │    ✅    │  ✅*  │     ❌     │
Voir planning SI        │     ✅     │    ✅   │   ✅  │    ✅    │  ✅*  │     ✅*    │
Modifier planning SI    │     ✅     │    ✅   │   ❌  │    ✅    │  ✅*  │     ❌     │
Voir enseignants SI     │     ✅     │    ✅   │   ✅  │    ✅    │  ✅*  │     ❌     │
Gérer enseignants SI    │     ✅     │    ✅   │   ❌  │    ✅    │  ✅*  │     ❌     │
Voir stats globales SI  │     ✅     │    ✅   │   ✅  │    ✅    │   ❌  │     ❌     │
────────────────────────┼────────────┼─────────┼───────┼──────────┼───────┼────────────┤
Voir modules PHY        │     ✅     │    ❌   │   ❌  │    ❌    │   ❌  │     ❌     │
Modifier modules PHY    │     ✅     │    ❌   │   ❌  │    ❌    │   ❌  │     ❌     │

* = uniquement sur ses modules/cours assignés
```

---

## 🔍 Phase 0 — Rapport d'Inspection

### Tables Existantes Identifiées

| Table | Usage | Champ filière existant |
|-------|-------|------------------------|
| `modules` | Modules d'enseignement | ❌ Aucun `track_id` |
| `courses` | Cours liés aux modules | ❌ Aucun |
| `course_teachers` | Relation cours-enseignants | ❌ Aucun |
| `planning_cells` | Cellules de planning | ❌ Aucun |
| `user_profiles` | Profils utilisateurs | ✅ `role` + `permissions` (jsonb) |
| `StudentsPhysio` | Données étudiants PHY | ✅ Implicitement PHY |

### Rôles Existants (dans `user_profiles.permissions`)

**Actuellement dans le code:**
- `AdminSoins`, `AdminPhysio`
- `RMSoins`, `RMPhysio`
- `EnseignantSoins`, `EnseignantPhysio`
- `EtudiantSoins`, `EtudiantPhysio`
- `admin`, `super.all`

**À AJOUTER:**
- `SUPER_ADMIN` (remplace `super.all`)
- `SECRETARIAT_SI`, `SECRETARIAT_PHY`
- `RF_SI`, `RF_PHY` (Responsable Filière)

---

## 🗂️ Mapping Ancien → Nouveau

| Ancien Rôle | Nouveau Rôle | Track |
|-------------|--------------|-------|
| `super.all` | `SUPER_ADMIN` | Global |
| `admin` | `ADMIN_SI` ou `ADMIN_PHY` | SI/PHY |
| `AdminSoins` | `ADMIN_SI` | SI |
| `AdminPhysio` | `ADMIN_PHY` | PHY |
| `RMSoins` | `RM_SI` | SI |
| `RMPhysio` | `RM_PHY` | PHY |
| `EnseignantSoins` | `TEACHER_SI` | SI |
| `EnseignantPhysio` | `TEACHER_PHY` | PHY |
| `EtudiantSoins` | `STUDENT_SI` | SI |
| `EtudiantPhysio` | `STUDENT_PHY` | PHY |
| *(nouveau)* | `SECRETARIAT_SI` | SI |
| *(nouveau)* | `SECRETARIAT_PHY` | PHY |
| *(nouveau)* | `RF_SI` | SI |
| *(nouveau)* | `RF_PHY` | PHY |

---

## ✅ Checklist de Mise en Œuvre

### Phase 1 — Modèle Filière
- [ ] Créer table `tracks` (id: SI/PHY, label, is_active)
- [ ] Ajouter `track_id` nullable sur `modules`
- [ ] Backfill: identifier et tagger les modules existants SI vs PHY
- [ ] Ajouter `track_id` sur `courses` (ou dériver du module)

### Phase 2 — Rôles Séparés
- [ ] Créer table `user_track_roles` (user_id, track_id, role)
- [ ] Migrer les rôles existants depuis `permissions` jsonb
- [ ] Mapping: `AdminSoins` → `(SI, ADMIN)`, `RMPhysio` → `(PHY, RM)`, etc.

### Phase 3 — Scopes RM & Teacher
- [ ] Créer/adapter `user_module_roles` pour scope RM par module
- [ ] Vérifier que `course_teachers` permet le filtrage par filière

### Phase 4 — RLS Supabase
- [ ] Créer fonction `has_track_role(track_id, role)`
- [ ] Créer fonction `is_global_admin()`
- [ ] Créer fonction `get_user_tracks()`
- [ ] Policy `modules`: SELECT filtré par track_id + rôle
- [ ] Policy `courses`: SELECT filtré par track du module parent
- [ ] Policy `course_teachers`: SELECT filtré par track

### Phase 5 — Frontend Vue 3
- [ ] Créer `trackStore.js` pour gérer filière active
- [ ] Modifier sidebar pour afficher sections SI/PHY séparées
- [ ] Ajouter guards `requireTrackRole('SI', 'RM')`
- [ ] Sélecteur de filière dans les dashboards

### Phase 6 — Migration Safe
- [ ] Script backfill `track_id` sur modules existants
- [ ] Script migration rôles `permissions` → `user_track_roles`
- [ ] Tests de non-régression
- [ ] Validation des données migrées

### Phase 7 — Documentation
- [ ] Doc technique (schéma, RLS, procédures)
- [ ] Doc utilisateur "Qui voit quoi"

---

## 🎯 Différence SI vs PHY

| Aspect | SI (Soins Infirmiers) | PHY (Physiothérapie) |
|--------|----------------------|---------------------|
| **Étudiants** | Table `user_profiles` (role=EtudiantSoins) | Table `StudentsPhysio` + `user_profiles` |
| **Modules** | À tagger `track_id = 'SI'` | À tagger `track_id = 'PHY'` |
| **RM** | `RMSoins` → gère modules SI | `RMPhysio` → gère modules PHY |
| **Enseignants** | `EnseignantSoins` → voit planning SI | `EnseignantPhysio` → voit planning PHY |
| **Admin** | `AdminSoins` → supervise SI | `AdminPhysio` → supervise PHY |

---

## 🚀 Prochaine Étape

**Phase 1 : Créer la table `tracks` et ajouter `track_id` aux modules.**

Voulez-vous que je commence ?
