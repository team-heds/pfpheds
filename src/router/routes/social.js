// Pages remplacées par un écran mobile : chargées seulement quand elles s'affichent.
import { loadWhenShown } from '@/router/loadWhenShown'
// Routes social & communication
export default [
  { path: '/feed', component: loadWhenShown(() => import('@/views/social/FeedView.vue'), 'FeedView'), name: 'FeedView', props: true, meta: { requiresAuth: true } },
  { path: '/mention/:group', component: () => import('@/views/social/MentionView.vue'), name: 'MentionView', props: true, meta: { requiresAuth: true } },
  { path: '/hashtag/:hashtag', redirect: '/feed' },
  { path: '/communities', component: () => import('@/views/social/CommunitiesView.vue'), name: 'CommunitiesView', props: true, meta: { requiresAuth: true } },
  { path: '/communities/:id', component: () => import('@/views/social/CommunityView.vue'), name: 'CommunityView', props: true },
  { path: '/communities/info/:id', component: () => import('@/views/social/CommunityInfoView.vue'), name: 'CommunityInfoView' },
]
