<template>
  <Dialog
    :visible="visible"
    modal
    :closable="false"
    :show-header="false"
    :draggable="false"
    :pt="{ root: { class: 'checkin-presenter' }, content: { class: 'checkin-presenter__content' } }"
    aria-labelledby="checkin-presenter-title"
    @update:visible="(value) => !value && close()"
  >
    <div ref="rootElement" class="presenter">
      <header class="presenter__header">
        <div>
          <p class="presenter__eyebrow">Présence par QR code</p>
          <h2 id="checkin-presenter-title">{{ event.title }}</h2>
        </div>
        <div class="presenter__header-actions">
          <Button
            v-if="fullscreenSupported"
            :label="isFullscreen ? 'Quitter le plein écran' : 'Plein écran'"
            :icon="isFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"
            outlined
            @click="toggleFullscreen"
          />
          <Button label="Fermer" icon="pi pi-times" severity="secondary" autofocus @click="close" />
        </div>
      </header>

      <div class="presenter__body">
        <section class="presenter__code" aria-label="QR code à scanner">
          <template v-if="status === 'open' && qrImage">
            <img class="presenter__qr" :src="qrImage" alt="QR code de présence à scanner avec la plateforme" />
            <p class="presenter__instructions">
              Scannez avec la plateforme (Présences › Scanner un QR code) ou avec l’appareil photo du téléphone.
            </p>
            <p class="presenter__short">
              <span>Sans appareil photo, saisissez le code</span>
              <strong aria-label="Code court">{{ spacedShortCode }}</strong>
            </p>
            <div class="presenter__countdown">
              <div
                class="presenter__countdown-bar"
                role="progressbar"
                aria-label="Temps avant le prochain code"
                aria-valuemin="0"
                :aria-valuemax="rotationSeconds"
                :aria-valuenow="secondsLeft"
              >
                <span :style="{ transform: `scaleX(${Math.min(1, secondsLeft / rotationSeconds)})` }"></span>
              </div>
              <span>Nouveau code dans {{ secondsLeft }} s · {{ code.xp_reward }} XP par présence</span>
            </div>
          </template>

          <div v-else class="presenter__state" :role="status === 'error' ? 'alert' : 'status'">
            <i :class="stateView.icon" aria-hidden="true"></i>
            <h3>{{ stateView.title }}</h3>
            <p>{{ stateView.detail }}</p>
            <Button v-if="status === 'error'" label="Réessayer" icon="pi pi-refresh" @click="refreshCode" />
          </div>
        </section>

        <section class="presenter__attendance" aria-labelledby="checkin-presenter-count">
          <div class="presenter__attendance-head">
            <p id="checkin-presenter-count" class="presenter__count" aria-live="polite">
              <strong>{{ attendees.length }}</strong>
              <span>{{ attendees.length > 1 ? 'présents' : 'présent' }}</span>
            </p>
            <Button
              label="Exporter la liste"
              icon="pi pi-download"
              outlined
              :disabled="!attendees.length"
              @click="exportList"
            />
          </div>
          <p v-if="attendanceError" class="presenter__attendance-error" role="alert">
            La liste n’a pas pu être mise à jour. Nouvel essai automatique dans quelques secondes.
          </p>
          <p v-if="!attendees.length" class="presenter__empty">Les personnes présentes apparaîtront ici au fur et à mesure des scans.</p>
          <ol v-else class="presenter__list">
            <li v-for="attendee in attendees" :key="attendee.user_id">
              <span class="presenter__name">{{ attendee.display_name }}</span>
              <span class="presenter__meta">
                <template v-if="attendee.classe">{{ attendee.classe }} · </template>{{ formatTime(attendee.redeemed_at) }}
              </span>
            </li>
          </ol>
        </section>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
// Écran projetable de l'organisateur : QR code renouvelé toutes les minutes par le
// serveur, code court de secours, compteur et liste des présents en direct, export.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import QRCode from 'qrcode'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import {
  buildScanUrl,
  downloadAttendanceCsv,
  getEventAttendance,
  issueEventCheckinCode,
} from '@/service/eventCheckinService'

const props = defineProps({
  visible: { type: Boolean, default: false },
  event: { type: Object, required: true },
})
const emit = defineEmits(['update:visible', 'attendance'])

const ATTENDANCE_POLL_MS = 5000
const RETRY_MS = 5000
const WAITING_RETRY_MS = 30000

const rootElement = ref(null)
// loading | open | upcoming | closed | unavailable | error
const status = ref('loading')
const code = ref(null)
const qrImage = ref('')
const secondsLeft = ref(0)
const rotationSeconds = ref(60)
const attendees = ref([])
const attendanceError = ref(false)
const windowInfo = ref({})
const isFullscreen = ref(false)
const fullscreenSupported = typeof document !== 'undefined' && Boolean(document.documentElement.requestFullscreen)

