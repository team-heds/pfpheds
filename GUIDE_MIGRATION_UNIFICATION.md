# 🚀 GUIDE DE MIGRATION : Unification des données étudiants

## 📋 Contexte

Actuellement, les données étudiants sont réparties entre 2 tables :
- **`user_profiles`** : Table principale (189 étudiants) avec authentification Supabase
- **`StudentsPhysio`** : Table legacy (126 étudiants) avec données spécifiques physio

**Problèmes :**
- ❌ Seulement 12% de matching entre les tables (6/50)
- ❌ Classes incorrectes dans `user_profiles` (tous BA25 par défaut)
- ❌ Duplication et incohérences

**Objectif :** Avoir **UNE SEULE source de vérité** dans `user_profiles` avec toutes les données correctes.

---

## ⚠️ AVANT DE COMMENCER

### 1. Backup de la base de données

```bash
# Via Supabase Dashboard
# Settings → Database → Database Backups → Create Backup
```

Ou via CLI :
```bash
supabase db dump -f backup_before_migration.sql
```

### 2. Environnement de test

**RECOMMANDATION FORTE** : Tester d'abord sur un environnement de dev/staging !

---

## 🔧 ÉTAPE 1 : Préparation

### 1.1 Importer le script dans ton projet

Le script `migration-supabase-unification.js` est déjà créé. Intègre-le dans ton app :

```javascript
// Dans src/service/migrationService.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY // ⚠️ Clé SERVICE ROLE nécessaire
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Copier le contenu du script ici...
```

### 1.2 Obtenir la clé Service Role

La migration nécessite les **droits admin** pour :
- Lister tous les utilisateurs Auth
- Créer des user_profiles

```bash
# Dans Supabase Dashboard → Settings → API → Service Role Key
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

⚠️ **ATTENTION** : Ne JAMAIS commit cette clé ! Ajoute-la dans `.env.local` uniquement.

---

## 🚀 ÉTAPE 2 : Exécution de la migration

### Option A : Via la console du navigateur (RECOMMANDÉ pour test)

1. Lance ton application en dev
2. Connecte-toi en tant qu'admin
3. Ouvre la console (F12)
4. Exécute :

```javascript
// 1. D'abord analyser la situation
await window.analyzeCurrentState()

// 2. Si tout est OK, lancer la migration complète
await window.runMigration()
```

### Option B : Via une page admin dédiée

Crée une page `/admin/migration` avec un bouton :

```vue
<template>
  <div class="migration-page">
    <h1>🔄 Migration Unification Données</h1>
    
    <Card>
      <template #title>Analyse de la situation</template>
      <template #content>
        <div v-if="analysis">
          <p>👥 Utilisateurs Auth: {{ analysis.authUsers }}</p>
          <p>📋 user_profiles: {{ analysis.profilesCount }}</p>
          <p>🏥 StudentsPhysio: {{ analysis.physioCount }}</p>
          <p>❌ Classes incorrectes: {{ analysis.incorrectCount }}</p>
        </div>
        <Button @click="analyze" label="Analyser" icon="pi pi-search" />
      </template>
    </Card>
    
    <Card class="mt-4">
      <template #title>Migration</template>
      <template #content>
        <Message severity="warn">
          ⚠️ Cette opération va modifier la base de données. 
          Assurez-vous d'avoir un backup !
        </Message>
        
        <Button 
          @click="runMigration" 
          label="Lancer la migration" 
          icon="pi pi-play"
          :loading="migrating"
          :disabled="!analysis"
          severity="danger"
          class="mt-3"
        />
        
        <div v-if="result" class="mt-4">
          <Message :severity="result.success ? 'success' : 'error'">
            {{ result.message }}
          </Message>
          
          <div v-if="result.success" class="stats mt-3">
            <p>✅ {{ result.updated }} profils mis à jour</p>
            <p>✅ {{ result.created }} profils créés</p>
            <p>⏱️ Durée: {{ result.duration }}s</p>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { analyzeCurrentState, runMigration as executeMigration } from '@/service/migrationService'

const analysis = ref(null)
const migrating = ref(false)
const result = ref(null)

async function analyze() {
  analysis.value = await analyzeCurrentState()
}

async function runMigration() {
  if (!confirm('Êtes-vous sûr de vouloir lancer la migration ?')) return
  
  migrating.value = true
  try {
    const migrationResult = await executeMigration()
    result.value = {
      success: migrationResult.success,
      message: migrationResult.success 
        ? '🎉 Migration réussie !' 
        : '❌ Erreur pendant la migration',
      updated: migrationResult.updateResult?.updatedCount || 0,
      created: migrationResult.createResult?.createdCount || 0,
      duration: migrationResult.duration
    }
  } catch (error) {
    result.value = {
      success: false,
      message: error.message
    }
  } finally {
    migrating.value = false
  }
}
</script>
```

---

## ✅ ÉTAPE 3 : Validation

### 3.1 Vérifier les stats

```javascript
// Dans la console
const { data: stats } = await supabase
  .from('user_profiles')
  .select('classe, role')
  .eq('role', 'student')

