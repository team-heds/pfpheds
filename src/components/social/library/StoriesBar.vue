<template>
  <section class="stories-bar" aria-label="Stories">
    <div class="stories-track">
      <button type="button" class="story-chip" @click="handleAddStoryClick">
        <span class="story-ring story-ring--add" aria-hidden="true">
          <img :src="ownAvatar" alt="" class="story-avatar" />
          <span class="story-plus"><i class="pi pi-plus"></i></span>
        </span>
        <span class="story-name">Votre story</span>
      </button>

      <button
        v-for="group in groups"
        :key="group.userId"
        type="button"
        class="story-chip"
        :aria-label="`Voir ${group.stories.length > 1 ? `les ${group.stories.length} stories` : 'la story'} de ${group.isOwn ? 'vous' : group.displayName}${group.hasUnseen ? ', non vue' : ''}`"
        @click="openGroup(group)"
      >
        <span class="story-ring" :class="{ 'story-ring--unseen': group.hasUnseen, 'story-ring--own': group.isOwn }" aria-hidden="true">
          <img :src="group.avatarUrl || defaultAvatar" alt="" class="story-avatar" loading="lazy" />
        </span>
        <span class="story-name">{{ group.isOwn ? 'Vous' : firstName(group.displayName) }}</span>
      </button>

      <p v-if="loadError" class="stories-error" role="status">{{ loadError }}</p>
    </div>

    <Dialog
      v-if="!isMobile"
      v-model:visible="showAddStory"
      modal
      header="Nouvelle story"
      :style="{ width: '34rem' }"
      :breakpoints="{ '960px': '80vw', '640px': '95vw' }"
    >
      <AddStoryCore @uploaded="onUploaded" />
    </Dialog>

    <StoryModal
      v-if="openedGroup"
      :stories="openedGroup.stories"
      :start-index="openedIndex"
      :author-name="openedGroup.isOwn ? 'Vous' : openedGroup.displayName"
      :author-avatar="openedGroup.avatarUrl || defaultAvatar"
      :is-own="openedGroup.isOwn"
      @viewed="onViewed"
      @deleted="onDeleted"
      @close="closeGroup"
    />
  </section>
</template>

<script>
import AddStoryCore from './AddStoryCore.vue';
import StoryModal from './StoryModal.vue';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/supabase.js';
import { fetchActiveStories, firstUnseenIndex, groupStoriesByAuthor, markStoryViewed } from '@/service/storiesService';

const defaultAvatar = new URL('@/assets/avatar/avatar1.jpg', import.meta.url).href;
const REFRESH_MS = 5 * 60 * 1000;

export default {
  name: 'StoriesBar',
  components: { AddStoryCore, StoryModal },
  data() {
    return {
      stories: [],
      currentUserId: null,
      ownAvatarUrl: null,
      showAddStory: false,
      openedUserId: null,
      openedIndex: 0,
      loadError: '',
      defaultAvatar,
      isMobile: window.innerWidth <= 768,
      refreshTimer: null
    };
  },
  computed: {
    groups() {
      return groupStoriesByAuthor(this.stories, this.currentUserId);
    },
    openedGroup() {
      return this.groups.find((g) => g.userId === this.openedUserId) || null;
    },
    ownAvatar() {
      return this.ownAvatarUrl || defaultAvatar;
    }
  },
  async mounted() {
    window.addEventListener('resize', this.checkMobile);
    const authStore = useAuthStore();
    if (!authStore.user) await authStore.checkAuthState?.();
    const userId = authStore.user?.id;
    this.currentUserId = userId && userId !== 'guest-user' ? userId : null;
    if (!this.currentUserId) return;
    this.loadOwnAvatar();
    await this.fetchStories();
    this.refreshTimer = setInterval(() => {
      if (!this.openedUserId && document.visibilityState === 'visible') this.fetchStories();
    }, REFRESH_MS);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
    clearInterval(this.refreshTimer);
  },
  methods: {
    firstName(name) {
      const clean = String(name || '').split('@')[0].trim();
      return clean.split(/\s+/)[0] || 'Utilisateur';
    },
    async loadOwnAvatar() {
      const { data } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('user_id', this.currentUserId)
        .maybeSingle();
      this.ownAvatarUrl = data?.avatar_url || null;
    },
    async fetchStories() {
      try {
        this.stories = await fetchActiveStories();
        this.loadError = '';
      } catch (e) {
        console.error('[Stories] Chargement impossible:', e);
        this.loadError = this.stories.length ? '' : 'Stories indisponibles pour le moment.';
      }
    },
    openGroup(group) {
      this.openedIndex = firstUnseenIndex(group);
      this.openedUserId = group.userId;
    },
    closeGroup() {
      this.openedUserId = null;
    },
    async onViewed(story) {
      if (story.seen || story.user_id === this.currentUserId) return;
      // Marquer tout de suite à l'écran ; l'enregistrement suit.
      story.seen = true;
      try {
        await markStoryViewed(story.id);
      } catch (e) {
        console.warn('[Stories] Vue non enregistrée:', e);
      }
    },
    onDeleted(storyId) {
      this.stories = this.stories.filter((s) => s.id !== storyId);
      if (!this.openedGroup) this.closeGroup();
    },
    onUploaded() {
      this.showAddStory = false;
      this.fetchStories();
    },
    checkMobile() {
      this.isMobile = window.innerWidth <= 768;
    },
    handleAddStoryClick() {
      if (this.isMobile) this.$router.push({ path: '/create', query: { tab: 'story' } });
      else this.showAddStory = true;
    }
  }
};
</script>

<style scoped>
.stories-bar {
  width: 100%;
  min-width: 0;
}

.stories-track {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  padding: 0.75rem 1rem 0.65rem;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.stories-track::-webkit-scrollbar {
  display: none;
}

.story-chip {
  flex: 0 0 auto;
  width: 4.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-color);
  font: inherit;
  cursor: pointer;
  scroll-snap-align: start;
  -webkit-tap-highlight-color: transparent;
}

.story-chip:focus-visible {
  outline: 3px solid var(--primary-color);
  outline-offset: 3px;
  border-radius: 0.75rem;
}

.story-ring {
  position: relative;
  display: grid;
  place-items: center;
  width: 4.25rem;
  height: 4.25rem;
  border-radius: 50%;
  padding: 3px;
  background: var(--surface-border);
  transition: transform 0.15s ease;
}

.story-chip:active .story-ring {
  transform: scale(0.94);
}

.story-ring--unseen {
  background: linear-gradient(135deg, #f3c300 0%, #d49f3f 45%, var(--primary-color) 100%);
}

.story-ring--add {
  background: transparent;
}

.story-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--surface-card, #fff);
  background: var(--surface-ground);
}

.story-plus {
  position: absolute;
  right: 0;
  bottom: 0;
  display: grid;
  place-items: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: var(--primary-color);
  color: var(--primary-color-text);
  border: 2px solid var(--surface-card, #fff);
  font-size: 0.65rem;
}

.story-plus .pi {
  font-size: 0.65rem;
  font-weight: 700;
}

.story-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  line-height: 1.2;
}

.stories-error {
  align-self: center;
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .story-ring {
    transition: none;
  }
}
</style>
