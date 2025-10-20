# 🧹 NETTOYAGE MIGRATION PLANNING

## ✅ CE QUI A ÉTÉ FAIT

### **Fichiers supprimés**
- ✅ **`src/service/weeklyPlanningService.js`** - Supprimé (remplacé par planningService)

### **Code nettoyé**
- ✅ **`WeeklyPlanningAdminView.vue`** - Fonctions obsolètes supprimées
  - `generateFromMinibrick()` → Supprimée
  - `generateSemesterFromMinibrick()` → Supprimée
  - Boutons déjà commentés dans le template

### **Script créé**
- ✅ **`scripts/cleanFirebasePlanning.js`** - Script pour nettoyer Firebase

---

## ⚠️ CE QUI RESTE (À FAIRE PLUS TARD)

### **Fichier à garder temporairement**
- ⏳ **`src/service/academicPlanningService.js`** (39KB)
  - Encore utilisé par 4 vues
  - À migrer quand le système minibrick sera sur Supabase

### **Vues à migrer plus tard**
1. **`PlanningAdminView.vue`** - Vue admin minibrick (18 références)
2. **`PlanningView.vue`** - Vue publique minibrick (8 références)
3. **`AnnualPlanningView.vue`** - Vue annuelle (4 références)
4. **`SemesterPlanningAdminView.vue`** - Vue semestre (4 références)

---

## 🗑️ NETTOYAGE FIREBASE

### **Option 1 : Nettoyage automatique (Recommandé)**

```bash
# Depuis la racine du projet
node scripts/cleanFirebasePlanning.js
```

Le script va :
1. Vérifier ce qui existe dans Firebase
2. Vous demander confirmation
3. Supprimer :
   - `/planning/years/*/semesters` (données minibrick obsolètes)
   - `/weeklyPlanning` (données weekly planning obsolètes)

### **Option 2 : Nettoyage manuel**

Dans **Firebase Console** → **Realtime Database** :

1. Supprimer `/weeklyPlanning` (tout le nœud)
2. Pour chaque année dans `/planning/years/` :
   - Supprimer `/semesters` (garder le reste si nécessaire)

---

## 📊 ESPACE LIBÉRÉ

Après nettoyage, vous libérerez :
- **Weekly Planning** : ~X MB (dépend de vos données)
- **Minibrick cells** : ~Y MB (dépend de vos données)

Les données sont maintenant dans **Supabase** :
- Table `modules` (existante)
- Table `planning_time_slots` (nouvelle)

---

## 🔄 WORKFLOW DE MIGRATION COMPLET

### **Phase 1 : TERMINÉ ✅**
- [x] Service unifié créé (`planningService.js`)
- [x] Tables Supabase créées
- [x] `WeeklyPlanningAdminView` migré
- [x] `weeklyPlanningService.js` supprimé
- [x] Code nettoyé

### **Phase 2 : EN ATTENTE ⏳**
- [ ] Migrer le système minibrick vers Supabase
- [ ] Adapter les 4 vues restantes
- [ ] Supprimer `academicPlanningService.js`
- [ ] Nettoyer Firebase complètement

### **Phase 3 : OPTIONNEL**
- [ ] Réimplémenter la génération automatique depuis minibrick
- [ ] Ajouter des fonctionnalités avancées
- [ ] Optimiser les performances

---

## 🎯 RECOMMANDATIONS

### **Court terme (Maintenant)**
1. ✅ Tester le système weekly planning migré
2. ✅ Vérifier que tout fonctionne
3. ⚠️ **NE PAS** nettoyer Firebase tant que les 4 autres vues ne sont pas migrées

### **Moyen terme (Cette semaine/mois)**
1. Migrer les 4 vues minibrick restantes
2. Supprimer `academicPlanningService.js`
3. Nettoyer Firebase avec le script

### **Long terme (Optionnel)**
1. Réimplémenter la génération automatique
2. Ajouter des validations business
3. Améliorer l'UX

---

## ⚠️ IMPORTANT

**NE PAS exécuter le script de nettoyage Firebase tant que :**
- Les 4 vues minibrick ne sont pas migrées
- Vous n'avez pas vérifié que tout fonctionne
- Vous n'avez pas fait de backup

**Une fois le script exécuté, les données Firebase seront DÉFINITIVEMENT supprimées !**

---

## 📞 EN CAS DE PROBLÈME

### **Le planning ne charge pas**
1. Vérifier la console (F12)
2. Vérifier que `planning_time_slots` existe dans Supabase
3. Vérifier les policies RLS dans Supabase

### **Erreur "modules does not exist"**
1. Vérifier que la table s'appelle bien `modules` dans Supabase
2. Vérifier les colonnes : `code`, `number`, `title`, `color`, `year`

### **Erreur "weeklyPlanningService is not defined"**
1. Vérifier qu'aucun import de `weeklyPlanningService` ne reste
2. Vérifier que toutes les références utilisent `planningService`

---

**Date de nettoyage** : 15 octobre 2025  
**Statut** : Phase 1 terminée ✅ - Phase 2 en attente ⏳
