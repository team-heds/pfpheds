import { defineStore } from 'pinia'
import { fetchNotifications } from '@/mobile/home/notificationsService'

const UNREAD_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

const seenKey = (userId) => `heds.mobile.notifications.seen.${userId}`

function readSeen(userId) {
  try {
    return Number(window.localStorage.getItem(seenKey(userId))) || 0
  } catch {
    return 0
  }
}

function writeSeen(userId, timestamp) {
  try {
    window.localStorage.setItem(seenKey(userId), String(timestamp))
  } catch {
    // Stockage indisponible (navigation privée) : la pastille reviendra, sans autre effet.
  }
}

/** Liste des notifications de l'écran mobile et pastille « nouveautés » de la cloche. */
export const useMobileNotificationsStore = defineStore('mobileNotifications', {
  state: () => ({
    userId: null,
    items: [],
    loading: false,
    loaded: false,
    failed: false,
    partial: false,
    seenAt: 0,
  }),
  getters: {
    /** Seuil au-delà duquel un événement compte comme nouveau (jamais plus d'une semaine). */
    unreadSince: (state) => Math.max(state.seenAt, Date.now() - UNREAD_WINDOW_MS),
    hasUnread() {
      return this.items.some((item) => Date.parse(item.at) > this.unreadSince)
    },
  },
  actions: {
    async load(userId) {
      if (!userId || this.loading) return
      if (userId !== this.userId) {
        this.userId = userId
        this.items = []
        this.loaded = false
        this.seenAt = readSeen(userId)
      }
      this.loading = true
      this.failed = false
      try {
        const { items, partial } = await fetchNotifications(userId)
        this.items = items
        this.partial = partial
        this.loaded = true
      } catch (error) {
        console.error('[Notifications] Chargement impossible:', error)
        this.failed = true
      } finally {
        this.loading = false
      }
    },
    markSeen() {
      if (!this.userId) return
      this.seenAt = Date.now()
      writeSeen(this.userId, this.seenAt)
    },
  },
})
