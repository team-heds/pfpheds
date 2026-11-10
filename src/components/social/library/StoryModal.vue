<template>
  <Teleport to="body">
    <div
      class="story-viewer"
      role="dialog"
      aria-modal="true"
      :aria-label="`Story de ${authorName}`"
      @keydown="onKeydown"
      @click.self="close"
    >
      <div v-if="current" class="story-frame">
        <div class="story-progress" aria-hidden="true">
          <span v-for="(s, idx) in stories" :key="s.id" class="story-progress-track">
            <span class="story-progress-fill" :style="{ width: `${progressFor(idx)}%` }"></span>
          </span>
        </div>

        <header class="story-top">
          <img :src="authorAvatar" alt="" class="story-top-avatar" />
          <div class="story-top-text">
            <span class="story-top-name">{{ authorName }}</span>
            <span class="story-top-time">{{ age }}</span>
          </div>
          <button
            type="button"
            class="story-icon-btn"
            :aria-label="paused ? 'Reprendre' : 'Mettre en pause'"
            @click="togglePause"
          >
            <i :class="paused ? 'pi pi-play' : 'pi pi-pause'" aria-hidden="true"></i>
          </button>
          <button ref="closeBtn" type="button" class="story-icon-btn" aria-label="Fermer" @click="close">
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </header>

        <div class="story-stage">
          <video
            v-if="current.media_type === 'video'"
            ref="video"
            :key="current.id"
            :src="current.media_url"
            class="story-media"
            playsinline
            autoplay
            :muted="muted"
            @loadedmetadata="onVideoReady"
            @timeupdate="onVideoTime"
            @ended="next"
            @error="onMediaError"
          ></video>
          <img
            v-else
            :key="current.id"
            :src="current.media_url"
            :alt="current.caption ? `Story : ${current.caption}` : `Story de ${authorName}`"
            class="story-media"
            @load="onImageReady"
            @error="onMediaError"
          />

          <p v-if="mediaError" class="story-media-error" role="status">Cette story ne peut pas être affichée.</p>

          <button type="button" class="story-zone story-zone--prev" aria-label="Story précédente" @click="prev"></button>
          <button type="button" class="story-zone story-zone--next" aria-label="Story suivante" @click="next"></button>
        </div>

        <footer class="story-bottom">
          <p v-if="current.caption" class="story-caption">{{ current.caption }}</p>

          <div v-if="modules.length" class="story-modules">
            <button
              v-for="(mod, idx) in modules"
              :key="idx"
              type="button"
              class="story-pill"
              @click="openModule(mod)"
            >
              <i :class="mod.type === 'quiz' ? 'pi pi-question-circle' : 'pi pi-chart-bar'" aria-hidden="true"></i>
              {{ mod.type === 'quiz' ? 'Quiz' : 'Sondage' }}
            </button>
          </div>

          <div class="story-actions">
            <button
              v-if="current.media_type === 'video'"
              type="button"
              class="story-pill"
              :aria-pressed="!muted"
              @click="muted = !muted"
            >
              <i :class="muted ? 'pi pi-volume-off' : 'pi pi-volume-up'" aria-hidden="true"></i>
              {{ muted ? 'Son coupé' : 'Son activé' }}
            </button>
            <template v-if="isOwn">
              <button type="button" class="story-pill" @click="openViewers">
                <i class="pi pi-eye" aria-hidden="true"></i>
                Vu par {{ current.view_count || 0 }}
              </button>
              <button
                type="button"
                class="story-pill story-pill--danger"
                :disabled="deleting"
                @click="removeStory"
              >
                <i :class="deleting ? 'pi pi-spin pi-spinner' : 'pi pi-trash'" aria-hidden="true"></i>
                {{ confirmDelete ? 'Confirmer la suppression' : 'Supprimer' }}
              </button>
            </template>
          </div>
          <p v-if="actionError" class="story-action-error" role="alert">{{ actionError }}</p>
        </footer>

        <div v-if="sheet" class="story-sheet-backdrop" @click.self="closeSheet">
          <section ref="sheet" class="story-sheet" role="dialog" aria-modal="true" :aria-labelledby="sheetTitleId" tabindex="-1">
            <header class="story-sheet-head">
              <h2 :id="sheetTitleId">{{ sheetTitle }}</h2>
              <button type="button" class="story-sheet-close" aria-label="Fermer" @click="closeSheet">
                <i class="pi pi-times" aria-hidden="true"></i>
              </button>
            </header>
            <template v-if="sheet === 'module'">
              <StoryQuiz
                v-if="activeModule?.type === 'quiz'"
                :question="activeModule.question"
                :options="activeModule.options"
                :answerIdx="activeModule.answerIdx"
              />
              <StoryStickerPoll
                v-else-if="activeModule?.type === 'poll'"
                :question="activeModule.question"
                :options="activeModule.options"
              />
            </template>
            <template v-else>
              <p v-if="viewersLoading" class="viewers-state">Chargement…</p>
              <p v-else-if="!viewers.length" class="viewers-state">Personne n’a encore vu cette story.</p>
              <ul v-else class="viewers-list">
                <li v-for="v in viewers" :key="v.viewer_id" class="viewers-item">
                  <img :src="v.avatar_url || authorAvatarFallback" alt="" class="viewers-avatar" />
                  <span>{{ v.display_name }}</span>
                </li>
              </ul>
            </template>
          </section>
        </div>
      </div>

    </div>
  </Teleport>
