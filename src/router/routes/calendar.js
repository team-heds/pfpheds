// Routes planning / calendrier
export default [
  { path: '/home-calendar', component: () => import('@/views/planning/HomePlanning.vue'), name: 'HomeCalendar', meta: { requiresAuth: false } },
  { path: '/calendar', component: () => import('@/views/planning/HomePlanning.vue'), name: 'CalendarHome', meta: { requiresAuth: false } },
  { path: '/calendar/home', component: () => import('@/views/planning/HomePlanning.vue'), name: 'CalendarHomeAlias', meta: { requiresAuth: false } },
  { path: '/calendar/full', component: () => import('@/views/planning/CalendrierFormationPlein.vue'), name: 'CalendrierFormationPlein', meta: { requiresAuth: false } },
  { path: '/calendar/full/edit', component: () => import('@/views/planning/CalendrierFormationPleinEdit.vue'), name: 'CalendrierFormationPleinEdit', meta: { requiresAuth: false } },
  { path: '/calendar/admin', component: () => import('@/views/planning/CalendrierFormationPleinEdit.vue'), name: 'CalendarAdmin', meta: { requiresAuth: false } },
  { path: '/calendar/semester', component: () => import('@/views/planning/CalendrierSemestriel.vue'), name: 'CalendrierSemestriel', meta: { requiresAuth: false } },
  { path: '/calendar/module', component: () => import('@/views/planning/CalendrierModule.vue'), name: 'CalendrierModule', meta: { requiresAuth: false } },
  { path: '/calendar/module/:moduleId/edit', component: () => import('@/views/planning/CalendrierModuleEdit.vue'), name: 'CalendrierModuleEdit', props: true, meta: { requiresAuth: false } },
  { path: '/calendar/teacher', component: () => import('@/views/planning/CalendrierEnseignant.vue'), name: 'CalendrierEnseignant', meta: { requiresAuth: false } },
  { path: '/calendar/my-courses', component: () => import('@/views/planning/CalendarMyCourses.vue'), name: 'CalendarMyCourses', meta: { requiresAuth: false } },
  { path: '/calendar/my-modules', component: () => import('@/views/planning/CalendarMyModules.vue'), name: 'CalendarMyModules', meta: { requiresAuth: false } },
  { path: '/calendar/modules', component: () => import('@/views/planning/CalendarModulesList.vue'), name: 'CalendarModulesList', meta: { requiresAuth: false } },
  { path: '/calendar/module/:moduleId', component: () => import('@/views/planning/CalendarModuleView.vue'), name: 'CalendarModuleView', props: true, meta: { requiresAuth: false } },
  { path: '/calendar/course/:courseId', component: () => import('@/views/planning/CalendarCourseView.vue'), name: 'CalendarCourseView', props: true, meta: { requiresAuth: false } },
]
