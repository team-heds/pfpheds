/**
 * Configuration centralisée des KPI pour tous les dashboards admin
 * Permet de gérer facilement quels KPI afficher, pour qui, et comment
 */

export const kpiConfigurations = {
  // ========================================
  // DASHBOARD GÉNÉRAL
  // ========================================
  general: [
    {
      id: 'total_users',
      label: 'Utilisateurs Totaux',
      subtitle: 'Évolution utilisateurs',
      icon: 'pi pi-users',
      color: '#3b82f6',
      dataKey: 'users',
      breakdownKey: 'usersTimeline',
      showChart: true,
      chartType: 'line',
      chartHeight: 200,
      animated: true,
      clickable: true,
      actionLabel: 'Voir',
      fetchFn: 'fetchGeneralKpis',
      order: 1,
      visible: true,
      roles: ['admin', 'super.all'] // Qui peut voir ce KPI
    },
    {
      id: 'total_roles',
      label: 'Rôles',
      subtitle: 'Rôles configurés',
      icon: 'pi pi-id-card',
      color: '#8b5cf6',
      dataKey: 'roles',
      showChart: false,
      chartType: 'pie',
      chartHeight: 250,
      animated: true,
      clickable: true,
      actionLabel: 'Gérer',
      fetchFn: 'fetchGeneralKpis',
      order: 2,
      visible: true,
      roles: ['admin', 'super.all']
    },
    {
      id: 'active_permissions',
      label: 'Permissions Actives',
      subtitle: 'Système RBAC',
      icon: 'pi pi-shield',
      color: '#10b981',
      dataKey: 'permissions',
      showChart: false,
      animated: true,
      clickable: false,
      fetchFn: 'fetchGeneralKpis',
      order: 3,
      visible: true,
      roles: ['admin', 'super.all']
    },
    {
      id: 'route_count',
      label: 'Routes',
      subtitle: 'Pages disponibles',
      icon: 'pi pi-map',
      color: '#f59e0b',
      dataKey: 'routes',
      breakdownKey: 'routesList',
      showChart: true,
      chartType: 'table',
      chartHeight: 250,
      animated: true,
      clickable: false,
      fetchFn: 'fetchGeneralKpis',
      order: 4,
      visible: true,
      roles: ['admin', 'super.all']
    }
  ],

  // ========================================
  // DASHBOARD PFP
  // ========================================
  pfp: [
    {
      id: 'students_count',
      label: 'Étudiants',
      subtitle: 'Inscrits au PFP',
      icon: 'pi pi-users',
      color: '#3b82f6',
      dataKey: 'etudiants',
      showChart: true,
      chartType: 'auto',
      enableChartSelector: true,
      chartHeight: 250,
      breakdownKey: 'etudiantsByClasse',
      animated: true,
      clickable: true,
      actionLabel: 'Voir liste',
      fetchFn: 'fetchPfpKpis',
      order: 1,
      visible: true,
      roles: ['admin', 'page1.access', 'EnseignantPhysio']
    },
    {
      id: 'institutions_count',
      label: 'Institutions',
      subtitle: 'Évolution partenaires',
      icon: 'pi pi-building',
      color: '#8b5cf6',
      dataKey: 'institutions',
      breakdownKey: 'institutionsTimeline',
      showChart: true,
      chartType: 'line',
      chartHeight: 200,
      animated: true,
      clickable: true,
      actionLabel: 'Voir',
      fetchFn: 'fetchPfpKpis',
      order: 2,
      visible: true,
      roles: ['admin', 'page1.access']
    },
    {
      id: 'places_count',
      label: 'Places',
      subtitle: 'Par institution',
      icon: 'pi pi-map-marker',
      color: '#10b981',
      dataKey: 'places',
      breakdownKey: 'placesList',
      showChart: true,
      chartType: 'bar',
      chartHeight: 300,
      animated: true,
      clickable: true,
      actionLabel: 'Gérer',
      fetchFn: 'fetchPfpKpis',
      order: 3,
      visible: true,
      roles: ['admin', 'page1.access']
    },
    {
      id: 'pfp_ongoing',
      label: 'PFP en cours',
      subtitle: 'Évolution stages',
      icon: 'pi pi-calendar',
      color: '#f59e0b',
      dataKey: 'pfpEnCours',
      breakdownKey: 'pfpTimeline',
      showChart: true,
      chartType: 'line',
      chartHeight: 200,
      animated: true,
      clickable: true,
      actionLabel: 'Détails',
      fetchFn: 'fetchPfpKpis',
      order: 4,
      visible: true,
      roles: ['admin', 'page1.access', 'EnseignantPhysio']
    }
  ],

  // ========================================
  // DASHBOARD ACADÉMIQUE
  // ========================================
  academique: [
    {
      id: 'teachers_count',
      label: 'Enseignants',
      subtitle: 'Corps enseignant',
      icon: 'pi pi-users',
      color: '#3b82f6',
      dataKey: 'enseignants',
      showChart: true,
      chartType: 'auto',
      enableChartSelector: true,
      chartHeight: 250,
      animated: true,
      clickable: true,
      actionLabel: 'Voir liste',
      fetchFn: 'fetchAcademiqueKpis',
      order: 1,
      visible: true,
      roles: ['admin', 'page2.access']
    },
    {
      id: 'courses_count',
      label: 'Cours',
      subtitle: 'Évolution programmation',
      icon: 'pi pi-book',
      color: '#8b5cf6',
      dataKey: 'cours',
      breakdownKey: 'coursesTimeline',
      showChart: true,
      chartType: 'line',
      chartHeight: 200,
      animated: true,
      clickable: true,
      actionLabel: 'Voir',
      fetchFn: 'fetchAcademiqueKpis',
      order: 2,
      visible: true,
      roles: ['admin', 'page2.access', 'EnseignantSoins']
    },
    {
      id: 'media_count',
      label: 'Média',
      subtitle: 'Vidéos ajoutées',
      icon: 'pi pi-video',
      color: '#10b981',
      dataKey: 'media',
      breakdownKey: 'mediaTimeline',
      showChart: true,
      chartType: 'line',
      chartHeight: 200,
      animated: true,
      clickable: true,
      actionLabel: 'Gérer',
      fetchFn: 'fetchAcademiqueKpis',
      order: 3,
      visible: true,
      roles: ['admin', 'page2.access', 'editor']
    },
    {
      id: 'modules_count',
      label: 'Modules',
      subtitle: 'Liste des modules',
      icon: 'pi pi-th-large',
      color: '#f59e0b',
      dataKey: 'modules',
      breakdownKey: 'modulesList',
      showChart: true,
      chartType: 'table',
      chartHeight: 250,
      animated: true,
      clickable: true,
      actionLabel: 'Voir',
      fetchFn: 'fetchAcademiqueKpis',
      order: 4,
      visible: true,
      roles: ['admin', 'page2.access']
    }
  ],

  // ========================================
  // DASHBOARD GAMIFICATION
  // ========================================
  gamification: [
    {
      id: 'challenges_active',
      label: 'Défis Actifs',
      subtitle: 'Évolution défis',
      icon: 'pi pi-trophy',
      color: '#f59e0b',
      dataKey: 'challengesActive',
      breakdownKey: 'challengesTimeline',
      showChart: true,
      chartType: 'line',
      chartHeight: 200,
      animated: true,
      clickable: true,
      actionLabel: 'Gérer',
      fetchFn: 'fetchGamificationKpis',
      order: 1,
      visible: true,
      roles: ['admin', 'AdminPhysio', 'EnseignantPhysio']
    },
    {
      id: 'quests_completed',
      label: 'Quêtes Complétées',
      subtitle: 'Total',
      icon: 'pi pi-flag',
      color: '#8b5cf6',
      dataKey: 'quests',
      showChart: true,
      chartType: 'auto',
      enableChartSelector: true,
      animated: true,
      clickable: true,
      actionLabel: 'Voir',
      fetchFn: 'fetchGamificationKpis',
      order: 2,
      visible: true,
      roles: ['admin', 'AdminPhysio']
    },
    {
      id: 'badges_total',
      label: 'Badges',
      subtitle: 'Liste des badges',
      icon: 'pi pi-star',
      color: '#10b981',
      dataKey: 'badges',
      breakdownKey: 'badgesList',
      showChart: true,
      chartType: 'table',
      chartHeight: 250,
      animated: true,
      clickable: true,
      actionLabel: 'Gérer',
      fetchFn: 'fetchGamificationKpis',
      order: 3,
      visible: true,
      roles: ['admin', 'AdminPhysio']
    },
    {
      id: 'users_active',
      label: 'Utilisateurs Actifs',
      subtitle: '7 derniers jours',
      icon: 'pi pi-users',
      color: '#3b82f6',
      dataKey: 'usersActive',
      showChart: true,
      chartType: 'auto',
      enableChartSelector: true,
      animated: true,
      clickable: true,
      actionLabel: 'Détails',
      fetchFn: 'fetchGamificationKpis',
      order: 4,
      visible: true,
      roles: ['admin', 'AdminPhysio', 'EnseignantPhysio']
    }
  ]
}

