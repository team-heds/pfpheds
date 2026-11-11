import { defineStore } from 'pinia'
import { supabase } from '@/supabase.js'
import { fetchActiveStories, groupStoriesByAuthor, markStoryViewed } from '@/service/storiesService'

/** Stories affichées en haut de l'accueil mobile (mêmes services que l'ordinateur). */
export const useMobileStoriesStore = defineStore('mobileStories', {
  state: () => ({
    stories: [],
    userId: null,
    ownAvatarUrl: null,
    avatarUserId: null,
    loaded: false,
    error: '',
  }),
  getters: {
    groups: (state) => groupStoriesByAuthor(state.stories, state.userId),
  },
  actions: {
    async load(userId) {
      this.userId = userId || null
      if (!this.userId) return
      try {
        this.stories = await fetchActiveStories()
        this.error = ''
      } catch (error) {
        console.error('[Stories] Chargement impossible:', error)
        this.error = this.stories.length ? '' : 'Stories indisponibles pour le moment.'
      } finally {
        this.loaded = true
      }
    },
    async loadOwnAvatar(userId) {
      if (!userId || (this.avatarUserId === userId && this.ownAvatarUrl)) return
      this.avatarUserId = userId
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .eq('user_id', userId)
          .maybeSingle()
        this.ownAvatarUrl = data?.avatar_url || null
      } catch (error) {
        console.warn('[Stories] Photo de profil indisponible:', error)
      }
    },
    async markViewed(story) {
      if (!story || story.seen || story.user_id === this.userId) return
      // Marquer tout de suite à l'écran ; l'enregistrement suit.
      const target = this.stories.find((item) => item.id === story.id)
      if (target) target.seen = true
      try {
        await markStoryViewed(story.id)
      } catch (error) {
        console.warn('[Stories] Vue non enregistrée:', error)
      }
    },
    remove(storyId) {
      this.stories = this.stories.filter((story) => story.id !== storyId)
    },
  },
})
