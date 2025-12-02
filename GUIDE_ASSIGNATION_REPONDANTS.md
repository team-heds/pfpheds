# 📋 Guide d'Assignation des Répondants HES - BA25

## 🎯 Objectif

Ce formulaire permet aux administrateurs d'assigner facilement les répondants HES à tous les étudiants de première année (BA25) en une seule page.

## 🔗 Accès

**URL** : `/admin/formation-pratique/assign-repondants-ba25`

**Permissions requises** : `page1.access` (Admin/Formation Pratique)

## ✨ Fonctionnalités

### 📊 Vue d'ensemble
- **Statistiques en temps réel** :
  - Nombre total d'étudiants BA25
  - Nombre d'étudiants avec répondant assigné
  - Nombre d'étudiants sans répondant

### 📝 Tableau interactif
- **Recherche globale** : Rechercher par nom, prénom, email ou répondant
- **Tri** : Tri par colonne (nom, prénom, email)
- **Pagination** : 20, 50 ou 100 étudiants par page

### 🎨 Interface intuitive
- **Dropdown intelligent** : Liste tous les répondants HES avec leurs classes
- **Statut visuel** : Tags colorés pour voir l'état de chaque assignation
- **Actions individuelles** : Sauvegarder ou annuler les modifications par étudiant

## 🔄 Workflow

### 1️⃣ Chargement automatique
Au chargement de la page :
- Les étudiants BA25 sont chargés depuis `user_profiles`
- Les données sont enrichies depuis `StudentsPhysio` si disponibles
- Les répondants HES sont récupérés de `StudentsPhysio`

### 2️⃣ Assignation
Pour chaque étudiant :
1. Sélectionnez un répondant dans le dropdown
2. Le statut passe à "Modifié" (tag bleu)
3. Cliquez sur l'icône 💾 pour sauvegarder individuellement
4. OU utilisez "Sauvegarder toutes les modifications" en haut

### 3️⃣ Sauvegarde
Lors de la sauvegarde, le système :
1. ✅ Met à jour `user_profiles.hes_referent`
2. ✅ Met à jour `StudentsPhysio` si l'enregistrement existe
3. ✅ **Crée automatiquement** une ligne dans `StudentsPhysio` si elle n'existe pas

## 🗄️ Structure de données créée

### Nouvelle ligne dans StudentsPhysio
```json
{
  "user_id": "uuid-de-l-etudiant",
  "class": "BA25",
  "respondant_hes": "Nom du Répondant",
  "repondant_hes": "Nom du Répondant",
  "RepondantHES": "Nom du Répondant"
}
```

### Mise à jour dans user_profiles
```json
{
  "hes_referent": "Nom du Répondant",
  "updated_at": "2024-12-02T10:30:00.000Z"
}
```

## 📌 Points importants

### ✅ Avantages
- **Création automatique** : Pas besoin de créer manuellement les lignes dans StudentsPhysio
- **Double sauvegarde** : Les données sont synchronisées dans les deux tables
- **Gestion intelligente** : Détecte si l'enregistrement existe déjà
- **Batch processing** : Possibilité de tout sauvegarder en une fois

### ⚠️ Précautions
- Les modifications ne sont **pas automatiquement sauvegardées**
- Pensez à cliquer sur "Sauvegarder" avant de quitter la page
- Les statuts "Modifié" indiquent des changements non sauvegardés

## 🔍 Colonnes du tableau

| Colonne | Description |
|---------|-------------|
| **Nom** | Nom de famille de l'étudiant |
| **Prénom** | Prénom de l'étudiant |
| **Email** | Email institutionnel |
| **Répondant Actuel** | Répondant HES actuel (vert = assigné, orange = non assigné) |
| **Nouveau Répondant** | Dropdown pour sélectionner le nouveau répondant |
| **Statut** | État de la modification (Modifié/Sauvegardé) |
| **Actions** | Sauvegarder ou annuler individuellement |

## 💾 Options de sauvegarde

