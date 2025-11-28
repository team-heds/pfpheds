# Architecture du Système de Votation

## 📋 Vue d'ensemble

Ce document décrit l'architecture complète du système de votation des places de formation pratique (PFP).

## 🏗️ Architecture

### Backend (PostgreSQL/Supabase)

#### 1. Table `student_votes`
**Fichier:** `backend/supabase/migrations/0002_create_student_votes_table.sql`

```sql
CREATE TABLE public.student_votes (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  pfp_type text CHECK (pfp_type IN ('PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4')),
  year text CHECK (year ~ '^\d{4}$'),
  choices jsonb NOT NULL,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE (user_id, pfp_type, year)
);
```

**Caractéristiques:**
- ✅ Row Level Security (RLS) activé
- ✅ Trigger auto-update de `updated_at`
- ✅ Contrainte unique: 1 vote par étudiant/PFP/année
- ✅ Index pour performances

#### 2. Fonctions Backend RPC
**Fichier:** `backend/supabase/migrations/0003_student_votes_functions.sql`

**Fonctions disponibles:**
- `get_student_vote(user_id, pfp_type, year)` - Récupérer un vote
- `upsert_student_vote(user_id, pfp_type, year, choices)` - Enregistrer/modifier
- `delete_student_vote(user_id, pfp_type, year)` - Supprimer
- `has_student_voted(user_id, pfp_type, year)` - Vérifier l'existence
- `get_all_student_votes(user_id)` - Tous les votes d'un étudiant
- `count_votes(pfp_type, year)` - Compter les votes
- `get_top_voted_places(pfp_type, year, rank, limit)` - Top des places

**Vues:**
- `vote_statistics` - Statistiques générales
- `vote_place_aggregation` - Agrégation par place

### Frontend (Vue.js + Pinia)

#### 1. Store Pinia: `votesStore`
**Fichier:** `src/stores/votesStore.js`

**State:**
```javascript
{
  votes: [],           // Tous les votes de l'utilisateur
  currentVote: null,   // Vote en cours de visualisation
  loading: false,
  error: null,
  useBackendFunctions: false  // Toggle RPC vs Direct
}
```

**Actions principales:**
- `fetchUserVotes()` - Récupérer tous les votes
- `fetchVote(pfpType, year)` - Récupérer un vote spécifique
- `saveVote(pfpType, year, choices, useRPC)` - Enregistrer/modifier
- `deleteVote(pfpType, year)` - Supprimer

**Getters:**
- `getVoteByTypeAndYear(pfpType, year)` - Accès rapide à un vote
- `hasVoted(pfpType, year)` - Vérification rapide

#### 2. Service Backend: `votesBackendService`
**Fichier:** `src/stores/votesBackendService.js`

Wrapper JavaScript pour les fonctions RPC backend. Fournit une interface propre pour appeler les fonctions PostgreSQL.

**Méthodes:**
- `getStudentVote(userId, pfpType, year)`
- `upsertStudentVote(userId, pfpType, year, choices)`
- `deleteStudentVote(userId, pfpType, year)`
- `hasStudentVoted(userId, pfpType, year)`
- `getAllStudentVotes(userId)`
- `countVotes(pfpType, year)`
- `getTopVotedPlaces(pfpType, year, rank, limit)`
- `getVoteStatistics()`
- `getVotePlaceAggregation(pfpType, year)`

## 🚀 Installation

### 1. Exécuter les migrations

Dans **Supabase Dashboard → SQL Editor**, exécutez dans l'ordre :

```bash
# 1. Créer la table
backend/supabase/migrations/0002_create_student_votes_table.sql

# 2. Créer les fonctions backend
backend/supabase/migrations/0003_student_votes_functions.sql
```

### 2. Vérifier l'installation

```sql
-- Vérifier la table
SELECT * FROM pg_tables WHERE tablename = 'student_votes';

-- Vérifier les fonctions
SELECT proname FROM pg_proc WHERE proname LIKE '%student_vote%';

-- Vérifier les vues
SELECT viewname FROM pg_views WHERE viewname LIKE 'vote%';
```

## 💻 Utilisation

### Dans un composant Vue

