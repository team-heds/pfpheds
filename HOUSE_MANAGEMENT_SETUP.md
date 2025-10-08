# 🏠 Configuration du Système de Gestion des Maisons HES

## 📋 Étapes d'installation

### 1. Exécuter les migrations SQL dans Supabase

Dans l'ordre suivant :

#### a) Ajouter le système de rôles
```bash
# Fichier: supabase_migrations/add_role_to_profiles.sql
```
Cette migration ajoute :
- Colonne `role` dans la table `profiles`
- Enum des rôles : `student`, `house_coach`, `game_master`, `teacher`, `admin`
- Fonctions utilitaires pour promouvoir des utilisateurs

#### b) Créer la table d'historique des points
```bash
# Fichier: supabase_migrations/create_house_points_history.sql
```
Cette migration crée :
- Table `house_points_history` pour l'historique
- Index pour optimiser les requêtes
- Politiques RLS pour la sécurité
- Données de test

### 2. Promouvoir des utilisateurs aux rôles appropriés

Dans Supabase SQL Editor, exécutez :

```sql
-- Promouvoir un admin
SELECT promote_user_to_admin('votre.email@hevs.ch');

-- Assigner un coach de maison
SELECT assign_house_coach('coach.email@hevs.ch', 'harmonis');

-- Assigner un maître du jeu
SELECT assign_game_master('master.email@hevs.ch');
```

## 🎮 Rôles et Permissions

### 🔴 **Admin**
- Accès complet à toutes les fonctionnalités
- Peut attribuer/retirer des points à toutes les maisons
- Peut modifier et supprimer l'historique
- Peut gérer tous les utilisateurs

### 🎯 **Game Master (Maître du Jeu)**
- Peut attribuer/retirer des points à toutes les maisons
- Peut voir toutes les statistiques
- Ne peut pas modifier l'historique existant

### 🏆 **House Coach (Coach de Maison)**
- Peut attribuer/retirer des points à toutes les maisons
- Peut voir toutes les statistiques
- Ne peut pas modifier l'historique existant
- Typiquement assigné à une maison spécifique

### 📚 **Teacher (Enseignant)**
- Peut voir les statistiques
- Peut voir l'historique des points
- Ne peut pas attribuer de points

### 👤 **Student (Étudiant)**
- Peut voir les statistiques publiques
- Peut voir le classement des maisons
- Ne peut pas attribuer de points

## 🏠 Les Maisons HES

### Harmonis (Vert - #2E8B57)
- Valeurs : Empathie, Collaboration, Soin
- Coach par défaut : À définir

### Elaris (Rouge - #DC143C)
- Valeurs : Courage, Leadership, Action
- Coach par défaut : À définir

### Doloris (Or - #FFD700)
- Valeurs : Persévérance, Excellence, Dépassement
- Coach par défaut : À définir

### Solencia (Bleu - #4169E1)
- Valeurs : Sagesse, Innovation, Recherche
- Coach par défaut : À définir

## 📊 Fonctionnalités de la Page d'Administration

### Classement en Temps Réel
- Points totaux par maison
- Nombre de membres
- Défis complétés
- Quêtes complétées
- Barre de progression par rapport au leader

### Attribution de Points
- Interface modale intuitive
- Sélection de la maison
- Points positifs (récompense) ou négatifs (pénalité)
- Raison obligatoire pour la traçabilité
- Historique automatique

### Historique des Points
- Liste chronologique de toutes les attributions
- Filtres par maison
- Filtres par date
- Affichage de l'auteur de chaque attribution
- Design coloré selon la maison

## 🔒 Sécurité

- **RLS activé** sur `house_points_history`
- **Politiques strictes** basées sur les rôles
- **Audit trail** automatique (created_by, created_at)
- **Validation** des données côté backend

## 🚀 Accès à la Page

### URL
```
/admin/gamification/houses
```

### Permissions requises
- Route protégée par le router
- Nécessite le rôle : `admin`, `game_master`, ou `house_coach`

## 📝 Exemples d'Utilisation

### Attribuer des Points

1. Cliquer sur "Attribuer Points"
2. Sélectionner la maison
3. Entrer le nombre de points (ex: +50 ou -20)
4. Indiquer la raison (ex: "Victoire au défi Innovation")
5. Valider

### Voir les Membres d'une Maison

1. Cliquer sur l'icône "Voir membres" 👥
2. Liste des étudiants de la maison
3. Statistiques individuelles

### Filtrer l'Historique

1. Sélectionner une maison dans le dropdown
2. Ou sélectionner une période avec le calendrier
3. L'historique se met à jour automatiquement

## 🛠️ Maintenance

### Sauvegarde des Données
```sql
-- Exporter l'historique des points
COPY (SELECT * FROM house_points_history ORDER BY created_at DESC) 
TO '/path/to/backup.csv' WITH CSV HEADER;
```

### Réinitialiser les Points (avec prudence !)
```sql
-- ⚠️ ATTENTION : Ceci supprime TOUT l'historique
-- À n'utiliser que pour un reset complet
DELETE FROM house_points_history;
```

### Calculer les Totaux Manuellement
```sql
-- Total des points par maison
SELECT 
  house,
  SUM(points) as total_points,
  COUNT(*) as total_entries
FROM house_points_history
GROUP BY house
ORDER BY total_points DESC;
```

## 🐛 Dépannage

### Erreur "Permission denied"
- Vérifier que l'utilisateur a le bon rôle dans `profiles`
- Vérifier que les politiques RLS sont actives

### Les statistiques ne se chargent pas
- Vérifier la connexion Supabase
- Vérifier que les tables existent
- Consulter la console développeur pour les erreurs

### L'historique est vide
- Vérifier que la table `house_points_history` existe
- Vérifier les politiques RLS
- Essayer d'attribuer des points de test

## 📞 Support

Pour toute question ou problème :
1. Vérifier la console développeur (F12)
2. Consulter les logs Supabase
3. Contacter l'équipe technique
