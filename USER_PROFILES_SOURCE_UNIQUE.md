# ✅ Noms des Étudiants : Source Unique `user_profiles`

## 🎯 Changement Effectué

Les noms des étudiants proviennent maintenant **UNIQUEMENT** de la table `user_profiles`, sans fusion avec d'autres tables.

---

## 📋 Table Source : `user_profiles`

### Colonnes Utilisées

```sql
-- Identifiant
user_id UUID PRIMARY KEY

-- Noms (colonnes officielles)
display_name VARCHAR(200)  -- Nom d'affichage préféré
forname TEXT              -- Prénom
family_name TEXT          -- Nom de famille

-- Classe
classe TEXT               -- BA22, BA23, BA24, BA25, etc.

-- Autres
email TEXT
role VARCHAR(50)
pfp_cohort TEXT           -- PFP1A, PFP1B
```

---

## 🔧 Fonction Créée : `getStudentsFromUserProfiles()`

### Fichier
`src/service/studentsService.js`

### Code
```javascript
export async function getStudentsFromUserProfiles() {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
  
  // Filtrer les étudiants (rôle ou email @students.hevs.ch)
  const students = data.filter(user => {
    const role = (user.role || '').toLowerCase()
    const email = (user.email || '').toLowerCase()
    
    return (
      role.includes('student') ||
      role.includes('etudiant') ||
      email.includes('@students.hevs.ch')
    )
  })
  
  // Retourner directement les données user_profiles
  return students.map(user => ({
    user_id: user.user_id,
    display_name: user.display_name,
    forname: user.forname,
    family_name: user.family_name,
    classe: user.classe,
    email: user.email,
    // ... autres champs
    source: 'user_profiles_only'  // Flag pour identifier la source
  }))
}
```

---

## 🎨 Affichage des Noms : Logique en Cascade

### Dans le Composant Vue

```javascript
const getStudentName = (userId) => {
  const student = allStudents.value.find(s => s.user_id === userId)
  
  if (student) {
    // 1. Priorité au display_name
    if (student.display_name) return student.display_name
    
    // 2. Sinon construire depuis forname + family_name
    const fullName = `${student.forname || ''} ${student.family_name || ''}`.trim()
    if (fullName) return fullName
    
    // 3. Fallback sur email
    if (student.email) return student.email.split('@')[0]
  }
  
  return 'Inconnu'
}
```

---

## 📊 Avantages

### ✅ Source Unique et Fiable
- Pas de mélange entre tables
- Pas de risque de doublons
- Données toujours cohérentes

### ✅ Performance
- Une seule requête SQL
- Pas de jointures complexes
- Chargement plus rapide

### ✅ Maintenance
- Code plus simple
- Moins de bugs potentiels
- Facile à debugger

---

## 🔍 Logs de Vérification

### Dans la Console
```
📚 Chargement des étudiants BA25 depuis user_profiles...
✅ 32 étudiants chargés depuis user_profiles (source unique)
✅ 32 étudiants BA25 chargés depuis user_profiles (source unique)

🔍 Échantillon étudiant:
  {
    user_id: "d11a178a-853f-455d-80c6-438c2a1b18a1",
    display_name: "Adelie Dacampo",
    forname: "Adelie",
    family_name: "Da Campo",
    email: "adelie.dacampo@students.hevs.ch"
  }
```

---

## 🎯 Utilisation dans l'Application

### Fichier Modifié
`src/views/admin/formation-pratique/VotationPFPViewPHYFP.vue`

### Import
```javascript
import { getStudentsFromUserProfiles } from '@/service/studentsService'
```

### Chargement
```javascript
const loadData = async () => {
  // Charger depuis user_profiles UNIQUEMENT
  const allStudentsData = await getStudentsFromUserProfiles()
  
  // Filtrer par classe BA25
  allStudents.value = allStudentsData.filter(student => {
    const classe = student.Classe || student.classe
    return classe === 'BA25'
  })
}
```

---

## 🧪 Tests de Vérification

### Test 1 : Source des Données
```javascript
console.log(allStudents.value[0].source)
// Résultat attendu: "user_profiles_only"
```

### Test 2 : Présence des Noms
```javascript
allStudents.value.forEach(student => {
  console.log({
    display_name: student.display_name,
    forname: student.forname,
    family_name: student.family_name
  })
})
// Tous les étudiants doivent avoir au moins display_name OU (forname + family_name)
```

### Test 3 : Affichage
```javascript
const name = getStudentName(userId)
console.log(name)
// Ne doit jamais retourner "Inconnu" si l'étudiant existe
```

---

## 📚 Différence avec `getAllStudents()`

| Fonction | Source | Fusion | Complexité |
|----------|--------|--------|------------|
| `getAllStudents()` | user_profiles + studentPhysio | Oui | Élevée |
| `getStudentsFromUserProfiles()` | **user_profiles uniquement** | **Non** | **Faible** ✓ |

### Migration
```javascript
// ❌ ANCIEN (mélange de sources)
import { getAllStudents } from '@/service/studentsService'
const students = await getAllStudents()

// ✅ NOUVEAU (source unique)
import { getStudentsFromUserProfiles } from '@/service/studentsService'
const students = await getStudentsFromUserProfiles()
```

---

## 🔮 Bénéfices Futurs

### Évolutivité
- Facile d'ajouter de nouveaux champs depuis `user_profiles`
- Pas de dépendance sur des tables legacy

### Cohérence
- Tous les composants peuvent utiliser la même fonction
- Noms toujours affichés de la même manière

### Debug
- Logs clairs : "user_profiles (source unique)"
- Facile de tracer d'où viennent les données

---

## ✅ Checklist de Validation

- [x] Fonction `getStudentsFromUserProfiles()` créée
- [x] Import mis à jour dans le composant Vue
- [x] Appel à la fonction modifié
- [x] Logs de debug ajoutés
- [x] Flag `source: 'user_profiles_only'` présent
- [x] Fonction `getStudentName()` utilise les bonnes colonnes
- [x] Tests manuels effectués

---

**Date** : 11 décembre 2025  
**Version** : 1.0  
**Statut** : ✅ Production Ready  
**Auteur** : Cascade AI