let refreshTimer = null
let tickTimer = null
let pollTimer = null
let refreshDeadline = 0
let expiryDeadline = 0
let session = 0

const spacedShortCode = computed(() => {
  const value = code.value?.short_code || ''
  return `${value.slice(0, 3)} ${value.slice(3)}`
})

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('fr-CH', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
  : ''
const formatTime = (value) => value
  ? new Intl.DateTimeFormat('fr-CH', { timeStyle: 'short' }).format(new Date(value))
  : ''

const stateView = computed(() => ({
  loading: { icon: 'pi pi-spin pi-spinner', title: 'Préparation du QR code…', detail: 'Le premier code arrive.' },
  upcoming: {
    icon: 'pi pi-clock',
    title: 'L’événement n’a pas encore commencé',
    detail: `Le QR code s’affichera automatiquement à partir du ${formatDateTime(windowInfo.value.opens_at)}.`,
  },
  closed: {
    icon: 'pi pi-calendar-times',
    title: 'L’événement est terminé',
    detail: 'Les présences ne sont plus enregistrées. La liste reste disponible à l’export.',
  },
  unavailable: {
    icon: 'pi pi-ban',
    title: 'Événement non publié',
    detail: 'Publiez l’événement pour pouvoir enregistrer les présences.',
  },
  error: {
    icon: 'pi pi-exclamation-triangle',
    title: 'Le QR code n’a pas pu être renouvelé',
    detail: 'Vérifiez la connexion. Un nouvel essai est lancé automatiquement.',
  },
}[status.value] || { icon: 'pi pi-spin pi-spinner', title: '', detail: '' }))


function clearTimers() {
  window.clearTimeout(refreshTimer)
  window.clearInterval(tickTimer)
  window.clearInterval(pollTimer)
  refreshTimer = tickTimer = pollTimer = null
}

function scheduleRefresh(delay) {
  window.clearTimeout(refreshTimer)
  refreshTimer = window.setTimeout(refreshCode, Math.max(1000, delay))
}

function tick() {
  const now = Date.now()
  secondsLeft.value = Math.max(0, Math.ceil((refreshDeadline - now) / 1000))
  // Sans réseau, on n'affiche jamais un code que le serveur refuserait.
  if (status.value === 'open' && expiryDeadline && now > expiryDeadline) {
    qrImage.value = ''
    status.value = 'error'
  }
}

async function refreshCode() {
  const current = session
  try {
    const result = await issueEventCheckinCode(props.event.id)
    if (current !== session) return
    windowInfo.value = result || {}

    if (!result?.issued) {
      status.value = result?.state || 'error'
      qrImage.value = ''
      code.value = null
      if (status.value === 'upcoming') scheduleRefresh(WAITING_RETRY_MS)
      else if (status.value === 'error') scheduleRefresh(RETRY_MS)
      return
    }

    // Les échéances sont recalées sur l'horloge du serveur (celle du poste peut dériver).
    const serverNow = new Date(result.server_now).getTime()
    const untilRefresh = new Date(result.refresh_at).getTime() - serverNow
    const untilExpiry = new Date(result.expires_at).getTime() - serverNow
    const image = await QRCode.toDataURL(buildScanUrl(result.token), {
      width: 720,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    })
    if (current !== session) return

    code.value = result
    qrImage.value = image
    status.value = 'open'
    rotationSeconds.value = Math.max(1, Math.round((new Date(result.refresh_at) - new Date(result.issued_at)) / 1000))
    refreshDeadline = Date.now() + untilRefresh
    expiryDeadline = Date.now() + untilExpiry
    tick()
    scheduleRefresh(Math.min(untilRefresh, untilExpiry - 2000))
  } catch (error) {
    if (current !== session) return
    console.error('Renouvellement du QR code impossible:', error)
    if (!qrImage.value || Date.now() > expiryDeadline) {
      qrImage.value = ''
      status.value = 'error'
    }
    scheduleRefresh(RETRY_MS)
  }
}

async function loadAttendance() {
  const current = session
  try {
    const result = await getEventAttendance(props.event.id)
    if (current !== session) return
    attendees.value = result?.attendees || []
    attendanceError.value = false
    emit('attendance', attendees.value.length)
  } catch (error) {
    if (current !== session) return
    console.error('Liste des présents indisponible:', error)
    attendanceError.value = true
  }
}

function open() {
  session += 1
  status.value = 'loading'
  code.value = null
  qrImage.value = ''
  attendees.value = []
  attendanceError.value = false
  refreshCode()
  loadAttendance()
  tickTimer = window.setInterval(tick, 500)
  pollTimer = window.setInterval(loadAttendance, ATTENDANCE_POLL_MS)
  document.addEventListener('fullscreenchange', onFullscreenChange)
}

function shutdown() {
  session += 1
  clearTimers()
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
}

function close() {
  emit('update:visible', false)
}

function onFullscreenChange() {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  } catch {
    // Plein écran refusé par le navigateur : l'écran reste utilisable tel quel.
  }
}