### Sauvegarde individuelle
- Cliquez sur l'icône 💾 pour un étudiant spécifique
- Seul cet étudiant sera sauvegardé
- Utile pour des modifications ponctuelles

### Sauvegarde groupée
- Bouton "Sauvegarder toutes les modifications" (vert, en haut)
- Sauvegarde tous les étudiants avec le statut "Modifié"
- Affiche un résumé : X réussis, Y échoués

## 🎯 Cas d'usage

### Scénario 1 : Attribution initiale BA25
1. Les étudiants BA25 arrivent sans répondant assigné
2. L'administrateur accède au formulaire
3. Pour chaque étudiant, sélectionne le répondant approprié
4. Clique sur "Sauvegarder toutes les modifications"
5. ✅ Toutes les lignes StudentsPhysio sont créées automatiquement

### Scénario 2 : Modification d'un répondant
1. Un étudiant change de répondant
2. L'administrateur trouve l'étudiant (recherche par nom)
3. Sélectionne le nouveau répondant
4. Sauvegarde individuellement
5. ✅ Les deux tables sont mises à jour

### Scénario 3 : Réassignation de groupe
1. Un répondant change pour plusieurs étudiants
2. L'administrateur sélectionne le nouveau répondant pour chacun
3. Clique sur "Sauvegarder toutes les modifications"
4. ✅ Batch update de tous les étudiants concernés

## 🔔 Notifications

Le système affiche des notifications Toast pour :
- ✅ **Succès** : Sauvegarde réussie
- ⚠️ **Avertissement** : Aucune modification à sauvegarder
- ❌ **Erreur** : Problème lors de la sauvegarde

## 🛠️ Maintenance

### Recharger les données
Bouton "Recharger" (en haut à droite) :
- Recharge les étudiants depuis la base
- Recharge les répondants disponibles
- Annule les modifications non sauvegardées

### Annuler une modification
Icône ❌ à côté de chaque étudiant :
- Annule la modification pour cet étudiant
- Remet le dropdown à vide
- Retire le statut "Modifié"

## 📊 Exemple de workflow complet

```
1. Accès au formulaire
   └─> Chargement automatique de 45 étudiants BA25

2. Statistiques affichées
   ├─> Total : 45 étudiants
   ├─> Avec répondant : 0
   └─> Sans répondant : 45

3. Assignation
   ├─> Étudiant 1 : Dr. Martin → Modifié
   ├─> Étudiant 2 : Dr. Dubois → Modifié
   └─> ... (43 autres)

4. Sauvegarde groupée
   └─> Clic sur "Sauvegarder toutes les modifications"

5. Traitement
   ├─> Création lignes StudentsPhysio : 45/45 ✅
   └─> Mise à jour user_profiles : 45/45 ✅

6. Résultat
   ├─> Total : 45 étudiants
   ├─> Avec répondant : 45 ✅
   └─> Sans répondant : 0
```

## 🔗 Liens utiles

- **Table user_profiles** : Stocke le répondant principal
- **Table StudentsPhysio** : Données enrichies des étudiants physio
- **CardNameProfile.vue** : Affiche le répondant dans le profil étudiant

## 📝 Notes techniques

### Colonnes StudentsPhysio utilisées
Le système gère plusieurs formats de colonnes pour la compatibilité :
- `respondant_hes` (nouveau format)
- `repondant_hes` (format alternatif)
- `repondanthes` (format compact)
- `RepondantHES` (format legacy)

Lors de la sauvegarde, **tous les formats sont remplis** pour assurer la compatibilité.

### Identifiant unique
L'`user_id` (UUID Supabase) est utilisé comme clé primaire pour :
- ✅ Éviter les doublons
- ✅ Assurer la cohérence entre tables
- ✅ Permettre les mises à jour

## 🚀 Prochaines améliorations possibles

- [ ] Export Excel de la liste des assignations
- [ ] Import CSV pour assignation en masse
- [ ] Historique des modifications
- [ ] Notifications email aux répondants
- [ ] Réassignation automatique selon critères