</template>

<script>
import StoryQuiz from './StoryQuiz.vue';
import StoryStickerPoll from './StoryStickerPoll.vue';
import { deleteStory, fetchStoryViewers, formatStoryAge } from '@/service/storiesService';

const IMAGE_DURATION_MS = 5000;
const TICK_MS = 50;
const fallbackAvatar = new URL('@/assets/avatar/avatar1.jpg', import.meta.url).href;

export default {
  name: 'StoryModal',
  components: { StoryQuiz, StoryStickerPoll },
  props: {
    stories: { type: Array, required: true },
    startIndex: { type: Number, default: 0 },
    authorName: { type: String, default: 'Utilisateur' },
    authorAvatar: { type: String, default: fallbackAvatar },
    isOwn: { type: Boolean, default: false }
  },
  emits: ['close', 'viewed', 'deleted'],
  data() {
    return {
      index: Math.min(Math.max(this.startIndex, 0), Math.max(this.stories.length - 1, 0)),
      progress: 0,
      ready: false,
      paused: false,
      muted: true,
      timer: null,
      mediaError: false,
      sheet: null,
      sheetTitleId: `story-sheet-${Math.random().toString(36).slice(2, 8)}`,
      activeModule: null,
      viewersLoading: false,
      viewers: [],
      confirmDelete: false,
      deleting: false,
      actionError: '',
      previousFocus: null,
      previousOverflow: '',
      authorAvatarFallback: fallbackAvatar
    };
  },
  computed: {
    current() {
      return this.stories[this.index] || null;
    },
    age() {
      return this.current ? formatStoryAge(this.current.created_at) : '';
    },
    sheetTitle() {
      if (this.sheet === 'viewers') return 'Vu par';
      return this.activeModule?.type === 'quiz' ? 'Quiz' : 'Sondage';
    },
    modules() {
      const els = Array.isArray(this.current?.elements) ? this.current.elements : [];
      return els.filter((e) => e && (e.type === 'quiz' || e.type === 'poll'));
    }
  },
  watch: {
    index() {
      this.startStory();
    },
    stories(list, old) {
      // La liste est recalculée à chaque « vu » : on ne relance que si des stories ont disparu.
      const ids = (l) => (l || []).map((s) => s.id).join(',');
      if (ids(list) === ids(old)) return;
      if (!list.length) this.close();
      else if (this.index > list.length - 1) this.index = list.length - 1;
      else this.startStory();
    }
  },
  mounted() {
    this.previousFocus = document.activeElement;
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.$nextTick(() => this.$refs.closeBtn?.focus());
    this.startStory();
  },
  beforeUnmount() {
    clearInterval(this.timer);
    document.body.style.overflow = this.previousOverflow;
    this.previousFocus?.focus?.();
  },
  methods: {
    progressFor(idx) {
      if (idx < this.index) return 100;
      if (idx > this.index) return 0;
      return this.progress;
    },
    startStory() {
      clearInterval(this.timer);
      this.progress = 0;
      this.ready = false;
      this.mediaError = false;
      this.confirmDelete = false;
      this.actionError = '';
      if (this.current && !this.isOwn) this.$emit('viewed', this.current);
    },
    onImageReady() {
      this.ready = true;
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (this.paused) return;
        this.progress = Math.min(100, this.progress + (100 * TICK_MS) / IMAGE_DURATION_MS);
        if (this.progress >= 100) this.next();
      }, TICK_MS);
    },
    onVideoReady() {
      this.ready = true;
      if (this.paused) this.$refs.video?.pause();
    },
    onVideoTime(e) {
      const v = e.target;
      if (v.duration) this.progress = Math.min(100, (v.currentTime / v.duration) * 100);
    },
    onMediaError() {
      // Média illisible (lien expiré, fichier supprimé) : on avance quand même après 5 s.
      this.mediaError = true;
      this.onImageReady();
    },
    next() {
      if (this.index < this.stories.length - 1) this.index += 1;
      else this.close();
    },
    prev() {
      if (this.index > 0) this.index -= 1;
      else this.startStory();
    },
    pause() {
      this.paused = true;
      this.$refs.video?.pause();
    },
    resume() {
      if (this.sheet) return;
      this.paused = false;
      this.$refs.video?.play?.().catch(() => {});
    },
    togglePause() {
      if (this.paused) this.resume();
      else this.pause();
    },
    onKeydown(e) {
      if (this.sheet) {
        if (e.key === 'Escape') this.closeSheet();
        return;
      }
      if (e.key === 'Escape') this.close();
      else if (e.key === 'ArrowRight') this.next();
      else if (e.key === 'ArrowLeft') this.prev();
    },
    openSheet(kind) {
      this.pause();
      this.sheet = kind;
      this.$nextTick(() => this.$refs.sheet?.focus());
    },
    closeSheet() {
      this.sheet = null;
      this.resume();
    },
    openModule(mod) {
      this.activeModule = mod;
      this.openSheet('module');
    },
    async openViewers() {
      this.openSheet('viewers');
      this.viewersLoading = true;
      try {
        this.viewers = await fetchStoryViewers(this.current.id);
      } catch (e) {
        console.error('[Stories] Vues indisponibles:', e);
        this.viewers = [];
      } finally {
        this.viewersLoading = false;
      }
    },
    async removeStory() {
      if (!this.confirmDelete) {
        this.pause();
        this.confirmDelete = true;
        return;
      }
      this.deleting = true;
      this.actionError = '';
      try {
        const id = this.current.id;
        await deleteStory(this.current);
        this.confirmDelete = false;
        this.paused = false;
        this.$emit('deleted', id);
      } catch (e) {
        console.error('[Stories] Suppression refusée:', e);
        this.actionError = 'La story n’a pas pu être supprimée. Réessayez.';
      } finally {
        this.deleting = false;
      }
    },
    close() {
      clearInterval(this.timer);
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.story-viewer {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.92);
}

