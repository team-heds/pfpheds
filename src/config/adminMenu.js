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
      // Dashboard principal Physiothérapie
      { label: 'Dashboard Physiothérapie', icon: 'pi pi-chart-bar', to: '/admin/dashboard-pfp' },
      
      // Formation Pratique & PFP (fusionné)
      {
        label: 'Formation Pratique & PFP',
        icon: 'pi pi-briefcase',
        items: [
          { label: 'Dashboard Formation Pratique', icon: 'pi pi-chart-bar', to: '/admin/formation-pratique/dashboard' },
          
          // Données de base
          {
            label: 'Données',
            icon: 'pi pi-database',
            items: [
              { label: 'Étudiants', icon: 'pi pi-users', to: '/etudiant_list' },
              { label: 'Institutions', icon: 'pi pi-building', to: '/institution_list' },
              { label: 'Enseignants Physio', icon: 'pi pi-book', to: '/enseignent_list' },
              { label: 'Praticiens Formateurs', icon: 'pi pi-user-plus', to: '/praticien_formateur_list' },
              { label: 'Places', icon: 'pi pi-map-marker', to: '/admin/formation-pratique/places' }
            ]
          },
          
          // Gestion administrative
          {
            label: 'Administration',
            icon: 'pi pi-cog',
            items: [
              { label: 'Profil Étudiants', icon: 'pi pi-id-card', to: '/admin/formation-pratique/profil-etudiants', hidden: true },
              { label: 'Répondant HES', icon: 'pi pi-user', to: '/management_repondant', hidden: true },
              { label: 'Mon Profil Répondant', icon: 'pi pi-user', to: '/admin/formation-pratique/profil-repondant' },
              { label: 'Management Signature', icon: 'pi pi-user', to: '/admin/formation-pratique/management-repondant-signature' },
              { label: 'Management Places', icon: 'pi pi-map-marker', to: '/management_place' },
              { label: 'Affectation PFP2 BA24', icon: 'pi pi-user-plus', to: '/affectation_stage_etudiant_ba24', hidden: true },
              { label: 'Management Répondant CPT', icon: 'pi pi-users', to: '/admin/formation-pratique/management-repondant-cpt', hidden: true },
              { label: 'Feuille Charge CPT', icon: 'pi pi-file', to: '/admin/formation-pratique/management-feuille-charge-cpt', hidden: true },
              { label: 'Admin Secrétariat', icon: 'pi pi-briefcase', to: '/admin/formation-pratique/admin-secretariat', hidden: true }
            ]
          },
          
          // Votations
          {
            label: 'Votations',
            icon: 'pi pi-check-square',
            items: [
              { label: 'Gestion Offres', icon: 'pi pi-cog', to: '/management_offre' },
              { label: 'Votation Prioritaire', icon: 'pi pi-star', to: '/admin/formation-pratique/votation-prioritaire', hidden: true },
              { label: 'Votation lésé', icon: 'pi pi-sliders-h', to: '/management_votation_prioritaire' },
              { label: 'Votation Étudiants', icon: 'pi pi-users', to: '/management_votation_etudiants', hidden: true },
              { label: 'Votation PFP', icon: 'pi pi-check-square', to: '/admin/formation-pratique/votation-pfp' },
              { label: 'Places Assignées', icon: 'pi pi-map-marker', to: '/places_asssigned' },
              { label: 'Assignement Places', icon: 'pi pi-sitemap', to: '/places_assignment' },
              { label: 'Validation PFP', icon: 'pi pi-check-circle', to: '/validation-pfp' },
              { label: 'Résultat Votation Prioritaire', icon: 'pi pi-chart-pie', to: '/admin/formation-pratique/resultat-votation-prioritaire', hidden: true },
              { label: 'Résultat Votation PFP', icon: 'pi pi-chart-bar', to: '/result_preview_votation' },
              { label: 'Management Répondant Votation', icon: 'pi pi-user-edit', to: '/admin/formation-pratique/management-repondant-votation' }
            ]
          },
          
          // Gestion PFP
          {
            label: 'Gestion PFP',
            icon: 'pi pi-folder-open',
            hidden: true,
            items: [
              { label: 'PFP en Cours', icon: 'pi pi-clock', to: '/management_pfpencours' },
              { label: 'Preview PFP', icon: 'pi pi-eye', to: '/admin/formation-pratique/preview-pfp' },
              { label: 'Gantt PFP', icon: 'pi pi-chart-line', to: '/gantt' },
              { label: 'Gestion Places Safe', icon: 'pi pi-shield', to: '/management_places_safe' },
              { label: 'Répartition Stages', icon: 'pi pi-percentage', to: '/stage_repartition' },
              { label: 'Validation PFP1A', icon: 'pi pi-check-circle', to: '/validate-pfp1a' },
              { label: 'Valider Échec PFP', icon: 'pi pi-check-circle', to: '/admin/formation-pratique/valider-echec-pfp' }
            ]
          },
          
          // Secrétariat FP
          {
            label: 'Secrétariat FP',
            icon: 'pi pi-folder',
            items: [
              { label: 'Vérification Critères Étudiants', icon: 'pi pi-check-circle', to: '/admin/formation-pratique/secretariat/verification-criteres' },
              { label: 'Suivi Institutions', icon: 'pi pi-building', to: '/admin/formation-pratique/secretariat/suivi-institutions' },
              { label: 'Tableau Récapitulatif Offres', icon: 'pi pi-table', to: '/admin/formation-pratique/secretariat/tableau-offres' },
              { label: 'Récap PFP Notes', icon: 'pi pi-file', to: '/admin/formation-pratique/secretariat/recap-pfp-notes' },
              { label: 'Récap CPT Évaluation', icon: 'pi pi-star', to: '/admin/formation-pratique/secretariat/recap-cpt-evaluation' },
              { label: 'Suivi Cas Particuliers', icon: 'pi pi-exclamation-triangle', to: '/admin/formation-pratique/secretariat/suivi-cas-particuliers' },
              { label: 'Centre d\'Alertes', icon: 'pi pi-bell', to: '/admin/formation-pratique/secretariat/alertes' },
              { label: 'Vue d\'ensemble FP', icon: 'pi pi-th-large', to: '/admin/formation-pratique/secretariat/vue-ensemble' }
            ]
          }
        ]
      },
      
      // Gamification (spécifique Physiothérapie)
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
