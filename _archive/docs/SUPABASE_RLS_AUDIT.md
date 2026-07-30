# Audit Supabase Row Level Security (RLS)

> Date : 2025-02-11
> Auteur : Audit automatisé via analyse du code source

## Résumé

Ce document recense toutes les tables Supabase utilisées par l'application PFP HEdS et fournit des recommandations RLS pour chacune.

**41 tables identifiées** dans le code source.

---

## Légende

| Priorité | Description |
|----------|-------------|
| 🔴 CRITIQUE | Données sensibles, RLS obligatoire |
| 🟠 HAUTE | Données métier importantes |
| 🟡 MOYENNE | Données semi-publiques |
| 🟢 BASSE | Données publiques / lecture seule |

---

## 1. Tables d'authentification et rôles

### `user_profiles` 🔴
- **Données** : email, forname, family_name, display_name, role, avatar_url, house_id
- **Opérations** : SELECT, UPDATE, INSERT
- **RLS recommandé** :
  - `SELECT` : Authentifié → peut lire tous les profils (annuaire)
  - `UPDATE` : `auth.uid() = user_id` (chacun modifie son propre profil)
  - `INSERT` : Uniquement via trigger `on_auth_user_created`
  - `DELETE` : Interdit (soft delete via flag)

### `user_roles` 🔴
- **Données** : user_id, role_name, is_active
- **Opérations** : SELECT, INSERT, UPDATE
- **RLS recommandé** :
  - `SELECT` : Authentifié
  - `INSERT/UPDATE/DELETE` : Uniquement rôle ADMIN (`auth.jwt() ->> 'role' = 'admin'`)

### `user_track_roles` 🔴
- **Données** : user_id, track_id, role, is_active, assigned_by
- **Opérations** : SELECT, INSERT, UPDATE
- **RLS recommandé** :
  - `SELECT` : Authentifié
  - `INSERT/UPDATE` : Uniquement ADMIN ou RM du track concerné
  - Vérifier que `assigned_by` correspond à `auth.uid()`

### `roles` 🟡
- **Données** : Définitions de rôles
- **RLS recommandé** : `SELECT` pour tous les authentifiés, écriture ADMIN uniquement

### `permissions` 🟡
- **Données** : Définitions de permissions
- **RLS recommandé** : `SELECT` pour tous les authentifiés, écriture ADMIN uniquement

---

## 2. Tables académiques

### `modules` 🟠
- **Données** : code, title, track_id, responsable_email, year, credits
- **Opérations** : SELECT, UPDATE
- **RLS recommandé** :
  - `SELECT` : Authentifié
  - `UPDATE` : ADMIN ou RM du module (`responsable_email = auth.jwt() ->> 'email'`)

### `courses` 🟠
- **Données** : Cours liés aux modules
- **RLS recommandé** :
  - `SELECT` : Authentifié
  - `INSERT/UPDATE/DELETE` : ADMIN ou enseignant assigné

### `course_teachers` 🟠
- **Données** : Assignation enseignants-cours
- **RLS recommandé** :
  - `SELECT` : Authentifié
  - `INSERT/UPDATE/DELETE` : ADMIN uniquement

### `classes` 🟡
- **Données** : Définitions de classes
- **RLS recommandé** : `SELECT` authentifié, écriture ADMIN

### `tracks` 🟢
- **Données** : Filières (SI, PHY)
- **RLS recommandé** : `SELECT` public, écriture ADMIN

### `academic_years` 🟡
- **Données** : Années académiques
- **RLS recommandé** : `SELECT` authentifié, écriture ADMIN

### `academic_tickets` 🟠
- **Données** : Tickets académiques
- **RLS recommandé** :
  - `SELECT` : Propriétaire ou ADMIN
  - `INSERT` : Authentifié (`auth.uid() = user_id`)
  - `UPDATE` : Propriétaire ou ADMIN

---

## 3. Tables de planification