.story-frame {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(100vw, calc(92dvh * 9 / 16));
  height: min(92dvh, calc(100vw * 16 / 9));
  max-height: 92dvh;
  overflow: hidden;
  border-radius: 1rem;
  background: #000;
  color: #fff;
}

.story-progress {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  right: 0.6rem;
  z-index: 3;
  display: flex;
  gap: 4px;
}

.story-progress-track {
  flex: 1;
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.35);
}

.story-progress-fill {
  display: block;
  height: 100%;
  background: #fff;
}

.story-top {
  position: absolute;
  top: 1.2rem;
  left: 0.6rem;
  right: 0.4rem;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.story-top-avatar {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.story-top-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.story-top-name {
  font-weight: 700;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.story-top-time {
  font-size: 0.75rem;
  opacity: 0.85;
}

.story-icon-btn {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
}

.story-icon-btn:focus-visible,
.story-pill:focus-visible,
.story-zone:focus-visible {
  outline: 3px solid #f3c300;
  outline-offset: 2px;
}

.story-stage {
  position: relative;
  flex: 1;
  min-height: 0;
}

.story-media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

.story-media-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 2rem;
  text-align: center;
}

.story-zone {
  position: absolute;
  top: 4.5rem;
  bottom: 0;
  z-index: 2;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.story-zone--prev {
  left: 0;
  width: 33%;
}

.story-zone--next {
  right: 0;
  width: 67%;
}

.story-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 2.5rem 0.9rem calc(0.9rem + env(safe-area-inset-bottom));
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  pointer-events: none;
}

.story-bottom > * {
  pointer-events: auto;
}

.story-caption {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

.story-modules,
.story-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.story-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.75rem;
  padding: 0 1rem;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(6px);
}

.story-pill--danger {
  border-color: rgba(255, 140, 140, 0.7);
}

.story-pill:disabled {
  opacity: 0.6;
  cursor: default;
}

.story-action-error {
  margin: 0;
  font-size: 0.85rem;
  color: #ffb4b4;
}

.story-sheet-backdrop {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.45);
}

.story-sheet {
  width: 100%;
  max-height: 70%;
  overflow-y: auto;
  padding: 0.75rem 1rem calc(1rem + env(safe-area-inset-bottom));
  border-radius: 1.25rem 1.25rem 0 0;
  background: #fff;
  color: #1b2a41;
}

.story-sheet:focus {
  outline: none;
}

.story-sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.story-sheet-head h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: inherit;
}

.story-sheet-close {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.story-sheet-close:focus-visible {
  outline: 3px solid var(--primary-color);
}

.story-sheet :deep(button) {
  color: #1b2a41;
}

.story-sheet :deep(.story-quiz) {
  width: 100%;
  margin: 0;
}

.viewers-state {
  margin: 0;
  color: #4b5a70;
}

.viewers-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.viewers-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.viewers-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
}

@media (max-width: 768px) {
  .story-frame {
    width: 100vw;
    height: 100dvh;
    max-height: none;
    border-radius: 0;
  }

  .story-progress {
    top: calc(0.5rem + env(safe-area-inset-top));
  }

  .story-top {
    top: calc(1.1rem + env(safe-area-inset-top));
  }
}
</style>
