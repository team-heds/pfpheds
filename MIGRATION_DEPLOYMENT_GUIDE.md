# 🚀 Guide de Déploiement - Migration Institutions Supabase

## ✅ État de la migration : 100% COMPLÉTÉE

Tous les fichiers ont été migrés vers Supabase. Cette migration est **prête à être activée**.

---

## 📋 Prérequis

### Variables d'environnement requises

Vérifie que ton fichier `.env` contient :

```env
# Supabase (REQUIS pour la migration)
VITE_SUPABASE_REST_URL=https://api2.hedsvs.ch/rest/v1
VITE_SUPABASE_KEY=eyJhbGci...

# Firebase (encore utilisé pour Places, Users, Votations)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_STORAGE_BUCKET=...
```

---

## 🎯 Étape 1 : Créer la table Supabase

### Option A : Via Supabase CLI (recommandé)

```bash
# Si tu as déjà un projet Supabase configuré
cd C:\Users\antoine.quarroz\Desktop\LabDev\pfpheds
supabase db push
```

### Option B : Via Supabase Dashboard

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. Va dans **SQL Editor**
4. Copie le contenu de `supabase_migrations/20251028_create_institutions.sql`
5. Exécute le script

### Vérification

Dans le SQL Editor, vérifie que la table existe :

```sql
SELECT COUNT(*) FROM institutions;
-- Devrait retourner 0 (table vide)
```

---

## 📥 Étape 2 : Importer les données Firebase → Supabase

### Préparer l'export Firebase

1. **Via Firebase Console** :
   - Va sur https://console.firebase.google.com
   - Sélectionne ton projet
   - Va dans **Realtime Database**
   - Clique sur les 3 points → **Export JSON**
   - Sauvegarde dans `backend/firebasedata/pfpheds-default-rtdb-export.json`

2. **Ou utilise l'export existant** (si disponible)

### Exécuter le script d'import

```bash
cd C:\Users\antoine.quarroz\Desktop\LabDev\pfpheds
node backend/supabase/importInstitutions.js
```

**Sortie attendue :**
```
🔄 Démarrage de l'import des institutions...
📂 Lecture du fichier Firebase...
✅ 42 institutions trouvées dans Firebase
🔄 Import vers Supabase...
✅ 42 institutions importées avec succès!
```

### Vérification dans Supabase

```sql
-- Vérifier le nombre total
SELECT COUNT(*) FROM institutions;

-- Voir un échantillon
SELECT "InstitutionId", "Name", "Locality", "Canton" 
FROM institutions 
LIMIT 5;

-- Vérifier les images
SELECT "InstitutionId", "Name", "ImageURL"
FROM institutions 
WHERE "ImageURL" IS NOT NULL
LIMIT 5;
```

---

## 🧪 Étape 3 : Tester l'application

### Démarrer le serveur de développement

```bash
npm run dev
```

### Tests critiques à effectuer

#### ✅ Test 1 : Recherche globale (Ctrl+K)
1. Ouvre l'app
2. Appuie sur `Ctrl+K`
3. Tape "Cabinet" ou "Sierre"
4. **Attendu** : Des institutions apparaissent dans les résultats
5. Clique sur un résultat
6. **Attendu** : Navigue vers `/institution/:id`

#### ✅ Test 2 : Liste publique institutions
1. Va sur `/institutions`
2. **Attendu** : Liste de toutes les institutions avec filtres
3. Utilise les filtres par canton
4. **Attendu** : Filtrage fonctionne
5. Clique sur une institution
6. **Attendu** : Navigue vers la page de détails

#### ✅ Test 3 : Détails d'une institution
1. Va sur `/institution/:id` (remplace `:id` par un ID valide)
2. **Attendu** :
   - Nom de l'institution affiché
   - Informations complètes (adresse, canton, langue)
   - Carte Leaflet affichée avec marqueur
   - Image institution visible
   - Contact responsable physio visible

#### ✅ Test 4 : Admin - Liste institutions
1. Connecte-toi en tant qu'admin
2. Va sur `/institution_list`
3. **Attendu** : DataTable avec toutes les institutions
4. Teste la recherche
5. **Attendu** : Filtrage temps réel fonctionne
6. Teste les boutons (Détails, Modifier)

#### ✅ Test 5 : Admin - Détails institution
1. Va sur `/institution_details/:id`
2. **Attendu** :
   - Toutes les informations affichées
   - Carte Leaflet fonctionnelle
   - Image affichée correctement