/**
 * Fonction helper pour filtrer les KPI selon les permissions de l'utilisateur
 * @param {string} dashboardType - Type de dashboard (general, pfp, academique, gamification)
 * @param {array} userPermissions - Liste des permissions de l'utilisateur
 * @param {boolean} isSuper - Si l'utilisateur est super admin
 * @returns {array} Liste des KPI filtrés et triés
 */
export function getKpisForRole(dashboardType, userPermissions = [], isSuper = false) {
  const config = kpiConfigurations[dashboardType] || []
  
  return config
    .filter(kpi => {
      // Si pas visible, ne pas afficher
      if (!kpi.visible) return false
      
      // Si super admin, tout afficher
      if (isSuper) return true
      
      // Si pas de restriction de rôles, afficher
      if (!kpi.roles || kpi.roles.length === 0) return true
      
      // Vérifier si l'utilisateur a au moins un des rôles requis
      return kpi.roles.some(role => userPermissions.includes(role))
    })
    .sort((a, b) => a.order - b.order)
}

/**
 * Obtenir la configuration d'un KPI spécifique
 * @param {string} dashboardType - Type de dashboard
 * @param {string} kpiId - ID du KPI
 * @returns {object|null} Configuration du KPI ou null
 */
export function getKpiConfig(dashboardType, kpiId) {
  const config = kpiConfigurations[dashboardType] || []
  return config.find(kpi => kpi.id === kpiId) || null
}

/**
 * Obtenir tous les fetchFn uniques pour un dashboard
 * Pour optimiser les appels API
 * @param {string} dashboardType - Type de dashboard
 * @returns {array} Liste des fetchFn uniques
 */
export function getUniqueFetchFns(dashboardType) {
  const config = kpiConfigurations[dashboardType] || []
  const fetchFns = config.map(kpi => kpi.fetchFn).filter(Boolean)
  return [...new Set(fetchFns)]
}
