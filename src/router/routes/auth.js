// Routes d'authentification & accueil
export default [
  { path: '/', component: () => import('@/views/auth/LoginHome.vue'), name: 'LoginHome', props: true },
  { path: '/home', component: () => import('@/views/auth/LoginHome.vue'), name: 'LoginHome', props: true },
  { path: '/new-password', redirect: to => ({ path: '/reset-password', query: to.query, hash: to.hash }) },
  { path: '/login', redirect: '/home' },
  { path: '/register', component: () => import('@/views/auth/RegisterView.vue'), name: 'RegisterView' },
  { path: '/reset-password', component: () => import('@/views/pages/ResetPassword.vue'), name: 'ResetPassword', meta: { requiresAuth: false } },
  { path: '/verification', component: () => import('@/views/auth/VerificationView.vue'), name: 'VerificationView' },
  { path: '/lock-screen', component: () => import('@/views/auth/LockScreenView.vue'), name: 'LockScreenView' },
  { path: '/access', component: () => import('@/views/auth/AccessView.vue'), name: 'AccessView' },
  { path: '/auth-error', component: () => import('@/views/auth/AuthErrorView.vue'), name: 'AuthErrorView' },
]
