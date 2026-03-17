// Routes social & communication
export default [
  { path: '/feed', component: () => import('@/views/social/FeedView.vue'), name: 'FeedView', props: true, meta: { requiresAuth: true } },
  { path: '/mention/:group', component: () => import('@/views/social/MentionView.vue'), name: 'MentionView', props: true, meta: { requiresAuth: true } },
  { path: '/hashtag/:hashtag', component: () => import('@/views/social/HashtagView.vue'), name: 'HashtagView', props: true, meta: { requiresAuth: true } },
  { path: '/communities', component: () => import('@/views/social/CommunitiesView.vue'), name: 'CommunitiesView', props: true, meta: { requiresAuth: true } },
  { path: '/communities/:id', component: () => import('@/views/social/CommunityView.vue'), name: 'CommunityView', props: true },
  { path: '/communities/info/:id', component: () => import('@/views/social/CommunityInfoView.vue'), name: 'CommunityInfoView' },
]
