<template>
  <div class="qr-scanner" :data-state="state">
    <div class="qr-scanner__viewport">
      <video
        ref="videoElement"
        class="qr-scanner__video"
        playsinline
        muted
        aria-label="Aperçu de l’appareil photo"
      ></video>
      <div v-if="state === 'scanning'" class="qr-scanner__frame" aria-hidden="true"></div>
      <div v-if="state !== 'scanning'" class="qr-scanner__overlay">
        <template v-if="state === 'starting'">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <p>Ouverture de l’appareil photo…</p>
        </template>
        <template v-else-if="state === 'idle'">
          <i class="pi pi-camera" aria-hidden="true"></i>
          <p>L’appareil photo est en pause.</p>
          <Button label="Activer l’appareil photo" icon="pi pi-camera" @click="start" />
        </template>
        <template v-else>
          <i class="pi pi-video" aria-hidden="true"></i>
          <p>{{ problemMessage }}</p>
          <Button label="Réessayer" icon="pi pi-refresh" outlined @click="start" />
        </template>
      </div>
    </div>
    <p class="qr-scanner__status" role="status" aria-live="polite">{{ statusMessage }}</p>
  </div>
</template>

<script setup>
// Lecteur de QR code réutilisable (présence aux événements, chasse au trésor…).
// Il ne fait que lire : il émet le texte du QR, le parent décide quoi en faire.
// Lecture native (BarcodeDetector) quand le navigateur la propose, sinon jsQR,
// chargé à la demande pour ne pas alourdir le reste de l'application.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Button from 'primevue/button'

const props = defineProps({
  autoStart: { type: Boolean, default: true },
})
const emit = defineEmits(['decoded', 'unavailable'])

const videoElement = ref(null)
// idle | starting | scanning | denied | unavailable
const state = ref('idle')

const SCAN_INTERVAL_MS = 180
const MAX_FRAME_SIDE = 720

let stream = null
let timer = null
let detector = null
let decodeWithJsQr = null
let canvas = null
let lastValue = ''
let lastValueAt = 0
let stopped = true

const problemMessage = computed(() => state.value === 'denied'
  ? 'L’accès à l’appareil photo est refusé. Autorisez-le dans les réglages du navigateur, ou saisissez le code affiché sous le QR code.'
  : 'Aucun appareil photo utilisable sur cet appareil. Saisissez le code affiché sous le QR code.')

const statusMessage = computed(() => ({
  scanning: 'Placez le QR code dans le cadre.',
  starting: '',
  idle: '',
  denied: 'Appareil photo refusé.',
  unavailable: 'Appareil photo indisponible.',
}[state.value]))

async function prepareDecoder() {
  if (detector || decodeWithJsQr) return
  if ('BarcodeDetector' in window) {
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats()
      if (formats.includes('qr_code')) {
        detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        return
      }
    } catch {
      detector = null
    }
  }
  const module = await import('jsqr')
  decodeWithJsQr = module.default
}

async function readFrame() {
  const video = videoElement.value
  if (!video || video.readyState < 2 || !video.videoWidth) return null

  if (detector) {
    const codes = await detector.detect(video)
    return codes[0]?.rawValue || null
  }

  const scale = Math.min(1, MAX_FRAME_SIDE / Math.max(video.videoWidth, video.videoHeight))
  const width = Math.round(video.videoWidth * scale)
  const height = Math.round(video.videoHeight * scale)
  canvas ||= document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(video, 0, 0, width, height)
  const image = context.getImageData(0, 0, width, height)
  return decodeWithJsQr(image.data, width, height, { inversionAttempts: 'dontInvert' })?.data || null
}

function scheduleNextFrame() {
  if (stopped) return
  timer = window.setTimeout(async () => {
    try {
      const value = await readFrame()
      const now = Date.now()
      // Le même code reste devant l'objectif : on ne l'émet qu'une fois toutes les 3 s.
      if (value && (value !== lastValue || now - lastValueAt > 3000)) {
        lastValue = value
        lastValueAt = now
        emit('decoded', value)
      }
    } catch {
      // Une image illisible n'arrête pas la lecture.
    }
    scheduleNextFrame()
  }, SCAN_INTERVAL_MS)
}

function releaseCamera() {
  stopped = true
  if (timer) window.clearTimeout(timer)
  timer = null
  stream?.getTracks().forEach((track) => track.stop())
  stream = null
  if (videoElement.value) videoElement.value.srcObject = null
}

function stop() {
  releaseCamera()
  if (state.value === 'scanning' || state.value === 'starting') state.value = 'idle'
}

async function start() {
  if (state.value === 'starting' || state.value === 'scanning') return
  if (!navigator.mediaDevices?.getUserMedia) {
    state.value = 'unavailable'
    emit('unavailable', 'unavailable')
    return
  }

  state.value = 'starting'
  try {
    const [mediaStream] = await Promise.all([
      navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      }),
      prepareDecoder(),
    ])
    // Le composant a pu être fermé pendant la demande d'autorisation.
    if (!videoElement.value) {
      mediaStream.getTracks().forEach((track) => track.stop())
      return
    }
    stream = mediaStream
    videoElement.value.srcObject = mediaStream
    await videoElement.value.play()
    stopped = false
    state.value = 'scanning'
    scheduleNextFrame()
  } catch (error) {
    releaseCamera()
    const denied = ['NotAllowedError', 'SecurityError', 'PermissionDeniedError'].includes(error?.name)
    state.value = denied ? 'denied' : 'unavailable'
    emit('unavailable', state.value)
  }
}

function handleVisibility() {
  // Libère l'appareil photo quand l'onglet passe en arrière-plan.
  if (document.hidden && state.value === 'scanning') stop()
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibility)
  if (props.autoStart) start()
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibility)
  releaseCamera()
})

defineExpose({ start, stop, state })
</script>

<style scoped>
.qr-scanner { display: grid; gap: .6rem; }
.qr-scanner__viewport {
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  aspect-ratio: 1;
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  background: var(--surface-ground);
}
.qr-scanner__video { width: 100%; height: 100%; object-fit: cover; }
.qr-scanner__frame {
  position: absolute;
  inset: 14%;
  border: 3px solid #f3c300;
  border-radius: 14px;
  pointer-events: none;
}
.qr-scanner__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .85rem;
  padding: 1.25rem;
  color: var(--text-color);
  text-align: center;
  background: var(--surface-card);
}
.qr-scanner__overlay > i { color: var(--text-color-secondary); font-size: 2rem; }
.qr-scanner__overlay p { max-width: 32ch; margin: 0; line-height: 1.5; }
.qr-scanner__status { min-height: 1.4em; margin: 0; color: var(--text-color-secondary); text-align: center; }
</style>