console.table(
  stats.reduce((acc, s) => {
    acc[s.classe] = (acc[s.classe] || 0) + 1
    return acc
  }, {})
)
```

Tu devrais voir :
```
┌─────────┬───────┐
│ Classe  │ Count │
├─────────┼───────┤
│ BA23    │  61   │
│ BA24    │  65   │
│ BA25    │ 189   │
└─────────┴───────┘
```

### 3.2 Tester l'application

1. Va sur `/etudiant_list`
2. Vérifie que tu vois **315 étudiants** (189 + 126)
3. Vérifie que les classes sont correctes (BA23, BA24, BA25)
4. Filtre par classe et vérifie les nombres

---

## 🔧 ÉTAPE 4 : Simplifier le code

### Avant (code actuel complexe)

```javascript
// 2 requêtes, 2 mappings, 1 fusion complexe
export async function getAllStudents() {
  const { data: userProfiles } = await supabase.from('user_profiles').select('*')
  const { data: studentsPhysio } = await supabase.from('StudentsPhysio').select('*')
  
  // 50+ lignes de mapping et fusion...
  
  return merged
}
```

### Après (code simplifié)

```javascript
// 1 seule requête, retour direct !
export async function getAllStudents() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('role', 'student')
    .order('family_name')
  
  if (error) throw error
  
  return data.map(user => ({
    id: user.user_id,
    Nom: user.family_name,
    Prenom: user.forname,
    Mail: user.email,
    Classe: user.classe,  // ✅ Classe correcte depuis user_profiles
    SAE: user.sae,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    house_id: user.house_id,
    created_at: user.created_at
  }))
}
```

**Bénéfices :**
- ✅ **90% de code en moins**
- ✅ **2x plus rapide** (1 requête au lieu de 2)
- ✅ **Plus de bugs de mapping**

---

## 📊 ÉTAPE 5 : Archiver StudentsPhysio

Une fois la migration validée et stable en production :

```sql
-- Renommer la table en archive
ALTER TABLE "StudentsPhysio" 
RENAME TO "StudentsPhysio_archive";

-- Ajouter un commentaire
COMMENT ON TABLE "StudentsPhysio_archive" IS 
  'Archive - Données migrées vers user_profiles le 2025-11-28. Ne plus utiliser.';

-- Retirer les permissions (lecture seule)
REVOKE INSERT, UPDATE, DELETE ON "StudentsPhysio_archive" FROM authenticated;
GRANT SELECT ON "StudentsPhysio_archive" TO authenticated;
```

⚠️ **Ne PAS supprimer** immédiatement, garder en archive au cas où.

---

## 🔄 ROLLBACK (si problème)

Si tu rencontres un problème pendant la migration :

### Option 1 : Restaurer le backup

```bash
supabase db reset --db-url "postgresql://..."
psql -f backup_before_migration.sql
```

### Option 2 : Rollback manuel

```sql
-- Supprimer les profils créés pendant la migration
DELETE FROM user_profiles 
WHERE metadata->>'created_from_migration' = 'true';

-- Restaurer les anciennes valeurs de classe
-- (Si tu as gardé un backup des anciennes valeurs)
```

---

## 📝 CHECKLIST FINALE

Avant de déployer en production :

- [ ] ✅ Backup créé et vérifié
- [ ] ✅ Migration testée en dev/staging
- [ ] ✅ Stats validées (315 étudiants, classes correctes)
- [ ] ✅ Application testée (liste étudiants, dashboards)
- [ ] ✅ Code simplifié déployé
- [ ] ✅ Documentation mise à jour
- [ ] ✅ Équipe informée du changement

---

## 🆘 TROUBLESHOOTING

### Problème : "Permission denied"

**Cause** : Clé Service Role manquante ou incorrecte

**Solution** :
```javascript
// Vérifier que tu utilises la SERVICE ROLE KEY
const supabase = createClient(url, serviceRoleKey) // Pas l'anon key !
```

### Problème : "user_id already exists"

**Cause** : Tentative de créer un profil qui existe déjà

**Solution** : Le script gère normalement ce cas. Vérifie les logs.

### Problème : "null value in column classe"

**Cause** : Classe manquante dans StudentsPhysio

**Solution** : Ajouter une valeur par défaut
```javascript
classe: student.class || 'BA25' // Fallback
```

---

## 📞 SUPPORT

Si tu rencontres un problème :

1. Vérifie les logs de la console
2. Vérifie les logs Supabase (Dashboard → Logs)
3. Contacte l'équipe avec le message d'erreur exact

---

## 🎯 RÉSULTAT ATTENDU

Après la migration :

```
AVANT                          APRÈS
─────────────────────────────────────────────────
189 étudiants (user_profiles)  315 étudiants
126 étudiants (StudentsPhysio)  
                               ↓
Tous BA25 (incorrect)          BA23: 61 ✅
                               BA24: 65 ✅
                               BA25: 189 ✅
                               
2 tables                       1 table
2 requêtes                     1 requête
Code complexe (200+ lignes)    Code simple (20 lignes)
```

---

**Durée estimée de la migration complète : 15-30 minutes**

Bonne migration ! 🚀
