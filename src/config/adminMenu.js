/**
 * Menu Admin Restructuré par Filière
 * 
 * Structure:
 * 1. Admin Général - Dashboard et configuration système
 * 2. Physiothérapie - Formation Pratique/PFP + Gamification
 * 3. Soins Infirmiers - Académique
 * 4. Général - Outils transversaux
 */

export default [
  // ========================================
  // 📊 ADMIN GÉNÉRAL - Configuration système
  // ========================================
  {
    label: 'Admin Général',
    icon: 'pi pi-cog',
    items: [
      { label: 'Dashboard Général', icon: 'pi pi-chart-bar', to: '/admin' },
      { label: 'Gestion Rôles par Filière', icon: 'pi pi-id-card', to: '/admin/role-management' },
      { label: 'Rôles Utilisateurs', icon: 'pi pi-users', to: '/admin/manage-user-roles' },
      { label: 'RBAC (Rôles & Permissions)', icon: 'pi pi-shield', to: '/admin/security/rbac' },
      { label: 'Éditeur de Routes', icon: 'pi pi-sitemap', to: '/admin/routes-editor' },
      { label: 'Permissions', icon: 'pi pi-lock', to: '/permissions' },
      { label: 'Routes & Accès', icon: 'pi pi-sitemap', to: '/router-inspector' },
      { label: 'Utilisateurs', icon: 'pi pi-users', to: '/user_list' },
      { label: 'Paramètres', icon: 'pi pi-wrench', to: '/admin/settings' },
      { label: 'Diagnostic Supabase', icon: 'pi pi-database', to: '/admin/supabase-diagnostic' }
    ]
  },

  // ========================================
  // 🏃 PHYSIOTHÉRAPIE - Formation Pratique & Gamification
  // ========================================
  {
    label: 'Physiothérapie',
    icon: 'pi pi-heart',
    items: [
      // Dashboard
      { label: 'Dashboard PFP', icon: 'pi pi-chart-bar', to: '/admin/dashboard-pfp' },

      // Données de base
      {
        label: 'Données FP',
        icon: 'pi pi-database',
        items: [
          { label: 'Étudiants', icon: 'pi pi-users', to: '/admin/formation-pratique/etudiants' },
          { label: 'Institutions', icon: 'pi pi-building', to: '/admin/formation-pratique/institutions' },
          { label: 'Enseignants Physio', icon: 'pi pi-book', to: '/admin/formation-pratique/enseignants' },
          { label: 'Praticiens Formateurs', icon: 'pi pi-user-plus', to: '/admin/formation-pratique/praticiens-formateur' },
          { label: 'Places', icon: 'pi pi-map-marker', to: '/admin/formation-pratique/places' }
        ]
      },

      // Gestion administrative
      {
        label: 'Gestion FP',
        icon: 'pi pi-cog',
        items: [
          { label: 'Mon Profil Répondant', icon: 'pi pi-user', to: '/admin/formation-pratique/profil-repondant' },
          { label: 'Management Signature', icon: 'pi pi-pencil', to: '/admin/formation-pratique/management-repondant-signature' },
          // { label: 'Management Places', icon: 'pi pi-map-marker', to: '/admin/formation-pratique/management-places' }
        ]
      },

      // Votations
      {
        label: 'Votations',
        icon: 'pi pi-check-square',
        items: [
          { label: 'Gestion Offres', icon: 'pi pi-cog', to: '/admin/formation-pratique/gestion-offres' },
          { label: 'Votation lésé', icon: 'pi pi-sliders-h', to: '/admin/formation-pratique/votation-lese' },
          { label: 'Votation PFP', icon: 'pi pi-check-square', to: '/admin/formation-pratique/votation-pfp' },
          { label: 'Places Assignées', icon: 'pi pi-map-marker', to: '/admin/formation-pratique/places-assignees' },
          { label: 'Validation Places', icon: 'pi pi-check-circle', to: '/admin/formation-pratique/validation-places' },
          { label: 'Validation PFP', icon: 'pi pi-check-circle', to: '/admin/formation-pratique/validation-pfp' }
        ]
      },

      // Secrétariat FP
      {
        label: 'Secrétariat FP',
        icon: 'pi pi-folder',
        items: [
          { label: 'Vue d\'ensemble FP', icon: 'pi pi-th-large', to: '/admin/formation-pratique/secretariat/vue-ensemble' },
          { label: 'Vérification Critères', icon: 'pi pi-check-circle', to: '/admin/formation-pratique/secretariat/verification-criteres' },
          { label: 'Suivi Institutions', icon: 'pi pi-building', to: '/admin/formation-pratique/secretariat/suivi-institutions' },
          { label: 'Tableau Offres', icon: 'pi pi-table', to: '/admin/formation-pratique/secretariat/tableau-offres' },
          { label: 'Récap PFP Notes', icon: 'pi pi-file', to: '/admin/formation-pratique/secretariat/recap-pfp-notes' },
          { label: 'Récap CPT Évaluation', icon: 'pi pi-star', to: '/admin/formation-pratique/secretariat/recap-cpt-evaluation' },
          { label: 'Suivi Cas Particuliers', icon: 'pi pi-exclamation-triangle', to: '/admin/formation-pratique/secretariat/suivi-cas-particuliers' },
          { label: 'Centre d\'Alertes', icon: 'pi pi-bell', to: '/admin/formation-pratique/secretariat/alertes' }
        ]
      },
      
      // Gamification
      {
        label: 'Gamification',
        icon: 'pi pi-star-fill',
        items: [
          { label: 'Dashboard Gamification', icon: 'pi pi-chart-bar', to: '/admin/dashboard-gamification' },
          { label: 'Gestion Défis', icon: 'pi pi-flag-fill', to: '/admin/gamification/challenges' },
          { label: 'Gestion Quêtes', icon: 'pi pi-compass', to: '/admin/gamification/quests' },
          { label: 'Gestion Badges', icon: 'pi pi-shield', to: '/admin/gamification/badges' },
          { label: 'Gestion Utilisateurs', icon: 'pi pi-users', to: '/admin/gamification/users' },
          { label: 'Gestion Maisons', icon: 'pi pi-home', to: '/admin/gamification/houses' },
          { label: 'Analytics & Statistiques', icon: 'pi pi-chart-line', to: '/admin/gamification/analytics' }
        ]
      }
    ]
  },

  // ========================================
  // 🏥 SOINS INFIRMIERS - Académique
  // ========================================
  {
    label: 'Soins Infirmiers',
    icon: 'pi pi-heart-fill',
    items: [
      // Dashboards
      { label: 'Dashboard Secrétariat', icon: 'pi pi-th-large', to: '/admin/soins-infirmiers/dashboard' },
      { label: 'Dashboard RM', icon: 'pi pi-chart-line', to: '/admin/dashboard-rm' },
      
      // Planning
      {
        label: 'Planning',
        icon: 'pi pi-calendar',
        items: [
          { label: 'Structure Mini Brique', icon: 'pi pi-th-large', to: '/admin/planning' },
          { label: 'Vue Hebdomadaire', icon: 'pi pi-calendar', to: '/admin/planning/weekly' },
          { label: 'Vue Journalière / Salles', icon: 'pi pi-building', to: '/admin/soins-infirmiers/planning-journalier' },
          { label: 'Feuille de charges', icon: 'pi pi-chart-bar', to: '/admin/soins-infirmiers/feuille-de-charges' },
          { label: 'Gestion Planning', icon: 'pi pi-pencil', to: '/admin/planning/manage' },
          { label: 'Années Académiques', icon: 'pi pi-calendar-plus', to: '/admin/planning/years' }
        ]
      },
      
      // Ressources
      {
        label: 'Ressources',
        icon: 'pi pi-database',
        items: [
          { label: 'Enseignants SI', icon: 'pi pi-users', to: '/admin/teachers-si' },
          { label: 'Modules', icon: 'pi pi-book', to: '/admin/modules' },
          { label: 'Contenu Multimédia', icon: 'pi pi-video', to: '/admin/academic/video-library' }
        ]
      },
      
      // Outils
      { label: 'Ticket Tâches', icon: 'pi pi-check-square', to: '/admin/academic/kanban' }
    ]
  },

  // ========================================
  // 🔧 GÉNÉRAL - Outils transversaux
  // ========================================
  {
    label: 'Général',
    icon: 'pi pi-box',
    items: [
      {
        label: 'Outils',
        icon: 'pi pi-wrench',
        items: [
          {
            label: 'Médias',
            icon: 'pi pi-video',
            items: [
              { label: 'Administration Modules', icon: 'pi pi-folder', to: '/admin/modules' },
              { label: 'Hub Multimédia', icon: 'pi pi-play-circle', to: '/media' },
              { label: 'Modules Vidéo', icon: 'pi pi-list', to: '/modules' },
              { label: 'Test Vimeo', icon: 'pi pi-external-link', to: '/vimeo-test' }
            ]
          },
          { label: 'Feedbacka', icon: 'pi pi-comments', to: '/admin/tools/feedbacka' },
          { label: 'Care-Convers', icon: 'pi pi-heart', to: '/care-convers' },
          { label: 'Capsules Insuffisance Rhénale', icon: 'pi pi-book', to: '/capsules-insuffisance-renale' }
        ]
      }
    ]
  }
];
