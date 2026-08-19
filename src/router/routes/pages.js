// Routes pages principales & navigation
export default [
  { path: '/map', component: () => import('@/views/home/MapView.vue'), name: 'Map', meta: { requiresAuth: true } },
  { path: '/institution', component: () => import('@/views/institutions/Institution.vue'), name: 'Institution', meta: { requiresAuth: true } },
  { path: '/place', component: () => import('@/views/institutions/PlaceListView.vue'), name: 'Place', meta: { requiresAuth: true } },
  { path: '/faq', component: () => import('@/views/home/FaqView.vue'), name: 'Faq', meta: { requiresAuth: true } },
  { path: '/terms_of_use', component: () => import('@/views/home/TermsView.vue'), name: 'TermsOfUse', meta: { requiresAuth: true } },
  { path: '/info_externe', component: () => import('@/views/home/InfoExterneView.vue'), name: 'InfoExterne', meta: { requiresAuth: true } },
  { path: '/history', component: () => import('@/views/home/HistoryView.vue'), name: 'HistoriquePFP', meta: { requiresAuth: true } },
  {
    path: '/documents_pfp',
    alias: ['/documents', '/document_pfp'],
    component: () => import('@/views/home/DocumentsView.vue'),
    name: 'DocumentsPFP',
    meta: { requiresAuth: true }
  },
  { path: '/push', component: () => import('@/views/home/PushView.vue'), name: 'PushView', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/push2', component: () => import('@/views/home/PushView.vue'), name: 'PushView2', meta: { requiresAuth: true, need: 'page2.access' } },
  { path: '/role-management', component: () => import('@/views/home/RoleManagement.vue'), name: 'RoleManagement', meta: { requiresAuth: true } },
  { path: '/router-inspector', component: () => import('@/views/home/RouterView.vue'), name: 'RouterInspector', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/permissions', component: () => import('@/views/home/PermissionsView.vue'), name: 'PermissionsView', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/feedbacka/:id', component: () => import('@/views/pages/FeedbackaStudentView.vue'), name: 'FeedbackaStudentView', props: true, meta: { requiresAuth: true } },
  { path: '/alpinphysio', component: () => import('@/views/associations/AlpinPhysioView.vue'), name: 'AlpinPhysio', meta: { requiresAuth: false } },
  { path: '/docs/primevue', component: () => import('@/views/documentation/PrimeVueDocsView.vue'), name: 'PrimeVueDocs', meta: { requiresAuth: true, need: ['admin'] } },
]