#### ✅ Test 6 : CRUD complet
1. **Création** : Va sur le formulaire de création
   - Crée une nouvelle institution
   - **Attendu** : Institution créée dans Supabase
2. **Modification** : Modifie l'institution créée
   - **Attendu** : Modifications sauvegardées
3. **Suppression** : Supprime l'institution de test
   - **Attendu** : Institution supprimée de Supabase

#### ✅ Test 7 : Carte avec filtres
1. Va sur la page avec `FilterInstitution.vue`
2. **Attendu** :
   - Carte Leaflet affichée
   - Marqueurs pour chaque institution
3. Clique sur un marqueur
4. **Attendu** : Dialog avec détails institution
5. Utilise les filtres (cantons, catégories)
6. **Attendu** : Marqueurs filtrés dynamiquement

---

## 🔍 Débogage en cas de problème

### Problème : Aucune institution affichée

**Console navigateur :**
```javascript
// Vérifie que le store charge les données
console.log(institutionsStore.institutions)
```

**Résolutions :**
1. Vérifie que les variables d'environnement sont correctes
2. Vérifie que la table Supabase existe (`SELECT * FROM institutions`)
3. Vérifie les logs du script d'import
4. Vérifie les politiques RLS dans Supabase (doivent permettre SELECT public)

### Problème : Erreur CORS

**Solution :**
1. Va dans Supabase Dashboard → Settings → API
2. Vérifie que l'URL autorisée inclut `http://localhost:5173`

### Problème : Données manquantes

**Vérification :**
```sql
-- Compter les institutions par canton
SELECT "Canton", COUNT(*) as count
FROM institutions
GROUP BY "Canton"
ORDER BY count DESC;

-- Vérifier les coordonnées GPS
SELECT COUNT(*) as total,
       COUNT("Latitude") as with_latitude,
       COUNT("Longitude") as with_longitude
FROM institutions;
```

### Problème : Images ne s'affichent pas

**Vérification :**
```sql
-- Voir le format des ImageURL
SELECT "InstitutionId", "ImageURL"
FROM institutions
WHERE "ImageURL" IS NOT NULL
LIMIT 5;
```

**Solutions :**
1. Le store normalise automatiquement `ImageURL` (array vs string)
2. Vérifie que Firebase Storage est toujours accessible (images encore hébergées là)
3. Si les URLs sont cassées, réimporte les données

---

## 📊 Comparaison Firebase vs Supabase

Après l'import, vérifie la cohérence :

```sql
-- Dans Supabase
SELECT COUNT(*) as supabase_count FROM institutions;
```

```javascript
// Dans Firebase Console
// Va dans Realtime Database
// Compte manuellement les institutions sous /Institutions/
```

**Les deux chiffres doivent être identiques.**

---

## ✅ Checklist de validation finale

- [ ] Table `institutions` créée dans Supabase
- [ ] Données importées (vérifier le compte)
- [ ] Recherche globale (Ctrl+K) fonctionne
- [ ] Liste publique affiche toutes les institutions
- [ ] Page détails affiche correctement (avec carte)
- [ ] Admin : Liste institutions fonctionne
- [ ] Admin : Détails institution fonctionnent
- [ ] CRUD complet testé (Create, Read, Update, Delete)
- [ ] Carte avec filtres fonctionne
- [ ] Aucune erreur dans la console navigateur
- [ ] Aucune erreur dans la console Node.js

---

## 🎉 Migration réussie !

Si tous les tests passent, la migration est **complète et fonctionnelle** !

### Prochaines étapes recommandées

1. **Surveiller les performances** pendant quelques jours
2. **Backup Supabase** : Configure des backups automatiques
3. **Migrer Places** : Prochaine table logique (fichiers PDF liés aux institutions)
4. **Migrer Posts** : Pour améliorer la recherche globale
5. **Supprimer le code Firebase** : Une fois tout stable, nettoyer les anciens listeners

### Support

En cas de problème :
1. Vérifie les logs Supabase : Dashboard → Logs
2. Vérifie la console navigateur (F12)
3. Vérifie les politiques RLS : Supabase → Authentication → Policies
4. Consulte la doc Supabase : https://supabase.com/docs

---

## 📚 Documentation de référence

- `MIGRATION_INSTITUTIONS_STATUS.md` : État détaillé de la migration
- `supabase_migrations/20251028_create_institutions.sql` : Schéma SQL complet
- `backend/supabase/importInstitutions.js` : Script d'import
- `src/stores/institutionsStore.js` : Store Pinia avec API Supabase

---

**Bonne migration ! 🚀**
