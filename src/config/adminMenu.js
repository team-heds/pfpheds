export default [
  {
    label: 'Admin Général',
    icon: 'pi pi-cog',
    items: [
      { label: 'Dashboard Admin', icon: 'pi pi-chart-bar', to: '/admin/dashboard-general' },
      { label: 'Dashboard RM', icon: 'pi pi-chart-line', to: '/admin/dashboard-rm' },
      { label: 'Dashboard Enseignant', icon: 'pi pi-graduation-cap', to: '/admin/dashboard-enseignant' },
      { label: 'Gestion des Rôles', icon: 'pi pi-user-edit', to: '/role-management' },
      { label: 'Rôles Utilisateurs', icon: 'pi pi-users', to: '/admin/manage-user-roles' },
      { label: 'RBAC (Rôles & Permissions)', icon: 'pi pi-shield', to: '/admin/security/rbac' },
      { label: 'Éditeur de Routes', icon: 'pi pi-sitemap', to: '/admin/routes-editor' },
      { label: 'Permissions', icon: 'pi pi-lock', to: '/permissions' },
      { label: 'Routes & Accès', icon: 'pi pi-sitemap', to: '/router-inspector' },
      { label: 'Utilisateurs', icon: 'pi pi-users', to: '/user_list' },
      { label: 'Paramètres', icon: 'pi pi-wrench', to: '/admin/settings' }
    ]
  },
  {
    label: 'PFP',
    icon: 'pi pi-briefcase',
    items: [
      { label: 'Dashboards PFP', icon: 'pi pi-chart-bar', to: '/admin/dashboard-pfp' },
      { label: 'Étudiants', icon: 'pi pi-users', to: '/etudiant_list' },
      { label: 'Institutions', icon: 'pi pi-building', to: '/institution_list' },
      { label: 'Enseignants PHY', icon: 'pi pi-book', to: '/enseignent_list' },
      { label: 'Praticiens Formateurs', icon: 'pi pi-user-plus', to: '/praticien_formateur_list' },
      { label: 'Profil Utilisateur', icon: 'pi pi-id-card', to: '/profilAdmin/4qoWztDujictoqTEJvJK6xF1Zcr1' },
      { label: 'Répondant HES', icon: 'pi pi-id-card', to: '/management_repondant' },
      { label: 'Management Places', icon: 'pi pi-id-card', to: '/management_place' },
      {
        label: 'Votations',
        icon: 'pi pi-check-square',
        items: [
          { label: 'Gestion Offres', icon: 'pi pi-cog', to: '/management_offre' },
          { label: 'Votation Lese', icon: 'pi pi-sliders-h', to: '/management_votation_prioritaire' },
          { label: 'Votation Étudiants', icon: 'pi pi-users', to: '/management_votation_etudiants' },
          { label: 'Places Assignées', icon: 'pi pi-map-marker', to: '/places_assigned' },
          { label: 'Assignement Places', icon: 'pi pi-sitemap', to: '/places_assignment' },
          { label: 'Résultats Votation', icon: 'pi pi-chart-pie', to: '/result_preview_votation' }
        ]
      },
      {
        label: 'Gestion PFP',
        icon: 'pi pi-folder-open',
        items: [
          { label: 'PFP en Cours', icon: 'pi pi-clock', to: '/management_pfpencours' },
          { label: 'Gantt PFP', icon: 'pi pi-chart-line', to: '/gantt' },
          { label: 'Gestion Places Safe', icon: 'pi pi-shield', to: '/management_places_safe' },
          { label: 'Répartition Stages', icon: 'pi pi-percentage', to: '/stage_repartition' },
          { label: 'Validation PFP1A', icon: 'pi pi-check-circle', to: '/validate-pfp1a' }
        ]
      }
    ]
  },
  {
    label: 'Formation Pratique Physio',
    icon: 'pi pi-briefcase',
    items: [
      { label: 'Dashboard Formation Pratique', icon: 'pi pi-chart-bar', to: '/admin/formation-pratique/dashboard' },
      {
        label: 'Données',
        icon: 'pi pi-database',
        items: [
          { label: 'Étudiants', icon: 'pi pi-users', to: '/admin/formation-pratique/etudiants' },
          { label: 'Institutions', icon: 'pi pi-building', to: '/admin/formation-pratique/institutions' },
          { label: 'Praticiens Formateur', icon: 'pi pi-user-plus', to: '/admin/formation-pratique/praticiens-formateur' },
          { label: 'Places', icon: 'pi pi-map-marker', to: '/admin/formation-pratique/places' }
        ]
      },
      {
        label: 'Admin',
        icon: 'pi pi-cog',
        items: [
          { label: 'Profil Étudiants', icon: 'pi pi-id-card', to: '/admin/formation-pratique/profil-etudiants' },
          { label: 'Profil Répondant Enseignant', icon: 'pi pi-user', to: '/admin/formation-pratique/profil-repondant-enseignant' },
          { label: 'Admin Secrétariat Général', icon: 'pi pi-file', to: '/admin/formation-pratique/admin-secretariat-general' },
          { label: 'Gantt PFP', icon: 'pi pi-chart-line', to: '/admin/formation-pratique/gantt-pfp' },
          { label: 'Admin Secrétariat', icon: 'pi pi-briefcase', to: '/admin/formation-pratique/admin-secretariat' },
          { label: 'Management Répondant CPT', icon: 'pi pi-users', to: '/admin/formation-pratique/management-repondant-cpt' },
          { label: 'Management Feuille De Charge Répondant CPT', icon: 'pi pi-file', to: '/admin/formation-pratique/management-feuille-charge-cpt' }
        ]
      },
      {
        label: 'Période de Formation pratique',
        icon: 'pi pi-calendar',
        items: [
          { label: 'Offre De Place', icon: 'pi pi-list', to: '/admin/formation-pratique/offre-place' },
          { label: 'Preview PFP', icon: 'pi pi-eye', to: '/admin/formation-pratique/preview-pfp' },
          { label: 'Résultat Votation Prioritaire', icon: 'pi pi-chart-pie', to: '/admin/formation-pratique/resultat-votation-prioritaire' },
          { label: 'Résultat Votation PFP', icon: 'pi pi-chart-bar', to: '/admin/formation-pratique/resultat-votation-pfp' },
          { label: 'Management Répondant Votation', icon: 'pi pi-user-edit', to: '/admin/formation-pratique/management-repondant-votation' },
          { label: 'Valider Échec PFP', icon: 'pi pi-check-circle', to: '/admin/formation-pratique/valider-echec-pfp' }
        ]
      },
      {
        label: 'Votations',
        icon: 'pi pi-check-square',
        items: [
          { label: 'Votation Prioritaire', icon: 'pi pi-star', to: '/admin/formation-pratique/votation-prioritaire' },
          { label: 'Votation PFP', icon: 'pi pi-check-square', to: '/admin/formation-pratique/votation-pfp' }
        ]
      }
    ]
  },
  {
    label: 'Académique',
    icon: 'pi pi-book',
    items: [
      { label: 'Dashboard Académique', icon: 'pi pi-chart-bar', to: '/admin/dashboard-academique' },
      { label: 'Enseignants SI', icon: 'pi pi-users', to: '/admin/teachers-si' },
      {
        label: 'Planning',
        icon: 'pi pi-calendar',
        items: [
          { label: 'Vue Hebdomadaire', icon: 'pi pi-calendar-plus', to: '/admin/planning/weekly' },
          { label: 'Gestion Planning', icon: 'pi pi-pencil', to: '/admin/planning/manage' }
        ]
      },
      {
        label: 'Cours',
        icon: 'pi pi-book',
        items: [
          { label: 'Liste des Cours', icon: 'pi pi-list', to: '/admin/courses/list' },
          { label: 'Créer un Cours', icon: 'pi pi-plus-circle', to: '/admin/courses/create' }
        ]
      },
      { label: 'Tâches', icon: 'pi pi-th-large', to: '/admin/academic/kanban' },
      { label: 'Contenu Multimédia', icon: 'pi pi-video', to: '/admin/academic/video-library' }
    ]
  },
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
  },
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
      { label: 'Care-Convers', icon: 'pi pi-heart', to: '/care-convers' }
    ]
  }
];
