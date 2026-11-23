import { computed, reactive } from 'vue'

// Une seule annonce à l'écran. Un message éphémère passe d'abord, puis l'état de la
// connexion, la mise à jour et enfin l'invitation à installer.
const PRIORITY = ['toast', 'offline', 'update', 'install']
const DEFAULT_TOAST_MS = 6000
const MAX_TOAST_MS = 10000

const pending = reactive(new Set())
let toastTimer = null

export const activeAnnouncement = computed(() => PRIORITY.find((key) => pending.has(key)) || null)

export function showAnnouncement(key) {
  pending.add(key)
}

export function hideAnnouncement(key) {
  pending.delete(key)
}

export function holdForToast(life) {
  const duration = Math.min(Number(life) > 0 ? Number(life) : DEFAULT_TOAST_MS, MAX_TOAST_MS)
  clearTimeout(toastTimer)
  showAnnouncement('toast')
  toastTimer = setTimeout(() => hideAnnouncement('toast'), duration)
}

export function installToastAnnouncements(bus) {
  const onAdd = (message) => holdForToast(message?.life)
  bus.on('add', onAdd)
  return () => {
    bus.off('add', onAdd)
    clearTimeout(toastTimer)
    hideAnnouncement('toast')
  }
}

export function resetAnnouncements() {
  clearTimeout(toastTimer)
  pending.clear()
}
