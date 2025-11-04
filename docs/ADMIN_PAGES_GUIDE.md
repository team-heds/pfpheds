# 📚 Guide Complet des Pages Admin

> Documentation exhaustive de toutes les pages accessibles depuis l'AdminSidebar avec leurs fonctionnalités détaillées.

---

## 🔧 SECTION 1: ADMIN GÉNÉRAL

### Dashboard Admin
**Route:** `/admin/dashboard-general`

**Fonctionnalités:**
- ✅ Statistiques globales (places stages, institutions, étudiants, formateurs)
- ✅ Graphiques évolution offre en formation
- ✅ Répartition étudiants par volée (pie chart)
- ✅ Vue d'ensemble système gamification
- ✅ Liens rapides vers sections

**Description:** Dashboard principal avec vue 360° de toute la plateforme.

---

### Dashboard RM (Responsable Module)
**Route:** `/admin/dashboard-rm`

**Fonctionnalités:**
- ✅ Stats: modules gérés, enseignants, heures, étudiants
- ✅ Liste modules assignés avec détails complets
- ✅ Liste enseignants sous responsabilité
- ✅ Actions rapides (gestion enseignants, planning, cours)
- ✅ Indicateurs performance module

**Permissions:** `admin`, `RMSoins`

---

### Dashboard Enseignant
**Route:** `/admin/dashboard-enseignant`

**Fonctionnalités:**
- ✅ Stats: cours assignés, heures/semaine, prochain cours
- ✅ Planning hebdomadaire visuel interactif
- ✅ Liste des cours avec horaires et détails
- ✅ Actions rapides (planning, cours, feedback)
- ✅ Vue étudiants par cours

**Permissions:** `admin`, `EnseignantSoins`, `EnseignantPhysio`

---

### Gestion des Rôles
**Route:** `/role-management`

**Fonctionnalités:**
- ✅ Affichage permissions utilisateur actuel
- ✅ Toggles modification permissions (admin, AdminSoins, etc.)
- ✅ Sauvegarde et réinitialisation permissions
- ✅ Test état actuel permissions
- ✅ Documentation permissions disponibles

---

### Rôles Utilisateurs
**Route:** `/admin/manage-user-roles`

**Fonctionnalités:**
- ✅ Liste tous utilisateurs avec rôles actuels
- ✅ Attribution/retrait rôles par utilisateur
- ✅ Recherche et filtres avancés utilisateurs
- ✅ Gestion permissions en masse (bulk actions)
- ✅ Export liste utilisateurs

---

### Permissions
**Route:** `/permissions`

**Fonctionnalités:**
- ✅ Vue détaillée toutes permissions système
- ✅ Documentation permissions Supabase complète
- ✅ Matrice permissions par rôle
- ✅ Tests vérification accès routes
- ✅ Diagnostic permissions

**Description:** Outil de debug et documentation des permissions.

---

### Routes & Accès
**Route:** `/router-inspector`

**Fonctionnalités:**
- ✅ Liste complète routes application
- ✅ Affichage meta (need, requiredRole) par route
- ✅ Debug navigation guards temps réel
- ✅ Tests accessibilité routes par rôle
- ✅ Documentation structure routing

**Description:** Outil développeur pour analyser le système de routing.

---

### Utilisateurs
**Route:** `/user_list`

**Fonctionnalités:**
- ✅ Liste complète utilisateurs base de données
- ✅ Recherche, tri, filtres multiples
- ✅ Édition profils utilisateurs inline
- ✅ Export données (Excel, CSV, PDF)
- ✅ Statistiques utilisateurs

---

### Paramètres
**Route:** `/admin/settings`

**Fonctionnalités:**
- ✅ Configuration globale application
- ✅ Paramètres système avancés
- ✅ Gestion thème et apparence
- ✅ Options maintenance
- ✅ Logs système

---

## 💼 SECTION 2: PFP (PRATIQUE FORMATION PROFESSIONNELLE)

### Dashboard PFP
**Route:** `/admin/dashboard-pfp`

**Fonctionnalités:**
- ✅ Stats PFP (places, institutions, stages)
- ✅ Graphiques répartition PFP1A/1B/2/3/4
- ✅ Indicateurs taux occupation places
- ✅ Alertes actions requises urgentes
- ✅ Timeline activités PFP

---

## 📋 Listes & Utilisateurs

### Étudiants
**Route:** `/etudiant_list`

**Fonctionnalités:**
- ✅ Liste étudiants avec classe et volée
- ✅ Recherche et filtres par classe/statut
- ✅ Édition fiches étudiants complètes
- ✅ Export Excel/CSV avec filtres
- ✅ Statistiques par classe

