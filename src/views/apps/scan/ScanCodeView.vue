<template>
  <Navbar />
  <main class="scan-page" data-page-scroll>
    <div class="scan-shell">
      <GamificationPageHeader
        title="Présences"
        description="Scannez le QR code affiché pendant un événement pour enregistrer votre présence."
        icon="pi pi-qrcode"
        @back="goBack"
      />

      <section class="scan-panel" aria-labelledby="scan-title">
        <h2 id="scan-title">Enregistrer ma présence</h2>

        <div v-if="checking" class="scan-result" role="status" aria-busy="true">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <div><h3>Validation en cours…</h3><p>Le code est en cours de vérification.</p></div>
        </div>

        <div
          v-else-if="outcome"
          ref="resultElement"
          class="scan-result"
          :class="`scan-result--${outcome.severity}`"
          :role="outcome.success ? 'status' : 'alert'"
          tabindex="-1"
        >
          <i :class="outcome.icon" aria-hidden="true"></i>
          <div>
            <h3>{{ outcome.title }}</h3>
            <p v-if="outcome.eventTitle" class="scan-result__event">{{ outcome.eventTitle }}</p>
            <p>{{ outcome.detail }}</p>
            <div class="scan-result__actions">
              <Button
                :label="outcome.success ? 'Scanner un autre code' : 'Réessayer'"
                icon="pi pi-qrcode"
                :outlined="outcome.success"
                @click="restart"
              />
              <Button
                v-if="outcome.success && profileEnabled"
                label="Voir ma progression"
                icon="pi pi-compass"
                text
                @click="router.push('/gamification-profile')"
              />
            </div>
          </div>
        </div>

        <template v-else>
          <QrCodeScanner v-if="cameraOpen" @decoded="onDecoded" />
          <div v-else class="scan-start">
            <p>Ouvrez l’appareil photo et visez le QR code projeté par l’organisateur.</p>
            <Button label="Scanner un QR code" icon="pi pi-camera" size="large" @click="cameraOpen = true" />
          </div>

          <p v-if="scanHint" class="scan-hint" role="alert">{{ scanHint }}</p>

          <form class="code-form" novalidate @submit.prevent="submitManualCode">
            <label for="scan-short-code">Appareil photo indisponible ? Saisissez le code à 6 caractères affiché sous le QR code.</label>
            <div class="code-form__row">
              <InputText
                id="scan-short-code"
                v-model="manualCode"
                class="code-form__input"
                maxlength="8"
                autocomplete="off"
                autocapitalize="characters"
                autocorrect="off"
                spellcheck="false"
                placeholder="Ex. ABC234"
                :invalid="Boolean(manualError)"
                aria-describedby="scan-short-code-error"
              />
              <Button type="submit" label="Valider" icon="pi pi-check" outlined />
            </div>
            <small id="scan-short-code-error" class="code-form__error" role="alert">{{ manualError }}</small>
          </form>
        </template>
      </section>

      <section class="scan-panel" aria-labelledby="attendance-title">
        <div class="attendance-heading">
          <h2 id="attendance-title">Mes présences</h2>
          <span v-if="attendances.length" class="attendance-count">{{ attendances.length }}</span>
        </div>

        <div v-if="attendancesLoading" class="attendance-state" role="status" aria-busy="true">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i><span>Chargement de vos présences…</span>
        </div>
        <div v-else-if="attendancesError" class="attendance-state" role="alert">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <span>Vos présences n’ont pas pu être chargées.</span>
          <Button label="Réessayer" text @click="loadAttendances" />
        </div>
        <p v-else-if="!attendances.length" class="attendance-empty">
          Aucune présence enregistrée pour l’instant. Votre première validation apparaîtra ici.
        </p>
        <ol v-else class="attendance-list">
          <li v-for="item in attendances" :key="item.event_id">
            <span class="attendance-icon" aria-hidden="true"><i class="pi pi-calendar"></i></span>
            <span class="attendance-copy">
              <strong>{{ item.title }}</strong>
              <small>{{ formatDate(item.start_date) }}<template v-if="item.lieu"> · {{ item.lieu }}</template></small>
            </span>
            <span v-if="Number(item.xp_awarded) > 0" class="attendance-xp">+{{ item.xp_awarded }} XP</span>
            <span v-else class="attendance-xp attendance-xp--none">Présent·e</span>
          </li>
        </ol>
      </section>
    </div>
  </main>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Navbar from '@/components/common/utils/Navbar.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import QrCodeScanner from '@/components/scan/QrCodeScanner.vue'
import { gamificationFeatures } from '@/config/gamificationFeatures'
import {
  describeScanResult,
  extractScanCode,
  getMyEventAttendances,
  isValidShortCode,
  redeemScanCode,
} from '@/service/eventCheckinService'

const route = useRoute()
const router = useRouter()
const profileEnabled = gamificationFeatures.userJourney

const cameraOpen = ref(route.query.camera === '1')
const checking = ref(false)
const outcome = ref(null)
const scanHint = ref('')
const manualCode = ref('')
const manualError = ref('')
const resultElement = ref(null)

