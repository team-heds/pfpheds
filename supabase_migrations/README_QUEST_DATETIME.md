# Migration: Dates et Heures pour les Quêtes

## 📅 Description
Cette migration ajoute les champs de date/heure de début et fin pour les quêtes avec le fuseau horaire de Berne (Europe/Zurich).

## 🎯 Fonctionnalités ajoutées

### Nouveaux champs dans la table `quests`:
- **start_date** (TIMESTAMPTZ) : Date et heure de début de la quête
- **end_date** (TIMESTAMPTZ) : Date et heure de fin de la quête

### Fonctionnalités automatiques:
- ✅ Vérification que `end_date >= start_date`
- ✅ Index pour optimiser les requêtes par date
- ✅ Trigger d'expiration automatique des quêtes
- ✅ Fuseau horaire configuré sur Europe/Zurich (Berne)

## 🚀 Application de la migration

### Option 1: Via Supabase Dashboard (Recommandé)
1. Connectez-vous à votre dashboard Supabase
2. Allez dans **SQL Editor**
3. Créez une nouvelle query
4. Copiez-collez le contenu de `add_quest_datetime_fields.sql`
5. Exécutez le script
6. Vérifiez les messages de succès

### Option 2: Via Supabase CLI
```bash
# Se connecter à votre projet
supabase link --project-ref YOUR_PROJECT_REF

# Appliquer la migration
supabase db push

# Ou exécuter directement le fichier SQL
psql "$DATABASE_URL" < supabase_migrations/add_quest_datetime_fields.sql
```

### Option 3: Via psql directement
```bash
psql YOUR_DATABASE_URL -f supabase_migrations/add_quest_datetime_fields.sql
```

## 📊 Structure des données

### Exemple de quête avec dates:
```json
{
  "id": "quest_123",
  "title": "Explorer la bibliothèque",
  "description": "Découvrez tous les secrets",
  "start_date": "2025-10-08T09:00:00+02:00",
  "end_date": "2025-10-15T18:00:00+02:00",
  "status": "active",
  "difficulty": "medium",
  ...
}
```

### Format des dates dans l'application:
- **Affichage**: Format français `dd/mm/yyyy HH:mm`
- **Stockage**: Format ISO 8601 avec timezone `YYYY-MM-DDTHH:mm:ss+TZ`
- **Fuseau horaire**: Europe/Zurich (GMT+1/GMT+2 selon DST)

## 🔍 Vérification après migration

### Vérifier que les colonnes ont été ajoutées:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quests' 
AND column_name IN ('start_date', 'end_date');
```

### Vérifier les index:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'quests' 
AND indexname LIKE 'idx_quests_%date%';
```

### Tester le trigger d'expiration:
```sql
-- Créer une quête de test expirée
INSERT INTO quests (title, description, status, end_date)
VALUES ('Test Expired', 'Test', 'active', NOW() - INTERVAL '1 day');

-- Vérifier que le statut passe à 'expired'
SELECT id, title, status, end_date 
FROM quests 
WHERE title = 'Test Expired';
```

## 🎨 Interface utilisateur

### Composant utilisé:
- **PrimeVue Calendar** avec `showTime` et `hourFormat="24"`
- Configuration automatique du fuseau horaire de Berne
- Validation: la date de fin doit être >= date de début
- Affichage de la durée calculée entre les dates

### Exemple de formulaire:
```vue
<Calendar 
  v-model="questForm.startDate" 
  showTime
  hourFormat="24"
  dateFormat="dd/mm/yy"
  placeholder="Date et heure de début"
/>
```

## ⚠️ Notes importantes

1. **Fuseau horaire**: Toutes les dates sont stockées en UTC mais converties en Europe/Zurich pour l'affichage
2. **Optionnel**: Les champs start_date et end_date sont optionnels (peuvent être NULL)
3. **Expiration automatique**: Un trigger vérifie automatiquement l'expiration
4. **Performance**: Index créés pour optimiser les requêtes par date

## 🔄 Rollback (si nécessaire)

Si vous devez annuler cette migration:
```sql
-- Supprimer le trigger
DROP TRIGGER IF EXISTS trigger_check_quest_expiration ON quests;
DROP FUNCTION IF EXISTS check_quest_expiration();

-- Supprimer les index
DROP INDEX IF EXISTS idx_quests_start_date;
DROP INDEX IF EXISTS idx_quests_end_date;
DROP INDEX IF EXISTS idx_quests_active_period;

-- Supprimer la contrainte
ALTER TABLE quests DROP CONSTRAINT IF EXISTS check_quest_dates;

-- Supprimer les colonnes
ALTER TABLE quests DROP COLUMN IF EXISTS start_date;
ALTER TABLE quests DROP COLUMN IF EXISTS end_date;
```

## 📝 Changelog

- **2025-10-08**: Création initiale de la migration
  - Ajout des champs start_date et end_date
  - Configuration du fuseau horaire Europe/Zurich
  - Création des index et triggers
  - Intégration dans le formulaire de création de quêtes
