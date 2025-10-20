# 🎓 INITIALISATION DES ANNÉES ACADÉMIQUES

## 🎯 Problème

Vous avez initialisé des années dans **Firebase** (bac25, bac24, bac23), mais le système de planning weekly utilise maintenant **Supabase**.

Il faut créer les années dans **Supabase** !

---

## ✅ SOLUTION 1 : Script automatique (Rapide)

### **Exécuter le script**

```bash
node scripts/initSupabaseAcademicYears.js
```

### **Ce que le script fait**

1. ✅ Crée **8 années académiques** (2023-2024 jusqu'à 2030-2031)
2. ✅ Crée toutes les **classes** pour chaque année :
   - **Temps plein** : B26, B25, B24 (3 classes)
   - **Temps partiel** : B26-PT, B25-PT, B24-PT, B23-PT (4 classes)
3. ✅ Active l'année **2026-2027** par défaut

### **Résultat**

Vous aurez dans Supabase :
- `academic_years` : 8 années
- `classes` : ~56 classes (7 par année × 8 années)

---

## ✅ SOLUTION 2 : Interface graphique (Manuel)

### **1. Créer une année académique**

1. Aller sur `/admin/academic-years`
2. Cliquer **"Nouvelle Année Académique"**
3. Entrer l'année : **2026** (générera 2026-2027)
4. Cliquer **"Créer"**

### **2. Générer les classes**

1. Dans le tableau, cliquer **"Classes"** sur l'année 2026-2027
2. Cliquer **"Générer Classes Automatiquement"**
3. Choisir :
   - **Modalité** : Temps plein
   - **Année de la 1ère année** : 2026
4. Cliquer **"Générer"**

Cela va créer :
- `B26` → 1ère année
- `B25` → 2ème année
- `B24` → 3ème année

### **3. Répéter pour temps partiel**

1. Cliquer à nouveau **"Générer Classes Automatiquement"**
2. Choisir :
   - **Modalité** : Temps partiel
   - **Année de la 1ère année** : 2026
3. Cliquer **"Générer"**

Cela va créer :
- `B26-PT` → 1ère année PT
- `B25-PT` → 2ème année PT
- `B24-PT` → 3ème année PT
- `B23-PT` → 4ème année PT

---

## 📊 MAPPING DES CLASSES

### **Comment ça fonctionne**

Le système convertit automatiquement les codes :

| Code Supabase | Code Planning | Description |
|---------------|---------------|-------------|
| `B26`         | `bac26`       | 1ère année TP 2026-2027 |
| `B25`         | `bac25`       | 2ème année TP 2026-2027 |
| `B24`         | `bac24`       | 3ème année TP 2026-2027 |
| `B26-PT`      | `bac26-pt`    | 1ère année PT 2026-2027 |
| `B25-PT`      | `bac25-pt`    | 2ème année PT 2026-2027 |

### **Dans le dropdown du planning**

Vous verrez :
```
1ère année 2026-2027 / B26
2ème année 2026-2027 / B25
3ème année 2026-2027 / B24
1ère année 2026-2027 / B26 (PT)
2ème année 2026-2027 / B25 (PT)
...
```

---

## 🧪 VÉRIFICATION

### **1. Vérifier dans Supabase**

**Table Editor** → **academic_years** :
```
2023-2024  Inactive
2024-2025  Inactive
2025-2026  Inactive
2026-2027  ✅ Active
2027-2028  Inactive
...
```

**Table Editor** → **classes** :
```
B26    Bachelor 2026 - 1ère année (Temps plein)      year_level: 1
B25    Bachelor 2025 - 2ème année (Temps plein)      year_level: 2
B24    Bachelor 2024 - 3ème année (Temps plein)      year_level: 3
B26-PT Bachelor 2026 - 1ère année (Temps partiel)   year_level: 1
B25-PT Bachelor 2025 - 2ème année (Temps partiel)   year_level: 2
...
```

### **2. Tester le planning**

1. Aller sur `/admin/planning/weekly`
2. Le dropdown **"Classe"** devrait afficher toutes vos classes
3. Sélectionner **bac26** (ou n'importe quelle classe)
4. Sélectionner une **semaine**
5. Créer un **créneau de test**

---

## ⚠️ IMPORTANT

### **Firebase vs Supabase**

| Ancien (Firebase) | Nouveau (Supabase) | Statut |
|-------------------|---------------------|--------|
| `academicPlanningService` | `academicYearService` | ✅ Migré |
| `weeklyPlanningService` | `planningService` | ✅ Migré |
| `/planning/years/` | `academic_years` table | ✅ Remplacé |
| `/weeklyPlanning/` | `planning_time_slots` table | ✅ Remplacé |

### **Ce qu'il faut faire**

1. ✅ **Utiliser le script** OU créer les années manuellement
2. ✅ **Tester le planning** sur `/admin/planning/weekly`
3. ⚠️ **NE PAS** utiliser l'initialisation Firebase (obsolète)

---

## 🔧 EN CAS DE PROBLÈME

### **Erreur: "Aucune année académique active"**

**Solution** :
1. Aller sur `/admin/academic-years`
2. Cliquer **"Activer"** sur une année
3. Retourner sur `/admin/planning/weekly`

### **Erreur: "Impossible de charger les classes"**

**Solution** :
1. Vérifier que les tables existent dans Supabase :
   - `academic_years`
   - `classes`
2. Vérifier les policies RLS
3. Exécuter le script d'initialisation

### **Les classes n'apparaissent pas dans le dropdown**

**Solution** :
1. Ouvrir la console (F12)
2. Vérifier les erreurs
3. S'assurer qu'une année est **active**
4. Rafraîchir la page

---

## 🚀 APRÈS L'INITIALISATION

Une fois les années créées, vous pouvez :

1. **Créer des créneaux** dans `/admin/planning/weekly`
2. **Voir le planning** dans `/admin/planning`
3. **Dupliquer des semaines** pour gagner du temps
4. **Exporter en Excel** pour partager

**Tout le système est maintenant sur Supabase !** 🎉