```vue
<script>
import { useVotesStore } from '@/stores/votesStore'

export default {
  setup() {
    const votesStore = useVotesStore()
    return { votesStore }
  },
  
  methods: {
    async submitVote() {
      const choices = [
        { rank: 1, placeId: 'abc', placeName: 'Place A', ... },
        { rank: 2, placeId: 'def', placeName: 'Place B', ... }
      ]
      
      // Méthode 1: Direct (par défaut)
      await this.votesStore.saveVote('PFP1A', '2026', choices)
      
      // Méthode 2: Via RPC backend (plus sécurisé)
      await this.votesStore.saveVote('PFP1A', '2026', choices, true)
    },
    
    async checkVote() {
      const vote = await this.votesStore.fetchVote('PFP1A', '2026')
      if (vote) {
        console.log('Vote existant:', vote.choices)
      }
    }
  }
}
</script>
```

### Utilisation directe du service backend

```javascript
import votesBackendService from '@/stores/votesBackendService'

// Récupérer le top 10 des premiers choix
const topPlaces = await votesBackendService.getTopVotedPlaces(
  'PFP1A',  // Type
  '2026',   // Année
  1,        // Rang (1 = premier choix)
  10        // Limite
)

// Obtenir les statistiques
const stats = await votesBackendService.getVoteStatistics()
console.log('Nombre de votants par PFP:', stats)
```

## 🔒 Sécurité

### Row Level Security (RLS)

Les policies garantissent que:
- ✅ Un étudiant ne peut voir que **ses propres votes**
- ✅ Un étudiant ne peut créer/modifier que **ses propres votes**
- ✅ Les fonctions RPC vérifient `auth.uid() = user_id`

### Validation côté serveur

Les fonctions RPC backend incluent:
- ✅ Vérification d'authentification
- ✅ Validation du format des données
- ✅ Checks de contraintes métier

## 📊 Exemples de requêtes avancées

### Récupérer les résultats d'une votation

```javascript
// Agrégation complète pour PFP1A 2026
const results = await votesBackendService.getVotePlaceAggregation('PFP1A', '2026')

// Top 5 des premiers choix
const top5First = await votesBackendService.getTopVotedPlaces('PFP1A', '2026', 1, 5)

// Top 5 des deuxièmes choix
const top5Second = await votesBackendService.getTopVotedPlaces('PFP1A', '2026', 2, 5)
```

### Statistiques en temps réel

```javascript
// Nombre total de votes
const count = await votesBackendService.countVotes('PFP1A', '2026')
console.log(`${count} étudiants ont voté`)

// Stats générales
const stats = await votesBackendService.getVoteStatistics()
// => [{ pfp_type: 'PFP1A', year: '2026', total_voters: 42, ... }]
```

## 🎯 Choix d'architecture: Direct vs RPC

### Mode Direct (`useBackendFunctions: false`)
✅ Plus simple  
✅ Moins de latence  
❌ Validation côté client uniquement  

### Mode RPC (`useBackendFunctions: true`)
✅ Validation serveur  
✅ Plus sécurisé  
✅ Logique métier centralisée  
❌ Latence légèrement supérieure  

**Recommandation:** Utiliser RPC pour la production, Direct pour le développement.

## 🐛 Debugging

### Activer les logs détaillés

Le store affiche automatiquement des logs émojis:
- 💾 Début d'enregistrement
- ✅ Succès
- ❌ Erreur
- 🔧 Utilisation RPC
- 🔄 Mise à jour
- ➕ Création

### Tester manuellement dans la console

```javascript
// Dans la console du navigateur
const votesStore = window.$pinia.state.value.votes
await votesStore.saveVote('PFP1A', '2026', [{rank: 1, placeId: 'test'}])
```

## 📝 Structure des données `choices`

```javascript
choices: [
  {
    rank: 1,              // Position du choix (1-5)
    placeId: "abc-123",   // ID Firebase de la place
    seatIndex: 1,         // Index du siège
    placeName: "Place A", // Nom lisible
    InstitutionName: "Institution X"
  },
  // ... jusqu'à 5 choix
]
```

## 🔄 Mise à jour future

Pour ajouter de nouvelles fonctionnalités:

1. **Backend:** Créer une nouvelle migration SQL dans `backend/supabase/migrations/`
2. **Service:** Ajouter la méthode dans `votesBackendService.js`
3. **Store:** Ajouter l'action dans `votesStore.js`
4. **Composant:** Utiliser via `this.votesStore.maNouvelleFonction()`

## 📚 Ressources

- [Documentation Supabase RPC](https://supabase.com/docs/guides/database/functions)
- [Pinia Stores](https://pinia.vuejs.org/)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
