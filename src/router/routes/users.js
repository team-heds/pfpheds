// Routes gestion utilisateurs, formulaires, institutions & détails
export default [
  // Listes utilisateurs
  { path: '/user_list', component: () => import('@/views/admin/users/UserListView.vue'), name: 'UserListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/etudiant_list', component: () => import('@/views/admin/users/StudentListView.vue'), name: 'StudentListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/etudiant_stats', component: () => import('@/views/admin/users/StudentStatsView.vue'), name: 'StudentStatsView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/enseignent_list', component: () => import('@/views/admin/users/TeacherListView.vue'), name: 'TeacherListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/praticien_formateur_list', component: () => import('@/views/admin/users/TrainerListView.vue'), name: 'TrainerListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/institution_list', component: () => import('@/views/admin/institutions/InstitutionListView.vue'), name: 'InstitutionListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },

  // Formulaires de création/modification
  { path: '/new_user_form', component: () => import('@/components/admin/forms/NewUserForm.vue'), name: 'NewUserForm', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/new_user_form_modif/:userId', component: () => import('@/components/admin/forms/NewUserFormModif.vue'), name: 'NewUserFormModif', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/etudiant_form', component: () => import('@/components/admin/forms/EtudiantForm.vue'), name: 'EtudiantForm', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/etudiant/:etuId/modif', component: () => import('@/components/admin/forms/EtudiantFormModif.vue'), name: 'EtudiantFormModif', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/enseignent_form', component: () => import('@/components/admin/forms/EnseignentForm.vue'), name: 'EnseignentForm', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/enseignent_form_modif/:enseignantId', component: () => import('@/components/admin/forms/EnseignentFormModif.vue'), name: 'EnseignentFormModif', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/praticien_formateur_form', component: () => import('@/components/admin/forms/PraticienFormateurForm.vue'), name: 'PraticienFormateurForm', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/praticien_formateur_form_modif/:praticienFormateurId', component: () => import('@/components/admin/forms/PraticienFormateurFormModif.vue'), name: 'PraticienFormateurFormModif', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/institution_form', component: () => import('@/components/admin/forms/InstitutionForm.vue'), name: 'InstitutionForm', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/institution_form_modif/:id', component: () => import('@/components/admin/forms/InstitutionFormModif.vue'), name: 'InstitutionFormModif', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/affectation_stage_etudiant', component: () => import('@/components/admin/forms/AffectationStageEtudiant.vue'), name: 'AffectationStageEtudiant', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/affectation_stage_etudiant_ba24', component: () => import('@/components/admin/forms/AffectationStageEtudiantBA24.vue'), name: 'AffectationStageEtudiantBA24', meta: { requiresAuth: true, need: ['admin', 'editor'] } },

  // Institutions & détails
  { path: '/institution/:id', component: () => import('@/views/institutions/InstitutionView.vue'), name: 'InstitutionView', props: true, meta: { requiresAuth: true } },
  { path: '/institution_details/:id', component: () => import('@/views/admin/institutions/InstitutionDetailsView.vue'), name: 'InstitutionDetails', props: true, meta: { requiresAuth: true } },
  { path: '/etudiant/:id/details', component: () => import('@/components/admin/details/EtudiantDetails.vue'), name: 'EtudiantDetails', props: true, meta: { requiresAuth: true } },
  { path: '/place_details', component: () => import('@/components/admin/details/PlaceDetails.vue'), name: 'place-details', meta: { requiresAuth: true } },
  { path: '/pfp_details', component: () => import('@/components/admin/details/PFPDetails.vue'), name: 'pfp-details', meta: { requiresAuth: true } },
]
