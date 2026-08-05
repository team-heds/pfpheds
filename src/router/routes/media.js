// Routes média & multimédia
export default [
  { path: '/media', component: () => import('@/views/media/MediaHubPage.vue'), name: 'MediaHubPage', meta: { requiresAuth: true } },
  { path: '/modules', component: () => import('@/views/media/ModulesPage.vue'), name: 'ModulesPage', meta: { requiresAuth: true } },
  { path: '/modules/:moduleId/videos', component: () => import('@/views/media/ModuleVideosPage.vue'), name: 'ModuleVideosPage', props: true, meta: { requiresAuth: true } },
  { path: '/videos/:videoId/validation', component: () => import('@/views/media/VideoValidationPage.vue'), name: 'VideoValidationPage', props: true, meta: { requiresAuth: true } },
  { path: '/admin/modules', component: () => import('@/views/admin/ModuleAdminPage.vue'), name: 'ModuleAdminPage', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/modules/simple', component: () => import('@/views/admin/ModuleAdminPageSimple.vue'), name: 'ModuleAdminPageSimple', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/vimeo-test', component: () => import('@/views/media/VimeoTestPage.vue'), name: 'VimeoTestPage', meta: { requiresAuth: true, need: ['super.all', 'admin'] } },
]
