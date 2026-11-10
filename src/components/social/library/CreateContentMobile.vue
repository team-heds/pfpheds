<template>
  <div class="create-content-mobile" @touchstart.passive="handleTouchStart" @touchend.passive="handleTouchEnd">
    <header class="create-header">
      <button type="button" class="header-icon-btn" aria-label="Retour" :disabled="busy" @click="goBack">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
      </button>
      <h1 class="create-title">{{ currentTab === 'post' ? 'Nouvelle publication' : 'Nouvelle story' }}</h1>
      <button
        v-if="currentTab === 'post'"
        type="button"
        class="header-publish"
        :disabled="!canPublish || busy"
        :aria-busy="busy ? 'true' : 'false'"
        @click="composerRef?.submit()"
      >
        <i v-if="busy" class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        {{ busy ? 'Publication…' : 'Publier' }}
      </button>
      <span v-else class="header-spacer" aria-hidden="true"></span>
    </header>

    <main class="content-area">
      <div v-show="currentTab === 'post'" id="create-panel-post" role="tabpanel" aria-labelledby="create-tab-post">
        <PostComposer
          ref="composerRef"
          :publish="publish"
          hide-submit
          editor-min-height="35vh"
          @state="onComposerState"
          @published="onPublished"
        />
      </div>
      <div v-if="currentTab === 'story'" id="create-panel-story" role="tabpanel" aria-labelledby="create-tab-story">
        <AddStoryCore @uploaded="goBack" />
      </div>
    </main>

    <nav class="tab-bar-slider" aria-label="Type de contenu">
      <div class="slider-bg" role="tablist">
        <button
          id="create-tab-post"
          type="button"
          role="tab"
          aria-controls="create-panel-post"
          :aria-selected="currentTab === 'post'"
          :class="['slider-btn', { 'slider-active': currentTab === 'post' }]"
          :disabled="busy"
          @click="currentTab = 'post'"
        >Publication</button>
        <button
          id="create-tab-story"
          type="button"
          role="tab"
          aria-controls="create-panel-story"
          :aria-selected="currentTab === 'story'"
          :class="['slider-btn', { 'slider-active': currentTab === 'story' }]"
          :disabled="busy"
          @click="currentTab = 'story'"
        >Story</button>
        <span class="slider-indicator" :style="{ transform: currentTab === 'post' ? 'translateX(0)' : 'translateX(100%)' }" aria-hidden="true"></span>
      </div>
    </nav>
  </div>
</template>

<script>
import { ref } from 'vue';
import PostComposer from './PostComposer.vue';
import AddStoryCore from './AddStoryCore.vue';
import { useAuthStore } from '@/stores/authStore';
import { publishPost } from '@/service/postPublishService';

export default {
  name: 'CreateContentMobile',
  components: { PostComposer, AddStoryCore },
  setup() {
    return { composerRef: ref(null) };
  },
  data() {
    return {
      currentTab: this.$route?.query?.tab === 'story' ? 'story' : 'post',
      canPublish: false,
      busy: false,
      touchStartX: 0,
      authStore: null
    };
  },
  mounted() {
    // Masquer la navigation globale sur cette page plein écran.
    const navbar = document.querySelector('.navbar, .nav-bar, nav:not(.tab-bar-slider), .main-navbar');
    if (navbar) navbar.style.display = 'none';
    this.authStore = useAuthStore();
    this.authStore?.checkAuthState?.();
  },
  beforeUnmount() {
    const navbar = document.querySelector('.navbar, .nav-bar, nav:not(.tab-bar-slider), .main-navbar');
    if (navbar) navbar.style.display = '';
  },
  methods: {
    goBack() {
      if (window.history.length > 1) this.$router.back();
      else this.$router.push({ name: 'FeedView' });
    },
    onComposerState({ canSubmit, publishing }) {
      this.canPublish = canSubmit;
      this.busy = publishing;
    },
    // La gamification (action POST : 25 XP, 3 fois par jour) est appelée par publishPost.
    async publish({ content, files }) {
      const user = this.authStore?.user;
      if (!user?.id || user.id === 'guest-user') throw new Error('Utilisateur non connecté');
      await publishPost({ user, content, files });
    },
    onPublished() {
      this.$toast?.add({ severity: 'success', summary: 'Publication partagée', life: 2500 });
      this.goBack();
    },
    // Glisser horizontalement pour passer de Publication à Story.
    handleTouchStart(e) {
      this.touchStartX = e.changedTouches[0].screenX;
    },
    handleTouchEnd(e) {
      if (this.busy || e.target.closest?.('.ProseMirror, textarea, input, select, canvas')) return;
      const diff = e.changedTouches[0].screenX - this.touchStartX;
      if (Math.abs(diff) < 60) return;
      if (diff < 0 && this.currentTab === 'post') this.currentTab = 'story';
      if (diff > 0 && this.currentTab === 'story') this.currentTab = 'post';
    }
  }
};
</script>

<style scoped>
.create-content-mobile {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--surface-ground);
  color: var(--text-color);
}

.create-header {
  position: sticky;
  top: 0;
  z-index: 5;
  display: grid;
  grid-template-columns: 2.75rem 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: calc(env(safe-area-inset-top, 0px) + 0.5rem) 0.5rem 0.5rem;
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
}

.create-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-icon-btn {
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-color);
  font-size: 1.1rem;
  cursor: pointer;
}

.header-publish {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.5rem;
  padding: 0 0.9rem;
  border: 0;
  border-radius: 999px;
  background: var(--primary-color);
  font: inherit;
  font-weight: 700;
  color: var(--primary-color-text);
  cursor: pointer;
}

.header-spacer {
  width: 2.75rem;
}

.header-publish:disabled,
.header-icon-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.header-icon-btn:focus-visible,
.header-publish:focus-visible,
.slider-btn:focus-visible {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
}

.content-area {
  flex: 1;
  padding: 1rem 1rem calc(6rem + env(safe-area-inset-bottom, 0px));
}

.tab-bar-slider {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  z-index: 10;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.slider-bg {
  pointer-events: auto;
  position: relative;
  display: flex;
  width: 16rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.slider-btn {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 2.5rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  font: inherit;
  font-weight: 700;
  color: var(--text-color-secondary);
  cursor: pointer;
  transition: color 0.18s;
}

.slider-btn.slider-active {
  color: var(--primary-color-text);
}

.slider-indicator {
  position: absolute;
  z-index: 1;
  top: 0.25rem;
  left: 0.25rem;
  width: calc(50% - 0.25rem);
  height: 2.5rem;
  border-radius: 999px;
  background: var(--primary-color);
  transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .slider-indicator,
  .slider-btn {
    transition: none;
  }
}

@media (min-width: 768px) {
  .content-area {
    max-width: 40rem;
    width: 100%;
    margin: 0 auto;
  }
}
</style>