---

### Institutions
**Route:** `/institution_list`

**Fonctionnalités:**
- ✅ Liste institutions partenaires
- ✅ Détails places disponibles par PFP
- ✅ Localisation carte interactive Google Maps
- ✅ Contacts répondants HES par institution
- ✅ Export données institutions

---

### Enseignants PHY (Physiothérapie)
**Route:** `/enseignent_list`

**Fonctionnalités:**
- ✅ Liste enseignants physiothérapie
- ✅ Cours assignés avec nombre d'heures
- ✅ Modules dont responsable (RM)
- ✅ Statistiques enseignement détaillées
- ✅ Historique cours

**Permissions:** Accessible aux rôles Physio uniquement

---

### Praticiens Formateurs
**Route:** `/praticien_formateur_list`

**Fonctionnalités:**
- ✅ Liste PF par institution
- ✅ Places de formation disponibles
- ✅ Historique encadrement étudiants
- ✅ Évaluations et feedback
- ✅ Contact et coordonnées

---

### Profil Utilisateur
**Route:** `/profilAdmin/:id`

**Fonctionnalités:**
- ✅ Vue détaillée profil complet
- ✅ Historique toutes activités utilisateur
- ✅ Documents liés et attachés
- ✅ Notes administrateur privées
- ✅ Timeline interactions

---

### Répondant HES
**Route:** `/management_repondant`

**Fonctionnalités:**
- ✅ Liste répondants par institution
- ✅ Gestion contacts et coordonnées
- ✅ Communications envoyées (historique)
- ✅ Historique interactions et suivis
- ✅ Statut répondant actif/inactif

---

### Management Places
**Route:** `/management_place`

**Fonctionnalités:**
- ✅ Gestion globale places de stages
- ✅ Création/modification/suppression places
- ✅ Disponibilité par période académique
- ✅ Statistiques occupation temps réel
- ✅ Validation places HES

---

## 🗳️ Votations

### Gestion Offres
**Route:** `/management_offre`

**Fonctionnalités:**
- ✅ Création offres de places détaillées
- ✅ Édition détails places (horaires, services, critères)
- ✅ Publication et archivage offres
- ✅ Suivi candidatures étudiants
- ✅ Statistiques attractivité offres

---

### Votation Lese (Prioritaire)
**Route:** `/management_votation_prioritaire`

**Fonctionnalités:**
- ✅ Configuration votation prioritaire
- ✅ Critères sélection automatique
- ✅ Règles attribution places prioritaires
- ✅ Validation lese étudiants
- ✅ Export résultats lese

**Description:** Système de votation pour étudiants prioritaires (lese).

---

### Votation Étudiants
**Route:** `/management_votation_etudiants`

**Fonctionnalités:**
- ✅ Lancement votation pour étudiants
- ✅ Suivi votes en temps réel
- ✅ Configuration choix multiples (1er, 2e, 3e choix)
- ✅ Clôture votation avec deadline
- ✅ Statistiques participation

---

### Places Assignées
**Route:** `/places_asssigned`

**Fonctionnalités:**
- ✅ Vue toutes places assignées finales
- ✅ Filtres par volée, période, institution
- ✅ Export affectations (Excel, PDF)
- ✅ Modifications d'urgence assignations
- ✅ Historique changements

---

### Assignement Places
**Route:** `/places_assignment`

**Fonctionnalités:**
- ✅ Algorithme attribution automatique
- ✅ Attribution manuelle places spécifiques
- ✅ Gestion conflits et arbitrage
- ✅ Validation finale attribution
- ✅ Preview avant validation

---

### Résultats Votation
**Route:** `/result_preview_votation`

**Fonctionnalités:**
- ✅ Résultats détaillés votation par étudiant
- ✅ Graphiques satisfaction étudiants
- ✅ Taux remplissage places par institution
- ✅ Export résultats PDF complet
- ✅ Analyse choix multiples

---

## 📁 Gestion PFP

### PFP en Cours
**Route:** `/management_pfpencours`

**Fonctionnalités:**
- ✅ Suivi PFP actifs en temps réel
- ✅ État avancement par étudiant
- ✅ Documents à valider (checklist)
- ✅ Alertes problèmes et retards
- ✅ Timeline PFP par étudiant

---

### Gantt PFP
**Route:** `/gantt`

