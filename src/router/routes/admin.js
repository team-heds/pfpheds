import { modulePermissionGuard } from '@/router/guards/modulePermissionGuard'

// Routes dashboard & administration
export default [
  { path: '/admin', component: () => import('@/views/admin/DashboardView.vue'), name: 'DashboardView', meta: { requiresAuth: true, need: ['super.all', 'admin', 'AdminPhysio', 'EnseignantPhysio'] } },
  { path: '/admin/dashboard-general', component: () => import('@/components/admin/AdminDashboardGeneral.vue'), name: 'AdminDashboardGeneral', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/dashboard-rm', component: () => import('@/views/admin/DashboardRMView.vue'), name: 'DashboardRM', meta: { requiresAuth: true, need: ['admin', 'RMSoins'] } },
  { path: '/admin/soins-infirmiers/dashboard', component: () => import('@/views/admin/soins-infirmiers/DashboardSecretariatSI.vue'), name: 'DashboardSecretariatSI', meta: { requiresAuth: true, need: ['admin', 'RMSoins'] } },
  { path: '/admin/role-management', component: () => import('@/views/admin/RoleManagementView.vue'), name: 'RoleManagement', meta: { requiresAuth: true, need: ['super.all', 'admin'] } },
  { 
    path: '/admin/modules/:id/manage', 
    component: () => import('@/views/admin/modules/ModuleManageView.vue'), 
    name: 'ModuleManage', 
    meta: { requiresAuth: true, requiresModuleOwnership: true, need: ['admin', 'RMSoins'] },
    beforeEnter: modulePermissionGuard
  },
  { 
    path: '/admin/modules/:id/planning', 
    component: () => import('@/views/admin/modules/ModulePlanningView.vue'), 
    name: 'ModulePlanning', 
    meta: { requiresAuth: true, need: ['admin', 'RMSoins'] }
  },
  { path: '/admin/soins-infirmiers/dashboard-enseignant', component: () => import('@/views/admin/DashboardEnseignantView.vue'), name: 'DashboardEnseignantSI', meta: { requiresAuth: true, need: ['admin', 'EnseignantSoins', 'RMSoins'] } },
  { path: '/admin/dashboard-enseignant', component: () => import('@/views/admin/DashboardEnseignantView.vue'), name: 'DashboardEnseignant', meta: { requiresAuth: true, need: ['admin', 'EnseignantSoins', 'EnseignantPhysio'] } },
  { path: '/admin/teachers-assignment', component: () => import('@/views/admin/TeacherAssignmentView.vue'), name: 'TeacherAssignment', meta: { requiresAuth: true, need: ['admin', 'RMSoins', 'PlanificateurHoraires'] } },
  { path: '/admin/dashboard-pfp', component: () => import('@/components/admin/AdminDashboardPFP.vue'), name: 'AdminDashboardPFP', meta: { requiresAuth: true, need: ['super.all', 'admin', 'AdminPhysio'] } },
  { path: '/admin/dashboard-academique', component: () => import('@/components/admin/AdminDashboardAcademique.vue'), name: 'AdminDashboardAcademique', meta: { requiresAuth: true, need: ['super.all', 'admin', 'editor'] } },
  { path: '/admin/dashboard-gamification', component: () => import('@/components/admin/AdminDashboardGamification.vue'), name: 'AdminDashboardGamification', meta: { requiresAuth: true, need: ['super.all', 'admin', 'house_coach'] } },
  { path: '/admin/alerts', component: () => import('@/views/admin/AlertsDashboard.vue'), name: 'AlertsDashboard', meta: { requiresAuth: true, need: ['super.all', 'admin', 'AdminPhysio', 'EnseignantPhysio'] } },
  { path: '/admin/settings', component: () => import('@/views/admin/SettingsView.vue'), name: 'AdminSettingsView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/supabase-diagnostic', component: () => import('@/views/admin/SupabaseDiagnosticView.vue'), name: 'SupabaseDiagnosticView', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/defis', component: () => import('@/views/admin/institutions/gamification/AdminDefisView.vue'), name: 'AdminDefisView', meta: { requiresAuth: true, need: ['admin', 'house_coach'] } },
  { path: '/admin/security/rbac', component: () => import('@/views/admin/security/RBACAdminView.vue'), name: 'RBACAdmin', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/routes-editor', component: () => import('@/views/home/DynamicRoutesEditorView.vue'), name: 'DynamicRoutesEditor', meta: { requiresAuth: true, need: ['super.all', 'admin'] } },

  // Admin Lists
  { path: '/admin/programs', component: () => import('@/views/admin/lists/ProgramListView.vue'), name: 'ProgramList', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/modules', component: () => import('@/views/admin/lists/ModuleListView.vue'), name: 'ModuleList', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/user-roles', component: () => import('@/views/admin/lists/UserRoleListView.vue'), name: 'UserRoleList', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/teachers-si', component: () => import('@/views/admin/users/TeachersSIView.vue'), name: 'TeachersSIView', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/teachers-si/:teacherId', component: () => import('@/views/admin/users/TeacherSIProfileView.vue'), name: 'TeacherSIProfileView', meta: { requiresAuth: true, need: ['admin', 'RMSoins'] } },
  { path: '/admin/manage-user-roles', component: () => import('@/views/admin/users/ManageUserRoles.vue'), name: 'ManageUserRoles', meta: { requiresAuth: true, need: 'admin' } },

  // Planning académique
  { path: '/admin/planning', component: () => import('@/views/admin/planning/PlanningView.vue'), name: 'PlanningView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/planning/manage', component: () => import('@/views/admin/planning/PlanningAdminView.vue'), name: 'PlanningAdminView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/planning/years', component: () => import('@/views/admin/AcademicYearManagement.vue'), name: 'AcademicYearManagement', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/planning/weekly', component: () => import('@/views/admin/planning/WeeklyPlanningAdminView.vue'), name: 'WeeklyPlanningAdminView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/planning/semester', component: () => import('@/views/admin/planning/SemesterPlanningAdminView.vue'), name: 'SemesterPlanningAdminView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/planning/annual', component: () => import('@/views/admin/planning/AnnualPlanningView.vue'), name: 'AnnualPlanningView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/soins-infirmiers/planning-journalier', component: () => import('@/views/admin/soins-infirmiers/DailyPlanningView.vue'), name: 'DailyPlanningView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/soins-infirmiers/feuille-de-charges', component: () => import('@/views/admin/soins-infirmiers/WorkloadView.vue'), name: 'WorkloadView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/soins-infirmiers/cours-postulation', component: () => import('@/views/admin/soins-infirmiers/SIPostulationCoursesView.vue'), name: 'SIPostulationCoursesView', meta: { requiresAuth: true, need: ['authenticated', 'admin', 'RMSoins', 'EnseignantSoins'] } },

  // Gestion académique (Kanban & Contenu)
  { path: '/admin/academic/tickets', component: () => import('@/views/admin/academic/TicketListView.vue'), name: 'TicketListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/academic/kanban', component: () => import('@/views/admin/academic/AcademicKanbanView.vue'), name: 'AcademicKanbanView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/academic/calendar', component: () => import('@/views/admin/academic/AcademicCalendarView.vue'), name: 'AcademicCalendarView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/academic/video-library', component: () => import('@/views/admin/academic/VideoLibraryView.vue'), name: 'VideoLibraryView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/academic/media-content', redirect: '/admin/academic/video-library' },

  // Gestion des cours
  { path: '/admin/courses/list', component: () => import('@/views/admin/courses/CourseListView.vue'), name: 'CourseListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/courses/create', component: () => import('@/views/admin/courses/CourseCreateView.vue'), name: 'CourseCreateView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/courses/:id', component: () => import('@/views/admin/courses/CourseDetailView.vue'), name: 'CourseDetailView', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/courses/:id/edit', component: () => import('@/views/admin/courses/CourseEditView.vue'), name: 'CourseEditView', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },

  // Outils admin
  { path: '/admin/tools/feedbacka', component: () => import('@/views/admin/tools/FeedbackaView.vue'), name: 'FeedbackaView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/tools/feedbacka/list', component: () => import('@/views/admin/tools/FeedbackaListView.vue'), name: 'FeedbackaListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/tools/feedbacka/create', component: () => import('@/views/admin/tools/FeedbackaCreateView.vue'), name: 'FeedbackaCreateView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/tools/feedbacka/:id/edit', component: () => import('@/views/admin/tools/FeedbackaEditView.vue'), name: 'FeedbackaEditView', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },

  // Gamification admin
  { path: '/admin/gamification/challenges', component: () => import('@/views/admin/gamification/ChallengeManagementView.vue'), name: 'AdminChallengeManagement', meta: { requiresAuth: true, need: ['super.all', 'admin', 'AdminPhysio', 'EnseignantPhysio'] } },
  { path: '/admin/gamification/quests', component: () => import('@/views/admin/gamification/QuestManagementView.vue'), name: 'AdminQuestManagement', meta: { requiresAuth: true, need: ['super.all', 'admin', 'AdminPhysio', 'EnseignantPhysio'] } },
  { path: '/admin/gamification/badges', component: () => import('@/views/admin/gamification/BadgeManagementView.vue'), name: 'BadgeManagementView', meta: { requiresAuth: true, need: ['super.all', 'admin', 'AdminPhysio', 'EnseignantPhysio'] } },
  { path: '/admin/gamification/users', component: () => import('@/views/admin/gamification/UserManagementView.vue'), name: 'UserManagementView', meta: { requiresAuth: true, need: ['super.all', 'admin', 'AdminPhysio', 'EnseignantPhysio'] } },
  { path: '/admin/gamification/houses', component: () => import('@/views/admin/gamification/HouseManagementView.vue'), name: 'HouseManagementView', meta: { requiresAuth: true, need: ['super.all', 'admin', 'AdminPhysio', 'EnseignantPhysio'] } },
  { path: '/admin/gamification/analytics', component: () => import('@/views/admin/gamification/AnalyticsDashboardView.vue'), name: 'AnalyticsDashboardView', meta: { requiresAuth: true, need: ['super.all', 'admin', 'AdminPhysio', 'EnseignantPhysio'] } },

  // Gamification création (public)
  { path: '/create-challenge', component: () => import('@/views/admin/gamification/ChallengeManagementView.vue'), name: 'CreateChallenge', meta: { requiresAuth: true, need: ['super.all', 'admin', 'house_coach'] } },
  { path: '/create-quest', component: () => import('@/views/admin/gamification/QuestManagementView.vue'), name: 'CreateQuest', meta: { requiresAuth: true, need: ['super.all', 'admin', 'house_coach'] } },
]