function exportList() {
  downloadAttendanceCsv(props.event.title, attendees.value)
}

watch(() => props.visible, (visible) => (visible ? open() : shutdown()), { immediate: true })
onBeforeUnmount(shutdown)
</script>

<style scoped>
.presenter { display: flex; flex-direction: column; gap: 1.25rem; min-height: 100%; color: var(--text-color); }
.presenter__header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.presenter__header h2 { margin: 0; font-size: clamp(1.4rem, 3vw, 2.4rem); line-height: 1.15; overflow-wrap: anywhere; }
.presenter__eyebrow { margin: 0 0 .3rem; color: var(--text-color-secondary); font-size: .85rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.presenter__header-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
.presenter__body { display: grid; flex: 1; gap: 1.5rem; align-items: start; }
.presenter__code { display: grid; justify-items: center; gap: .9rem; text-align: center; }
.presenter__qr { width: min(100%, 52vh, 640px); height: auto; aspect-ratio: 1; border-radius: 16px; background: #fff; }
.presenter__instructions { max-width: 46ch; margin: 0; color: var(--text-color-secondary); line-height: 1.5; }
.presenter__short { display: grid; gap: .2rem; margin: 0; }
.presenter__short span { color: var(--text-color-secondary); }
.presenter__short strong { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: clamp(2rem, 5vw, 3.4rem); letter-spacing: .14em; }
.presenter__countdown { display: grid; gap: .45rem; width: min(100%, 420px); color: var(--text-color-secondary); font-variant-numeric: tabular-nums; }
.presenter__countdown-bar { overflow: hidden; height: 6px; border-radius: 999px; background: var(--surface-border); }
.presenter__countdown-bar span { display: block; height: 100%; border-radius: inherit; background: #f3c300; transform-origin: left; transition: transform 500ms linear; }
.presenter__state { display: grid; justify-items: center; gap: .7rem; max-width: 46ch; padding: 3rem 1rem; }
.presenter__state > i { color: var(--text-color-secondary); font-size: 2.5rem; }
.presenter__state h3, .presenter__state p { margin: 0; }
.presenter__state p { color: var(--text-color-secondary); line-height: 1.55; }
.presenter__attendance { padding: 1.15rem; border: 1px solid var(--surface-border); border-radius: 16px; background: var(--surface-card); }
.presenter__attendance-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: .9rem; }
.presenter__count { display: flex; align-items: baseline; gap: .5rem; margin: 0; }
.presenter__count strong { font-size: clamp(2.2rem, 5vw, 3.5rem); font-variant-numeric: tabular-nums; line-height: 1; }
.presenter__count span { color: var(--text-color-secondary); font-size: 1.1rem; }
.presenter__empty, .presenter__attendance-error { margin: 0 0 .6rem; color: var(--text-color-secondary); line-height: 1.5; }
.presenter__attendance-error { color: var(--red-300, #fca5a5); }
.presenter__list { display: grid; gap: .35rem; max-height: 52vh; margin: 0; padding: 0; overflow-y: auto; list-style: none; }
.presenter__list li { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .25rem .75rem; padding: .55rem .7rem; border-radius: 10px; background: var(--surface-section); }
.presenter__name { font-weight: 600; overflow-wrap: anywhere; }
.presenter__meta { color: var(--text-color-secondary); font-size: .9rem; font-variant-numeric: tabular-nums; white-space: nowrap; }

@media (min-width: 960px) {
  .presenter__body { grid-template-columns: minmax(0, 1.5fr) minmax(300px, 1fr); }
  .presenter__list { max-height: 68vh; }
}
@media (prefers-reduced-motion: reduce) {
  .presenter__countdown-bar span { transition: none; }
}
</style>

<style>
/* La fenêtre est rattachée à <body> : ces règles ne peuvent pas être « scoped ». */
.p-dialog.checkin-presenter {
  width: 100vw;
  max-width: 100vw;
  height: 100dvh;
  max-height: 100dvh;
  margin: 0;
  border-radius: 0;
}
.p-dialog.checkin-presenter .checkin-presenter__content {
  flex: 1;
  padding: 1.25rem;
  border-radius: 0;
  background: var(--surface-ground);
}
</style>