**Fonctionnalités:**
- ✅ Vue Gantt planning PFP global
- ✅ Timeline par volée (BA1, BA2, BA3)
- ✅ Jalons importants (deadlines, évaluations)
- ✅ Dépendances entre phases PFP
- ✅ Export planning Gantt

---

### Gestion Places Safe
**Route:** `/management_places_safe`

**Fonctionnalités:**
- ✅ Places sécurisées et réservées
- ✅ Conventions avec institutions partenaires
- ✅ Garanties attribution (étudiants spécifiques)
- ✅ Historique places safe années précédentes
- ✅ Gestion renouvellements

---

### Répartition Stages
**Route:** `/stage_repartition`

**Fonctionnalités:**
- ✅ Stats répartition géographique (carte)
- ✅ Équilibre types de services médicaux
- ✅ Graphiques répartition par critères
- ✅ Identification déséquilibres
- ✅ Recommandations équilibrage

---

### Validation PFP1A
**Route:** `/validate-pfp1a`

**Fonctionnalités:**
- ✅ Validation documents PFP1A étudiants
- ✅ Checklist critères validation complète
- ✅ Commentaires correctifs pour étudiants
- ✅ Approbation finale avec signature
- ✅ Historique validations

---

## 📚 SECTION 3: ACADÉMIQUE

### Dashboard Académique
**Route:** `/admin/dashboard-academique`

**Fonctionnalités:**
- ✅ Stats: cours, modules, enseignants
- ✅ Planning hebdomadaire synthétique
- ✅ Taux occupation salles en temps réel
- ✅ Alertes conflits horaires automatiques
- ✅ Indicateurs charge enseignement

---

### Enseignants SI (Soins Infirmiers)
**Route:** `/admin/teachers-si`

**Fonctionnalités:**
- ✅ Liste enseignants Soins Infirmiers
- ✅ Colonnes: Prénom, Nom, Heures, Module RM
- ✅ Dropdown Module RM avec sauvegarde automatique
- ✅ Édition inline (clic sur nom/prénom) + dialog complet
- ✅ Sélection multiple avec panneau sticky et actions groupées
- ✅ Stats: total enseignants, heures totales, nombre avec RM

**Nouveau:** Système d'édition rapide avec sauvegarde automatique.

---

## 📅 Planning

### Vue Hebdomadaire
**Route:** `/admin/planning/weekly`

**Fonctionnalités:**
- ✅ Sélection année académique + semaine
- ✅ Mode affichage: semaine ou semestre complet
- ✅ DataTable créneaux: jour/horaire/module/enseignant/salle
- ✅ Ajout/édition/suppression créneaux en temps réel
- ✅ Duplication semaine complète vers autre période
- ✅ Export Excel planning hebdo/semestre

**Nouveau:** Intégré avec AdminLayout pour navigation cohérente.

---

### Gestion Planning
**Route:** `/admin/planning/manage`

**Fonctionnalités:**
- ✅ Vue globale planning annuel
- ✅ Création modules et cours
- ✅ Attribution enseignants aux cours
- ✅ Gestion salles et ressources matérielles
- ✅ Détection conflits automatique

---

## 📖 Cours

### Liste des Cours
**Route:** `/admin/courses/list`

**Fonctionnalités:**
- ✅ DataTable tous cours avec pagination
- ✅ Colonnes: code, nom, module, enseignant, horaire, salle, étudiants, statut
- ✅ Filtres avancés: module, enseignant, statut
- ✅ Recherche par nom ou code cours
- ✅ Actions: voir détails, éditer, supprimer

**Nouveau:** Page dédiée (plus de popup).

---

### Créer un Cours
**Route:** `/admin/courses/create`

**Fonctionnalités:**
- ✅ Formulaire infos générales (code, nom, type, module, enseignant, étudiants, description)
- ✅ Section horaire & lieu (jour, heures début/fin, salle, dates, récurrence hebdomadaire)
- ✅ Options avancées (statut, capacité max, disponibilité online, lien visio, notes internes)
- ✅ Validation champs obligatoires automatique
- ✅ Sauvegarde comme brouillon possible

---

### Détails Cours
**Route:** `/admin/courses/:id`

**Fonctionnalités:**
- ✅ Infos complètes cours toutes sections
- ✅ Stats participants avec taux occupation
- ✅ Liste ressources téléchargeables (PDF, vidéos, docs)
- ✅ Historique présences avec DataTable et stats
- ✅ Actions rapides (email groupe, annonces, export données, duplication cours)

**Description:** Vue 360° d'un cours avec toutes les informations et actions.

---

### Éditer Cours
**Route:** `/admin/courses/:id/edit`