### `planning_cells` 🟠
- **Données** : Cellules de planning
- **RLS recommandé** :
  - `SELECT` : Authentifié (planning visible par tous)
  - `INSERT/UPDATE/DELETE` : ADMIN ou RM

### `planning_time_slots` 🟠
- **Données** : Créneaux horaires
- **RLS recommandé** : Idem `planning_cells`

---

## 4. Tables de formation pratique (PFP)

### `places` 🟠
- **Données** : Places de stage
- **RLS recommandé** :
  - `SELECT` : Authentifié
  - `INSERT/UPDATE/DELETE` : ADMIN ou SECRETARIAT

### `institutions` 🟠
- **Données** : Institutions partenaires
- **RLS recommandé** :
  - `SELECT` : Authentifié
  - `INSERT/UPDATE/DELETE` : ADMIN

### `praticiens_formateurs` 🟠
- **Données** : Praticiens formateurs
- **RLS recommandé** :
  - `SELECT` : Authentifié
  - `INSERT/UPDATE/DELETE` : ADMIN ou SECRETARIAT

### `StudentsPhysio` 🔴
- **Données** : Étudiants physiothérapie avec données personnelles
- **RLS recommandé** :
  - `SELECT` : ADMIN, SECRETARIAT, ou `auth.uid() = user_id`
  - `UPDATE` : ADMIN ou propriétaire
  - `DELETE` : ADMIN uniquement

### `RepondantPhysioHES` 🟠
- **Données** : Répondants HES physiothérapie
- **RLS recommandé** :
  - `SELECT` : Authentifié
  - `INSERT/UPDATE/DELETE` : ADMIN

### `alpinphysio_members` 🟡
- **Données** : Membres AlpinPhysio
- **RLS recommandé** : `SELECT` authentifié, écriture ADMIN

---

## 5. Tables de votes et résultats

### `student_votes` 🔴
- **Données** : Votes des étudiants (choix de places)
- **RLS recommandé** :
  - `SELECT` : Propriétaire (`auth.uid() = user_id`) ou ADMIN
  - `INSERT` : `auth.uid() = user_id`
  - `UPDATE` : `auth.uid() = user_id` (avant deadline)
  - `DELETE` : Interdit

### `student_result_vote` 🟠
- **Données** : Résultats des votes
- **RLS recommandé** :
  - `SELECT` : Propriétaire ou ADMIN
  - `INSERT/UPDATE` : ADMIN uniquement (résultat calculé)

### `vote_place_aggregation` 🟡 (vue)
- **Données** : Agrégation des votes par place
- **RLS recommandé** : `SELECT` ADMIN uniquement

### `vote_statistics` 🟡 (vue)
- **Données** : Statistiques de votes
- **RLS recommandé** : `SELECT` ADMIN uniquement

---

## 6. Tables de gamification

### `gamification_data` 🟡
- **Données** : Points, niveaux, achievements
- **RLS recommandé** :
  - `SELECT` : Authentifié (classement visible)
  - `UPDATE` : Système uniquement (via service role)

### `houses` 🟢
- **Données** : Maisons (gamification)
- **RLS recommandé** : `SELECT` public, écriture ADMIN

### `quests` 🟡
- **Données** : Quêtes disponibles
- **RLS recommandé** :
  - `SELECT` : Authentifié
  - `INSERT/UPDATE/DELETE` : ADMIN ou GAME_MASTER

### `quest_steps` 🟡
- **Données** : Étapes de quêtes
- **RLS recommandé** : Idem `quests`

### `user_quest_progress` 🟠
- **Données** : Progression des quêtes par utilisateur
- **RLS recommandé** :
  - `SELECT` : Propriétaire ou ADMIN
  - `UPDATE` : Système (via triggers)

---

## 7. Tables sociales et événements

### `events` 🟡
- **Données** : Événements
- **RLS recommandé** :
  - `SELECT` : Authentifié
  - `INSERT` : ADMIN ou organisateur
  - `UPDATE/DELETE` : Créateur ou ADMIN

