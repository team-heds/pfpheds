// Routes votations & gestion des places
export default [
  // Votations
  {
    path: '/votation/:pfpType',
    component: () => import('@/views/admin/votations/VotationGenericView.vue'),
    name: 'VotationGeneric',
    meta: { requiresAuth: true },
    props: true
  },
  { path: '/votation', component: () => import('@/views/admin/votations/VotationGenericView.vue'), name: 'VotationView', meta: { requiresAuth: true } },
  { path: '/votation_pfp1b', component: () => import('@/views/admin/votations/VotationGenericView.vue'), name: 'VotationViewPFP1B', meta: { requiresAuth: true } },
  { path: '/votation_preview', component: () => import('@/components/admin/details/Votation_preview.vue'), name: 'VotationPreview', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/votation_prioritaire', component: () => import('@/components/admin/details/VotationPrioritaire.vue'), name: 'VotationPrioritaire', meta: { requiresAuth: true, need: 'prioritaire' } },
  { path: '/votation_management', component: () => import('@/views/admin/votations/VotationManagementView.vue'), name: 'VotationManagementView', meta: { requiresAuth: true, need: 'admin' } },

  // Gestion des places & stages
  { path: '/management_places_safe', component: () => import('@/components/admin/details/ManagementPlacesSafe.vue'), name: 'ManagementPlacesSafe', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/places_assignment', component: () => import('@/views/admin/places/PlaceAssignmentView.vue'), name: 'PlaceAssignmentView', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/places_assigned', component: () => import('@/views/admin/pfp/PlacesAssignedView.vue'), name: 'PlacesAssigned', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/stage_repartition', component: () => import('@/components/admin/details/StageRepartitionBA2.vue'), name: 'StageRepartitionBA2', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/management_pfpencours2', component: () => import('@/components/admin/details/ManagementPFPEnCours.vue'), name: 'ManagementPFPEnCours', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/historique_pfp', component: () => import('@/views/home/HistoryView.vue'), name: 'HistoriquePFP', meta: { requiresAuth: true } },
  { path: '/documents', component: () => import('@/views/home/DocumentsView.vue'), name: 'DocumentsPFP', meta: { requiresAuth: true } },


  // Validation & réception
  { path: '/validation', component: () => import('@/views/admin/validation/ValidationView.vue'), name: 'ValidationView', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/reception', component: () => import('@/views/admin/validation/ReceptionView.vue'), name: 'ReceptionView', meta: { requiresAuth: true, need: 'admin' } },

  // Statistiques & résultats
  { path: '/stats_place_pfp', component: () => import('@/views/admin/places/PlaceStatsView.vue'), name: 'PlaceStatsView', meta: { requiresAuth: true, need: 'admin' } },
]
