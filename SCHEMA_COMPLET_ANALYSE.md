# 📊 Analyse du Schéma Supabase PFPHEDS

**Date:** 28.11.2025 09:37:45

## 🗄️ Tables Analysées

5 tables trouvées avec données:

- `user_profiles`
- `gamification_data`
- `houses`
- `badges`
- `challenges`

## 🔗 Relations Détectées

3 relations identifiées:

1. ⚠️ `user_profiles.house_id` → `houses.id`
2. ✅ `gamification_data.user_id` → `user_profiles.user_id`
3. ✅ `gamification_data.house_id` → `houses.id`

## 📋 Structure des Tables

### `user_profiles`

20 colonnes:

| Colonne | Type |
|---------|------|
| `user_id` | string |
| `avatar_url` | object |
| `updated_at` | string |
| `house_id` | object |
| `last_login` | object |
| `login_streak` | number |
| `created_at` | string |
| `email` | string |
| `forname` | string |
| `family_name` | string |
| `display_name` | string |
| `bio` | object |
| `is_active` | boolean |
| `is_verified` | boolean |
| `role` | string |
| `phone` | object |
| `city` | object |
| `permissions` | object |
| `preferences` | object |
| `firebase_id` | string |

### `gamification_data`

10 colonnes:

| Colonne | Type |
|---------|------|
| `id` | string |
| `user_id` | string |
| `email` | string |
| `total_xp` | number |
| `current_level` | number |
| `house_id` | string |
| `house_points` | number |
| `gamification_metadata` | object |
| `created_at` | string |
| `updated_at` | string |

### `houses`

10 colonnes:

| Colonne | Type |
|---------|------|
| `id` | string |
| `name` | string |
| `motto` | string |
| `color` | string |
| `description` | string |
| `total_xp` | number |
| `member_count` | number |
| `created_at` | string |
| `updated_at` | string |
| `level` | number |

### `badges`

9 colonnes:

| Colonne | Type |
|---------|------|
| `id` | string |
| `name` | string |
| `description` | string |
| `icon` | string |
| `rarity` | string |
| `xp_bonus` | number |
| `conditions` | object |
| `is_active` | boolean |
| `created_at` | string |

### `challenges`

13 colonnes:

| Colonne | Type |
|---------|------|
| `id` | string |
| `name` | string |
| `description` | string |
| `target_value` | number |
| `action_type` | string |
| `xp_reward` | number |
| `badge_reward` | object |
| `week_number` | number |
| `year` | number |
| `start_date` | string |
| `end_date` | string |
| `is_active` | boolean |
| `created_at` | string |


## 📐 Diagramme ERD

```mermaid
erDiagram
    user_profiles {
        string user_id
        object avatar_url
        string updated_at
        object house_id
        object last_login
        number login_streak
        string created_at
        string email
        ... 12 more
    }
    gamification_data {
        string id
        string user_id
        string email
        number total_xp
        number current_level
        string house_id
        number house_points
        object gamification_metadata
        ... 2 more
    }
    houses {
        string id
        string name
        string motto
        string color
        string description
        number total_xp
        number member_count
        string created_at
        ... 2 more
    }
    badges {
        string id
        string name
        string description
        string icon
        string rarity
        number xp_bonus
        object conditions
        boolean is_active
        ... 1 more
    }
    challenges {
        string id
        string name
        string description
        number target_value
        string action_type
        number xp_reward
        object badge_reward
        number week_number
        ... 5 more
    }

    user_profiles ||--o{ houses : "house_id"
    gamification_data ||--o{ user_profiles : "user_id"
    gamification_data ||--o{ houses : "house_id"
```