### `event_registrations` 🟠
- **Données** : Inscriptions aux événements
- **RLS recommandé** :
  - `SELECT` : Propriétaire ou ADMIN
  - `INSERT/DELETE` : `auth.uid() = user_id`

### `event_likes` 🟡
- **Données** : Likes sur événements
- **RLS recommandé** :
  - `SELECT` : Authentifié
  - `INSERT/DELETE` : `auth.uid() = user_id`

### `events_with_counts` 🟢 (vue)
- **Données** : Événements avec compteurs
- **RLS recommandé** : `SELECT` authentifié

### `messages` 🔴
- **Données** : Messages de chat
- **RLS recommandé** :
  - `SELECT` : Participants de la conversation uniquement
  - `INSERT` : `auth.uid() = sender_id`
  - `DELETE` : Propriétaire du message

---

## 8. Tables média et vidéo

### `video_library` 🟡
- **Données** : Bibliothèque vidéo (métadonnées Vimeo)
- **RLS recommandé** :
  - `SELECT` : Authentifié
  - `INSERT/UPDATE/DELETE` : ADMIN

### `capsules` 🟡
- **Données** : Capsules vidéo
- **RLS recommandé** : Idem `video_library`

### `avatars` 🟢 (storage bucket)
- **Données** : Photos de profil
- **RLS recommandé** :
  - `SELECT` : Public
  - `INSERT/UPDATE` : `auth.uid() = owner`
  - `DELETE` : Propriétaire ou ADMIN

---

## 9. Tables utilitaires

### `todos` 🟠
- **Données** : Tâches utilisateur
- **RLS recommandé** :
  - `SELECT/INSERT/UPDATE/DELETE` : `auth.uid() = user_id`

### `dynamic_routes` 🟡
- **Données** : Routes dynamiques de l'application
- **RLS recommandé** : `SELECT` authentifié, écriture ADMIN

### `documentation_routes` / `active_documentation_routes` 🟢
- **Données** : Routes de documentation
- **RLS recommandé** : `SELECT` authentifié, écriture ADMIN

---

## Checklist d'implémentation

### Actions immédiates (🔴 CRITIQUE)

- [ ] Vérifier que RLS est **activé** sur toutes les tables listées
- [ ] `user_profiles` : Restreindre UPDATE à `auth.uid() = user_id`
- [ ] `user_roles` / `user_track_roles` : Restreindre écriture aux ADMIN
- [ ] `StudentsPhysio` : Restreindre SELECT aux ADMIN/SECRETARIAT ou propriétaire
- [ ] `student_votes` : Restreindre INSERT/SELECT à `auth.uid() = user_id`
- [ ] `messages` : Restreindre aux participants de la conversation

### Actions recommandées (🟠 HAUTE)

- [ ] `modules` / `courses` : Restreindre UPDATE aux RM/ADMIN
- [ ] `places` / `institutions` : Restreindre écriture ADMIN/SECRETARIAT
- [ ] `user_quest_progress` : Restreindre SELECT au propriétaire
- [ ] `event_registrations` : Restreindre au propriétaire
- [ ] `academic_tickets` : Restreindre au propriétaire ou ADMIN
- [ ] `todos` : Restreindre toutes opérations à `auth.uid() = user_id`

### Bonnes pratiques

- [ ] Utiliser `auth.uid()` dans toutes les policies RLS
- [ ] Créer une fonction `is_admin()` réutilisable dans les policies
- [ ] Ne jamais utiliser `service_role` côté client
- [ ] Auditer les vues (`events_with_counts`, `vote_statistics`) — elles héritent des RLS des tables sous-jacentes
- [ ] Tester les policies avec `supabase.auth.getUser()` dans différents contextes

### Exemple de policy SQL

```sql
-- Fonction helper réutilisable
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND role = 'ADMIN'
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Policy pour user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy pour student_votes
ALTER TABLE student_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own votes"
  ON student_votes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Students can insert own votes"
  ON student_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

---

## Vérification

Pour vérifier que RLS est activé sur toutes les tables :

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Pour lister les policies existantes :

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
