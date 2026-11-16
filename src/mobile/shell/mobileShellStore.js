import { defineStore } from 'pinia'
import { TAB_KEYS, pageKey, tabForPath, tabRoot } from '@/mobile/shell/tabs'

const MAX_STACK = 20
const OVERLAY_PREFIX = '#/'

/** Noms des panneaux et écrans empilés portés par l'ancre de l'adresse. */
export function parseOverlayHash(hash) {
  const value = String(hash || '')
  if (!value.startsWith(OVERLAY_PREFIX)) return []
  return value.slice(OVERLAY_PREFIX.length).split('/').filter(Boolean)
}

export function buildOverlayHash(names) {
  return names?.length ? `${OVERLAY_PREFIX}${names.join('/')}` : ''
}

const freshStacks = (userId) =>
  Object.fromEntries(TAB_KEYS.map((key) => [key, [tabRoot(key, userId)]]))

/**
 * Mémoire de la coque mobile : onglet actif, pile d'écrans de chaque onglet,
 * panneaux ouverts. Elle ne navigue jamais elle-même : elle dit où aller et se
 * met à jour quand le routeur a changé d'adresse.
 */
export const useMobileShellStore = defineStore('mobileShell', {
  state: () => ({
    userId: null,
    activeTab: 'home',
    stacks: freshStacks(null),
    overlays: [],
    direction: 'none',
    scrollTopSignal: 0,
    nextOverlayId: 1,
  }),

  getters: {
    currentPage: (state) => {
      const stack = state.stacks[state.activeTab] || []
      return stack[stack.length - 1] || tabRoot(state.activeTab, state.userId)
    },
    canGoBack: (state) => (state.stacks[state.activeTab] || []).length > 1,
    overlayNames: (state) => state.overlays.map((overlay) => overlay.name),
  },

  actions: {
    /** Changement de compte : les piles de l'ancien compte ne doivent pas rester. */
    setUser(userId) {
      const next = userId || null
      if (next === this.userId) return
      this.userId = next
      this.stacks = freshStacks(next)
      this.overlays = []
      this.activeTab = 'home'
      this.direction = 'none'
    },

    /**
     * À appeler après chaque navigation aboutie. Retourne `{ redirect }` quand
     * l'ancre désigne un panneau qu'on ne peut pas rouvrir (ex. après un
     * rechargement) : l'appelant remplace alors l'adresse.
     */
    syncRoute(route, { canRestore = () => false } = {}) {
      const page = pageKey(route.fullPath)
      const tab = tabForPath(route.path, { currentTab: this.activeTab, userId: this.userId })
      const previousTab = this.activeTab
      const previousPage = this.currentPage
      const root = tabRoot(tab, this.userId)
      const stack = this.stacks[tab] ? [...this.stacks[tab]] : [root]

      let direction = 'forward'
      const known = stack.indexOf(page)
      if (page === root) {
        direction = stack.length > 1 ? 'back' : 'none'
        stack.length = 0
        stack.push(root)
      } else if (known !== -1) {
        direction = known < stack.length - 1 ? 'back' : 'none'
        stack.length = known + 1
      } else {
        stack.push(page)
        if (stack.length > MAX_STACK) stack.splice(1, stack.length - MAX_STACK)
      }

      this.stacks = { ...this.stacks, [tab]: stack }
      this.activeTab = tab
      if (tab !== previousTab) direction = 'tab'
      else if (page === previousPage) direction = 'none'
      this.direction = direction

      return this.syncOverlays(parseOverlayHash(route.hash), page, canRestore)
    },

    syncOverlays(names, page, canRestore) {
      const kept = []
      let valid = true
      for (let index = 0; index < names.length; index += 1) {
        const name = names[index]
        const existing = valid ? this.overlays[index] : null
        if (existing && existing.name === name) {
          kept.push(existing)
        } else if (canRestore(name)) {
          valid = false
          kept.push({ id: this.nextOverlayId++, name, props: {} })
        } else {
          this.overlays = kept
          return { redirect: `${page}${buildOverlayHash(kept.map((overlay) => overlay.name))}` }
        }
      }
      this.overlays = kept
      return { redirect: null }
    },

    /** Prépare l'ouverture d'un panneau ; retourne l'ancre à pousser dans l'historique. */
    openOverlay(name, props = {}) {
      const overlay = { id: this.nextOverlayId++, name, props }
      this.overlays = [...this.overlays, overlay]
      return { id: overlay.id, hash: buildOverlayHash(this.overlayNames) }
    },

    /** Annule une ouverture dont la navigation n'a pas abouti. */
    dropOverlay(id) {
      this.overlays = this.overlays.filter((overlay) => overlay.id !== id)
    },

    /** Adresse à retrouver quand on ferme le panneau du dessus. */
    overlayParent() {
      const names = this.overlayNames.slice(0, -1)
      return `${this.currentPage}${buildOverlayHash(names)}`
    },

    /**
     * Destination d'un appui sur un onglet. Autre onglet : on retrouve son
     * dernier écran. Onglet déjà actif : retour à sa racine, puis haut de page.
     */
    tabTarget(tabKey) {
      const root = tabRoot(tabKey, this.userId)
      if (tabKey !== this.activeTab) {
        const stack = this.stacks[tabKey] || [root]
        return stack[stack.length - 1] || root
      }
      if (this.overlays.length || this.currentPage !== root) return root
      this.scrollTopSignal += 1
      return null
    },

    /** Écran précédent dans l'onglet actif, ou `null` à la racine. */
    backTarget() {
      const stack = this.stacks[this.activeTab] || []
      return stack.length > 1 ? stack[stack.length - 2] : null
    },
  },
})
