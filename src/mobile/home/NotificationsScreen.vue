<template>
  <MobileStackScreen title="Notifications" @back="emit('close')">
    <div class="m-notifs">
      <PushOptIn purpose="quand quelqu’un réagit à tes publications ou réserve un créneau" hide-when-unavailable class="m-notifs__push" />

      <div v-if="store.loading && !store.loaded" class="m-notifs__list" role="status" aria-label="Chargement des notifications">
        <div v-for="n in 5" :key="n" class="m-notifs__item m-notifs__item--skeleton" aria-hidden="true">
          <span class="m-notifs__thumb m-skeleton"></span>
          <span class="m-notifs__copy">
            <span class="m-skeleton m-skeleton--line" style="width: 80%"></span>
            <span class="m-skeleton m-skeleton--line" style="width: 45%"></span>
          </span>
        </div>
      </div>

      <div v-else-if="store.failed && !store.items.length" class="m-state" role="alert">
        <span class="m-state__icon" aria-hidden="true"><MIcon name="alert" /></span>
        <p class="m-state__title">Notifications indisponibles</p>
        <p class="m-state__text">Vérifie ta connexion, puis réessaie.</p>
        <button type="button" class="m-ghost-button" @click="reload">Réessayer</button>
      </div>

      <div v-else-if="!store.items.length" class="m-state">
        <span class="m-state__icon" aria-hidden="true"><MIcon name="bell" /></span>
        <p class="m-state__title">Rien de nouveau</p>
        <p class="m-state__text">Les j’aime, les commentaires et les points gagnés apparaîtront ici.</p>
      </div>

      <template v-else>
        <p v-if="store.partial" class="m-banner" role="status">Liste incomplète : une partie n’a pas pu être chargée.</p>
        <ul class="m-notifs__list">
          <li v-for="item in store.items" :key="item.id">
            <component
              :is="item.postId ? 'button' : 'div'"
              :type="item.postId ? 'button' : undefined"
              class="m-notifs__item"
              :class="{ 'is-unread': isUnread(item) }"
              @click="open(item)"
            >
              <span class="m-notifs__thumb" :class="`m-notifs__thumb--${item.kind}`" aria-hidden="true">
                <img v-if="item.avatarUrl" :src="item.avatarUrl" alt="" loading="lazy" />
                <MIcon v-else :name="item.icon" />
              </span>
              <span class="m-notifs__copy">
                <span class="m-notifs__title">{{ item.title }}</span>
                <span v-if="item.detail" class="m-notifs__detail">{{ item.detail }}</span>
                <time class="m-notifs__time" :datetime="item.at">{{ formatRelativeTime(item.at) }}</time>
              </span>
              <span v-if="item.badge" class="m-notifs__badge">{{ item.badge }}</span>
              <span v-if="isUnread(item)" class="m-notifs__dot"><span class="m-sr-only">Nouveau</span></span>
            </component>
          </li>
        </ul>
      </template>
    </div>
  </MobileStackScreen>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import MobileStackScreen from '@/mobile/ui/MobileStackScreen.vue'
import MIcon from '@/mobile/ui/MIcon.vue'
import PushOptIn from '@/components/push/PushOptIn.vue'
import { useAuthStore } from '@/stores/authStore'
import { formatRelativeTime } from '@/service/postComments'
import { useMobileNotificationsStore } from '@/mobile/home/mobileNotificationsStore'
import { useMobileShell } from '@/mobile/shell/useMobileShell'

const emit = defineEmits(['close'])
const authStore = useAuthStore()
const store = useMobileNotificationsStore()
const shell = useMobileShell()

// Ce qui était nouveau à l'ouverture reste marqué tant que l'écran est affiché.
const seenAtOpen = store.unreadSince
const isUnread = (item) => Date.parse(item.at) > seenAtOpen

const reload = () => store.load(authStore.user?.id)

function open(item) {
  if (!item.postId) return
  shell.open('commentaires', { post: { id: item.postId, comments_count: null } })
}

onMounted(reload)
onBeforeUnmount(() => store.markSeen())
</script>

<style scoped>
.m-notifs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.m-notifs__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.m-notifs__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 64px;
  padding: 12px;
  border: 0;
  border-radius: var(--m-radius);
  background: var(--m-surface);
  color: var(--m-fg);
  font: inherit;
  text-align: left;
}
button.m-notifs__item {
  cursor: pointer;
  touch-action: manipulation;
}
button.m-notifs__item:active {
  background: var(--m-raised);
}
button.m-notifs__item:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-notifs__thumb {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--m-raised);
  color: var(--m-accent-text);
}
.m-notifs__thumb--like {
  color: var(--m-like);
}
.m-notifs__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.m-notifs__copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.m-notifs__title {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.35;
}
.m-notifs__detail {
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.8125rem;
  line-height: 1.35;
  color: var(--m-muted);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
.m-notifs__badge {
  flex-shrink: 0;
  padding: 3px 9px;
  border-radius: 99px;
  background: var(--m-raised);
  color: var(--m-accent-text);
  font-size: 0.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.m-notifs__time {
  font-size: 0.75rem;
  color: var(--m-muted);
}
.m-notifs__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--m-accent);
}
.m-skeleton--line {
  display: block;
  height: 12px;
  margin: 3px 0;
  border-radius: 6px;
}
/* Bloc d'activation des notifications (composant partagé) : mise en colonne. */
.m-notifs__push {
  border-radius: var(--m-radius);
}
.m-notifs__push :deep(.push-opt-in__action) {
  min-height: 44px;
}
</style>