**Fonctionnalités:**
- ✅ Formulaire pré-rempli toutes infos existantes
- ✅ Modification tous champs (infos, horaire, options)
- ✅ Bouton accès rapide vue détails cours
- ✅ Sauvegarde modifications avec validation
- ✅ Historique modifications

---

## 🎯 Gestion Académique

### Tâches (Kanban)
**Route:** `/admin/academic/kanban`

**Fonctionnalités:**
- ✅ Kanban tâches académiques (À faire, En cours, Terminé)
- ✅ Attribution enseignants/responsables à tâches
- ✅ Dates échéance avec alertes
- ✅ Priorités (haute, moyenne, basse)
- ✅ Commentaires et pièces jointes

**Description:** Gestion tâches style Trello pour projets académiques.

---

### Contenu Multimédia
**Route:** `/admin/academic/media-content`

**Fonctionnalités:**
- ✅ Bibliothèque vidéos et documents
- ✅ Upload fichiers multiples (drag & drop)
- ✅ Organisation par module/cours
- ✅ Intégration Vimeo pour vidéos
- ✅ Partage liens avec étudiants

**Description:** Médiathèque centralisée pour tous les contenus pédagogiques.

---

## ⭐ SECTION 4: GAMIFICATION

### Dashboard Gamification
**Route:** `/admin/dashboard-gamification`

**Fonctionnalités:**
- ✅ Stats globales: défis, quêtes, badges, utilisateurs actifs
- ✅ Classement maisons en temps réel
- ✅ Activité récente système gamification
- ✅ Top joueurs (leaderboard)
- ✅ Graphiques engagement

---

### Gestion Défis
**Route:** `/admin/gamification/challenges`

**Fonctionnalités:**
- ✅ Création défis avec récompenses points/badges
- ✅ Édition défis existants (titre, description, critères)
- ✅ Activation/désactivation défis par période
- ✅ Statistiques participation et complétion
- ✅ Difficulté et catégories défis

**Description:** CRUD complet pour les défis gamification.

---

### Gestion Quêtes
**Route:** `/admin/gamification/quests`

**Fonctionnalités:**
- ✅ Création quêtes multi-étapes progressives
- ✅ Définition objectifs et critères validation
- ✅ Récompenses progressives par étape
- ✅ Suivi progression étudiants en temps réel
- ✅ Quêtes avec histoire narrative

**Description:** Système de quêtes avancé avec progression.

---

### Gestion Badges
**Route:** `/admin/gamification/badges`

**Fonctionnalités:**
- ✅ Création badges avec icônes personnalisées
- ✅ Upload images badges (PNG, SVG)
- ✅ Définition conditions débloquage automatique
- ✅ Statistiques obtention par badge
- ✅ Rareté badges (commun, rare, légendaire)

---

### Gestion Utilisateurs Gamification
**Route:** `/admin/gamification/users`

**Fonctionnalités:**
- ✅ Attribution rôles gamification (joueur, coach, maître du jeu)
- ✅ Attribution manuelle points/badges
- ✅ Historique complet activités joueur
- ✅ Pénalités et bonus exceptionnels
- ✅ Reset progression si nécessaire

---

### Gestion Maisons
**Route:** `/admin/gamification/houses`

**Fonctionnalités:**
- ✅ Création/édition maisons (style Harry Potter)
- ✅ Points maisons en temps réel
- ✅ Attribution étudiants aux maisons
- ✅ Classement inter-maisons avec historique
- ✅ Événements spéciaux maisons

**Description:** Système de maisons complet avec compétition.

---

### Analytics & Statistiques
**Route:** `/admin/gamification/analytics`

**Fonctionnalités:**
- ✅ Graphiques engagement étudiants temporels
- ✅ Stats défis les plus populaires
- ✅ Taux complétion quêtes par difficulté
- ✅ Évolution points dans le temps
- ✅ Distribution badges par rareté

**Description:** Analytiques avancées pour mesurer l'engagement.

---

## 🔧 SECTION 5: OUTILS

### Feedbacka
**Route:** `/admin/tools/feedbacka`

**Fonctionnalités:**
- ✅ **3 onglets:** Feedbacks reçus, Mes feedbacks, Analytiques
- ✅ **Feedbacks reçus:** DataTable avec filtres (statut, type, cours), recherche, notes étoiles, réponses
- ✅ **Mes feedbacks:** Liste feedbacks envoyés avec réponses reçues et suivi
- ✅ **Analytiques:** Graphiques évolution, répartition types, notes moyennes par cours, temps réponse moyen
- ✅ Création feedback avec formulaire complet (destinataire, cours, type, note, message)
- ✅ Système réponse bidirectionnel
- ✅ Statistiques: total, traités, en attente, note moyenne
- ✅ Export données