const attendances = ref([])
const attendancesLoading = ref(true)
const attendancesError = ref(false)

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('fr-CH', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
  : ''

async function loadAttendances() {
  attendancesLoading.value = true
  attendancesError.value = false
  try {
    attendances.value = await getMyEventAttendances()
  } catch (error) {
    console.error('Chargement des présences impossible:', error)
    attendancesError.value = true
  } finally {
    attendancesLoading.value = false
  }
}

async function validate(rawCode) {
  if (checking.value) return
  checking.value = true
  scanHint.value = ''
  cameraOpen.value = false
  const result = await redeemScanCode(rawCode)
  outcome.value = describeScanResult(result)
  checking.value = false
  if (result.status === 'ok') loadAttendances()
  await nextTick()
  resultElement.value?.focus()
}

function onDecoded(text) {
  // Un QR code étranger (affiche, site web) ne ferme pas l'appareil photo.
  if (!extractScanCode(text)) {
    scanHint.value = 'Ce QR code n’est pas un code de la plateforme. Visez celui de l’événement.'
    return
  }
  validate(text)
}

function submitManualCode() {
  if (!isValidShortCode(manualCode.value)) {
    manualError.value = 'Le code comporte 6 lettres ou chiffres, par exemple ABC234.'
    return
  }
  manualError.value = ''
  const code = manualCode.value
  manualCode.value = ''
  validate(code)
}

function restart() {
  outcome.value = null
  scanHint.value = ''
  cameraOpen.value = true
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push(profileEnabled ? '/gamification-profile' : '/feed')
}

onMounted(async () => {
  loadAttendances()
  // Arrivée par le lien du QR code (appareil photo du téléphone) : valider tout de suite,
  // puis retirer le code de l'adresse pour qu'un rechargement ne le rejoue pas.
  const code = typeof route.query.c === 'string' ? route.query.c : ''
  if (code) {
    await router.replace({ path: route.path })
    validate(code)
  }
})
</script>

<style scoped>
.scan-page { box-sizing: border-box; width: 100%; min-height: 100%; padding: 1rem 1rem 6rem; color: var(--text-color); background: transparent; }
.scan-shell { width: min(100%, 760px); margin: 0 auto; }
.scan-panel { margin-top: 1.25rem; padding: 1.15rem; border-radius: 16px; background: var(--surface-card); }
.scan-panel h2 { margin: 0 0 1rem; font-size: 1.25rem; }
.scan-panel h3 { margin: 0 0 .3rem; font-size: 1.1rem; }
.scan-panel p { margin: 0; line-height: 1.55; }
.scan-start { display: grid; justify-items: center; gap: 1rem; padding: 1rem 0 .5rem; text-align: center; }
.scan-start p, .attendance-empty { color: var(--text-color-secondary); }
.scan-hint { margin-top: .75rem !important; color: var(--text-color); text-align: center; }

.scan-result { display: flex; align-items: flex-start; gap: .9rem; padding: 1rem; border: 1px solid var(--surface-border); border-left-width: 4px; border-radius: 12px; background: var(--surface-section); }
.scan-result:focus-visible { outline: 3px solid var(--text-color); outline-offset: 3px; }
.scan-result > i { margin-top: .15rem; font-size: 1.6rem; }
.scan-result--success { border-left-color: var(--green-400, #4ade80); }
.scan-result--success > i { color: var(--green-400, #4ade80); }
.scan-result--info { border-left-color: var(--blue-300, #93c5fd); }
.scan-result--info > i { color: var(--blue-300, #93c5fd); }
.scan-result--warn { border-left-color: var(--yellow-400, #facc15); }
.scan-result--warn > i { color: var(--yellow-400, #facc15); }
.scan-result--error { border-left-color: var(--red-300, #fca5a5); }
.scan-result--error > i { color: var(--red-300, #fca5a5); }
.scan-result__event { font-weight: 700; }
.scan-result__actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .9rem; }

.code-form { display: grid; gap: .5rem; margin-top: 1.25rem; padding-top: 1.1rem; border-top: 1px solid var(--surface-border); }
.code-form label { color: var(--text-color-secondary); line-height: 1.45; }
.code-form__row { display: flex; flex-wrap: wrap; gap: .5rem; }
.code-form__input { flex: 1 1 11rem; min-height: 44px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1.15rem; letter-spacing: .18em; text-transform: uppercase; }
.code-form__error { min-height: 1.3em; color: var(--red-300, #fca5a5); }

.attendance-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.attendance-heading h2 { margin: 0; }
.attendance-count { min-width: 2rem; padding: .2rem .6rem; border-radius: 999px; font-weight: 700; text-align: center; background: var(--surface-section); }
.attendance-state { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; color: var(--text-color-secondary); }
.attendance-list { display: grid; gap: .55rem; margin: 0; padding: 0; list-style: none; }
.attendance-list li { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center; gap: .8rem; min-height: 68px; padding: .7rem .8rem; border: 1px solid var(--surface-border); border-radius: 12px; background: var(--surface-section); }
.attendance-icon { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 12px; color: var(--text-color); background: var(--surface-hover); }
.attendance-copy { min-width: 0; }
.attendance-copy strong, .attendance-copy small { display: block; overflow-wrap: anywhere; }
.attendance-copy small { margin-top: .2rem; color: var(--text-color-secondary); line-height: 1.35; }
.attendance-xp { font-weight: 700; white-space: nowrap; }
.attendance-xp--none { color: var(--text-color-secondary); font-weight: 600; }

@media (min-width: 700px) {
  .scan-page { padding: 1.5rem 1.5rem 7rem; }
  .scan-panel { padding: 1.5rem; }
}
</style>
