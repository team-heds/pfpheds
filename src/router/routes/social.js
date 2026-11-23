// Pages remplacées par un écran mobile : chargées seulement quand elles s'affichent.
import { loadWhenShown } from '@/router/loadWhenShown'
// Routes social & communication
export default [
  { path: '/feed', component: loadWhenShown(() => import('@/views/social/FeedView.vue'), 'FeedView'), name: 'FeedView', props: true, meta: { requiresAuth: true } },
  { path: '/mention/:group', component: () => import('@/views/social/MentionView.vue'), name: 'MentionView', props: true, meta: { requiresAuth: true } },
  { path: '/hashtag/:hashtag', component: () => import('@/views/social/HashtagView.vue'), name: 'HashtagView', props: true, meta: { requiresAuth: true } },
  { path: '/communities', component: () => import('@/views/social/CommunitiesView.vue'), name: 'CommunitiesView', props: true, meta: { requiresAuth: true } },
  // Ancienne page Firebase : la fiche Supabase la remplace.
  { path: '/communities/:id', name: 'CommunityView', redirect: (to) => ({ name: 'CommunityInfoView', params: { id: to.params.id } }) },
  { path: '/communities/info/:id', component: () => import('@/views/social/CommunityInfoView.vue'), name: 'CommunityInfoView' },
]
