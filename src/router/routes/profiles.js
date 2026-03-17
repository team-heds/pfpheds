// Routes profils, utilisateurs & gamification
export default [
  { path: '/profile/:id', component: () => import('@/views/users/ProfileView.vue'), name: 'Profile', meta: { requiresAuth: true } },
  { path: '/profilAdmin/:id', component: () => import('@/views/admin/ProfileAdminView.vue'), name: 'ProfileAdmin', meta: { requiresAuth: true, need: ['admin', 'house_coach'] } },
  { path: '/settings', component: () => import('@/views/users/SettingsView.vue'), name: 'SettingView', meta: { requiresAuth: true } },
  { path: '/hes-house-quiz', component: () => import('@/views/users/HESHouseQuizView.vue'), name: 'HESHouseQuizView', meta: { requiresAuth: true } },
  { path: '/houses/:houseName/stats', component: () => import('@/components/gamification/HouseStatsPage.vue'), name: 'HouseStatsPage', props: true, meta: { requiresAuth: true } },
  { path: '/houses/ranking', component: () => import('@/components/gamification/HousesRankingPage.vue'), name: 'HousesRankingPage', meta: { requiresAuth: true } },
  { path: '/gamification-profile/:id', component: () => import('@/components/gamification/GamificationProfilePage.vue'), name: 'GamificationProfilePage', props: true, meta: { requiresAuth: true } },
  { path: '/achievements', component: () => import('@/components/gamification/AchievementsPage.vue'), name: 'AchievementsPage', meta: { requiresAuth: true } },
  { path: '/challenges', component: () => import('@/components/gamification/ChallengesPage.vue'), name: 'ChallengesPage', meta: { requiresAuth: true } },
  { path: '/quests', component: () => import('@/components/gamification/QuestsPage.vue'), name: 'QuestsPage', meta: { requiresAuth: true } },
  { path: '/diagnostic-gamification', component: () => import('@/views/DiagnosticGamificationView.vue'), name: 'DiagnosticGamificationView', meta: { requiresAuth: true } },
]
