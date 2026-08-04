// Routes applications, outils, mobile & spéciales
export default [
  // Applications & outils
  { path: '/tasklist', component: () => import('@/views/apps/tasklist/Index.vue'), name: 'Index', meta: { requiresAuth: true, need: ['editor', 'admin'] } },
  { path: '/chat', component: () => import('@/views/apps/chat/IndexChat.vue'), name: 'IndexChat', meta: { requiresAuth: true } },
  { path: '/files', component: () => import('@/views/apps/files/FilesView.vue'), name: 'FilesView', meta: { requiresAuth: true } },
  { path: '/mail', component: () => import('@/views/apps/mail/Index.vue'), name: 'MailIndex', meta: { requiresAuth: true } },
  { path: '/notes', component: () => import('@/views/apps/notes/NotesWorkspaceView.vue'), name: 'NotesWorkspaceView', meta: { requiresAuth: true } },
  { path: '/events', component: () => import('@/views/apps/events/EventManagementView.vue'), name: 'EventManagementView', meta: { requiresAuth: true } },
  { path: '/event-management', component: () => import('@/views/apps/events/EventManagementView.vue'), name: 'EventManagement', meta: { requiresAuth: true } },
  { path: '/tools', component: () => import('@/views/apps/tools/ToolsView.vue'), name: 'ToolsView', meta: { requiresAuth: true } },
  { path: '/tools/formations', component: () => import('@/views/apps/tools/AdminTrainingHubView.vue'), name: 'AdminTrainingHub', meta: { requiresAuth: true, need: ['admin'] } },
  { path: '/tools/formations/:slug', component: () => import('@/views/apps/tools/AdminTrainingDetailView.vue'), name: 'AdminTrainingDetail', meta: { requiresAuth: true, need: ['admin'] } },
  { path: '/tools/ftp-upload', component: () => import('@/views/apps/tools/FTPUploadTestView.vue'), name: 'FTPUploadTest', meta: { requiresAuth: true, need: ['super.all', 'admin'] } },
  { path: '/game', component: () => import('@/views/apps/tools/GameView.vue'), name: 'GameView', meta: { requiresAuth: true } },
  { path: '/rom-runner', component: () => import('@/views/apps/rom-runner/RomRunnerView.vue'), name: 'RomRunnerView', meta: { requiresAuth: true } },
  { path: '/chatbot', component: () => import('@/views/apps/tools/ChatBotView.vue'), name: 'ChatBotView', meta: { requiresAuth: true } },
  { path: '/tournois', component: () => import('@/views/apps/tools/TournoisView.vue'), name: 'TournoisView', meta: { requiresAuth: true } },
  { path: '/tournois/:id', component: () => import('@/views/apps/tools/TournoiDetailsView.vue'), name: 'TournoiDetailsView', meta: { requiresAuth: true } },
  { path: '/mobile-tools', component: () => import('@/views/apps/tools/MobileToolsView.vue'), name: 'MobileToolsView', meta: { requiresAuth: true } },
  { path: '/mobile-lang-apps', component: () => import('@/views/apps/tools/MobileLangAppsView.vue'), name: 'MobileLangApps', meta: { mobileOnly: true } },
  { path: '/supabase-demo', component: () => import('@/views/pages/Supabase.vue'), name: 'SupabaseDemo', meta: { requiresAuth: true, need: ['super.all', 'admin'] } },
  { path: '/care-convers', component: () => import('@/views/pages/CareConvers.vue'), name: 'CareConvers', meta: { requiresAuth: true } },

  // Capsules insuffisance rénale
  { path: '/capsules-insuffisance-renale', component: () => import('@/views/capsulesInsuffiance/CapsulesInsuffisanceRenaleTableDesMatieresView.vue'), name: 'CapsulesInsuffisanceRenale', meta: { requiresAuth: true } },
  { path: '/capsules-insuffisance-renale/introduction', component: () => import('@/views/capsulesInsuffiance/CapsulesInsuffisanceRenaleIntroductionView.vue'), name: 'CapsulesInsuffisanceRenaleIntroduction', meta: { requiresAuth: true } },
  { path: '/capsules-insuffisance-renale/anatomie-physiologie', component: () => import('@/views/capsulesInsuffiance/CapsulesInsuffisanceRenaleAnatomiePhysiologieView.vue'), name: 'CapsulesInsuffisanceRenaleAnatomiePhysiologie', meta: { requiresAuth: true } },
  { path: '/capsules-insuffisance-renale/comprendre-ira-irc', component: () => import('@/views/capsulesInsuffiance/CapsulesInsuffisanceRenaleComprendreIraIrcView.vue'), name: 'CapsulesInsuffisanceRenaleComprendreIraIrc', meta: { requiresAuth: true } },
  { path: '/capsules-insuffisance-renale/chatbot', component: () => import('@/views/capsulesInsuffiance/CapsulesInsuffisanceRenaleChatbotView.vue'), name: 'CapsulesInsuffisanceRenaleChatbot', meta: { requiresAuth: true } },
  { path: '/capsules-insuffisance-renale/activites-ira', component: () => import('@/views/capsulesInsuffiance/CapsulesInsuffisanceRenaleActivitesIraView.vue'), name: 'CapsulesInsuffisanceRenaleActivitesIra', meta: { requiresAuth: true } },
  { path: '/capsules-insuffisance-renale/activite-irc', component: () => import('@/views/capsulesInsuffiance/CapsulesInsuffisanceRenaleActiviteIrcView.vue'), name: 'CapsulesInsuffisanceRenaleActiviteIrc', meta: { requiresAuth: true } },
  { path: '/capsules-insuffisance-renale/validation-acquis-ira', component: () => import('@/views/capsulesInsuffiance/CapsulesInsuffisanceRenaleValidationAcquisIraView.vue'), name: 'CapsulesInsuffisanceRenaleValidationAcquisIra', meta: { requiresAuth: true } },
  { path: '/capsules-insuffisance-renale/validation-acquis-irc', component: () => import('@/views/capsulesInsuffiance/CapsulesInsuffisanceRenaleValidationAcquisIrcView.vue'), name: 'CapsulesInsuffisanceRenaleValidationAcquisIrc', meta: { requiresAuth: true } },
  { path: '/capsules-insuffisance-renale/synthese', component: () => import('@/views/capsulesInsuffiance/CapsulesInsuffisanceRenaleSyntheseView.vue'), name: 'CapsulesInsuffisanceRenaleSynthese', meta: { requiresAuth: true } },
  { path: '/capsules-insuffisance-renale/qcm-evaluatif', component: () => import('@/views/capsulesInsuffiance/CapsulesInsuffisanceRenaleQcmEvaluatifView.vue'), name: 'CapsulesInsuffisanceRenaleQcmEvaluatif', meta: { requiresAuth: true } },

  // Mobile spécifique
  { path: '/create', component: () => import('@/components/social/library/CreateContentMobile.vue'), name: 'CreateContentMobile', meta: { mobileOnly: true } },
  { path: '/mobile-outils', component: () => import('@/views/apps/tools/MobileToolsView.vue'), name: 'MobileToolsView', meta: { mobileOnly: true } },
  { path: '/list', component: () => import('@/components/media/audio/ListComponent.vue'), name: 'ListComponent', meta: { requiresAuth: true, requiredRole: ['editor', 'admin'] } },

  // Routes spéciales
  { path: '/ventriglisse3d', component: () => import('@/components/games/Ventriglisse3D.vue'), name: 'Ventriglisse3D', meta: { requiresAuth: false } },
  { path: '/qr', component: () => import('@/components/ui/QrCodeGenerator.vue'), name: 'QRCodePage', meta: { requiresAuth: false } },
  { path: '/outils', component: () => import('@/views/apps/tools/ToolsView.vue'), name: 'ToolsView', meta: { requiresAuth: true } },
  { path: '/outils/formations', component: () => import('@/views/apps/tools/AdminTrainingHubView.vue'), name: 'AdminTrainingHubFr', meta: { requiresAuth: true, need: ['admin'] } },
  { path: '/outils/formations/:slug', component: () => import('@/views/apps/tools/AdminTrainingDetailView.vue'), name: 'AdminTrainingDetailFr', meta: { requiresAuth: true, need: ['admin'] } },
  { path: '/chatbotsi', component: () => import('@/views/apps/tools/ChatBotView.vue'), name: 'ChatBotSI', meta: { requiresAuth: true, requiredRole: ['admin', 'chatbotSi'] } },

  // Catch-all
  { path: '/:pathMatch(.*)*', component: () => import('@/components/common/utils/Error404.vue'), name: 'Error404' }
]