**Description:** Plateforme complète de feedback et d'évaluation entre enseignants et étudiants.

---

### Care-Convers
**Route:** `/care-convers`

**Fonctionnalités:**
- ✅ Outil conversations de soins thérapeutiques
- ✅ Enregistrement et transcription conversations
- ✅ Analyse contenu avec IA
- ✅ Feedback formatif automatique
- ✅ Bibliothèque conversations anonymisées

**Description:** Outil pédagogique pour l'apprentissage des conversations de soins.

---

## 📊 Résumé des Statistiques

- **Total pages:** 60+
- **Sections principales:** 5 (Admin Général, PFP, Académique, Gamification, Outils)
- **Nouvelles pages créées:** 8 (Dashboards RM/Enseignant, Cours CRUD, Feedbacka, etc.)
- **Pages avec AdminLayout:** Toutes les pages académiques et outils
- **Système de permissions:** Supabase + Firebase legacy

---

## 🎯 Notes Importantes

### Permissions
- **Super Admin:** Accès à tout
- **Admin Physio:** Accès PFP + Gamification
- **Admin Soins:** Accès Académique
- **RM (Responsable Module):** Dashboard RM + gestion son module
- **Enseignant:** Dashboard Enseignant + ses cours

### Système de Navigation
- **AdminSidebar:** Navigation principale collapsible
- **AdminLayout:** Layout unifié avec header PageHeader
- **Filtrage dynamique:** Menus affichés selon permissions

### Technologies
- **Frontend:** Vue 3 (Composition API), PrimeVue
- **Backend:** Firebase Realtime Database + Supabase PostgreSQL
- **Auth:** Firebase Auth + Supabase Auth
- **State:** Pinia stores
- **Router:** Vue Router avec guards

---

**Date de dernière mise à jour:** 03/11/2025
**Version:** 2.0 - Refonte Admin UI complète




| **Étape**                                                 | **Temps** | **Objectif**                                             | **Actions / Ton du MJ**                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------- | --------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1️⃣ Ouverture – “Bienvenue dans le monde des Maisons”** | 5–10 min  | Créer l’ambiance, poser le cadre narratif et émotionnel. | 🎙 Le MJ raconte brièvement la légende des Maisons : *“Chaque Maison incarne une valeur du soin : équilibre, clarté, rigueur et apaisement.”* <br> 🎥 *(Option : projeter les blasons)* <br> ❇️ **Ton :** inspirant, immersif.                                                                                |
| **2️⃣ Présentation du système de jeu**                    | 10–15 min | Expliquer simplement le fonctionnement.                  | 🔹 **XP** = progression visible <br> 🔹 **Quêtes** = actions concrètes <br> 🔹 **Badges** = reconnaissance <br> 🔹 **Angels Order** = vote d’entraide <br><br> 💬 Donner 2–3 exemples concrets *(aider un camarade, résumer un cours, participer à un défi).* <br> ❇️ **Ton :** dynamique, clair et inclusif. |
| **3️⃣ Découverte des équipes et des Maisons**             | 10 min    | Créer un moment d’appartenance.                          | 👥 Révéler qui appartient à quelle Maison *(avec mini-blasons, affiches, ou tirage au sort).* <br> 💬 Chaque Maison choisit **un mot-clé** ou **une phrase** qui résume son énergie.                                                                                                                          |
| **4️⃣ Atelier express – “Nos idées de quêtes”**           | 15–20 min | Lancer la co-création et recueillir des idées concrètes. | 🧩 Par petits groupes : imaginer **1 quête possible** et **1 idée de badge** par Maison. <br><br> *Exemples :* <br> – **Harmonis** → “Zen Challenge” *(trouver une routine bien-être)* <br> – **Elaris** → “Lumière du savoir” *(transmettre une astuce à un pair)* <br><br> 💬 Partage rapide en plénière.   |
| **5️⃣ Clôture – “Le Serment du Conseil”**                 | 5 min     | Terminer sur un moment fort et fédérateur.               | 🎙 Le MJ clôture : *“Chaque Maison n’est pas une équipe, mais une famille académique. Ensemble, nous donnons vie à cette aventure.”* <br><br> ✋ Tous récitent un mini-serment : <br> *“Nous jurons de jouer, d’apprendre et de grandir ensemble.”* <br><br> 📸 *(Photo ou petit rituel symbolique)*           |
