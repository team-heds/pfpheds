<template>
  <section v-if="overview?.found && (overview.can_manage || participantVisible)" class="checkin" aria-labelledby="checkin-title">
    <h3 id="checkin-title"><i class="pi pi-qrcode" aria-hidden="true"></i> Présence par QR code</h3>

    <template v-if="overview.can_manage">
      <p class="checkin__text">
        Affichez le QR code pendant l’événement : chaque personne présente le scanne avec la plateforme.
        {{ windowText }}
      </p>
      <div class="checkin__settings">
        <label :for="inputId">Points accordés par présence (de {{ MIN_CHECKIN_XP }} à {{ MAX_CHECKIN_XP }})</label>
        <InputNumber
          v-model="xpReward"
          :input-id="inputId"
          :min="MIN_CHECKIN_XP"
          :max="MAX_CHECKIN_XP"
          :step="5"
          show-buttons
          suffix=" XP"
          :disabled="saving"
        />
      </div>
      <p v-if="errorMessage" class="checkin__error" role="alert">{{ errorMessage }}</p>
      <div class="checkin__actions">
        <Button
          label="Afficher le QR code de présence"
          icon="pi pi-qrcode"
          :loading="saving"
          :disabled="overview.state === 'unavailable'"
          @click="openPresenter"
        />
        <span class="checkin__count" aria-live="polite">
          {{ attendeeCount }} {{ attendeeCount > 1 ? 'présents' : 'présent' }}
        </span>
      </div>
      <EventCheckinPresenter
        v-if="presenterMounted"
        v-model:visible="presenterVisible"
        :event="event"
        @attendance="attendeeCount = $event"
      />
    </template>

    <template v-else>
      <p v-if="overview.my_attendance" class="checkin__done" role="status">
        <i class="pi pi-check-circle" aria-hidden="true"></i>
        Votre présence est enregistrée<template v-if="Number(overview.my_attendance.xp_awarded) > 0"> (+{{ overview.my_attendance.xp_awarded }} XP)</template>.
      </p>
      <template v-else>
        <p class="checkin__text">Sur place, scannez le QR code affiché par l’organisateur pour enregistrer votre présence.</p>
        <div class="checkin__actions">
          <Button label="Scanner un QR code" icon="pi pi-camera" @click="router.push({ path: '/scan', query: { camera: '1' } })" />
        </div>
      </template>
    </template>
  </section>
</template>

<script setup>
// Bloc « présence » de la fiche d'un événement. Le serveur dit qui peut organiser
// (enseignants, administration, maîtres du jeu) ; les autres voient leur propre présence.
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import EventCheckinPresenter from '@/components/events/EventCheckinPresenter.vue'
import {
  DEFAULT_CHECKIN_XP,
  MAX_CHECKIN_XP,
  MIN_CHECKIN_XP,
  configureEventCheckin,
  getEventCheckinOverview,
} from '@/service/eventCheckinService'

const props = defineProps({ event: { type: Object, required: true } })

const router = useRouter()
const inputId = `checkin-xp-${props.event.id}`
const overview = ref(null)
const xpReward = ref(DEFAULT_CHECKIN_XP)
const savedXpReward = ref(DEFAULT_CHECKIN_XP)
const attendeeCount = ref(0)
const saving = ref(false)
const errorMessage = ref('')
const presenterMounted = ref(false)
const presenterVisible = ref(false)

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('fr-CH', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
  : ''

// Un participant ne voit le bloc que s'il a quelque chose à y faire ou à y lire.
const participantVisible = computed(() => Boolean(overview.value?.my_attendance) || overview.value?.state === 'open')

const windowText = computed(() => ({
  upcoming: `Les scans seront acceptés à partir du ${formatDateTime(overview.value?.opens_at)}.`,
  open: `Les scans sont acceptés jusqu’au ${formatDateTime(overview.value?.closes_at)}.`,
  closed: 'L’événement est terminé : les scans ne sont plus acceptés, la liste reste exportable.',
  unavailable: 'Publiez l’événement pour pouvoir enregistrer les présences.',
}[overview.value?.state] || ''))

async function load() {
  try {
    const data = await getEventCheckinOverview(props.event.id)
    overview.value = data
    if (data?.found) {
      xpReward.value = savedXpReward.value = Number(data.xp_reward) || DEFAULT_CHECKIN_XP
      attendeeCount.value = Number(data.attendee_count) || 0
    }
  } catch (error) {
    // Module non installé côté serveur ou réseau coupé : la fiche reste utilisable sans ce bloc.
    console.warn('Présence par QR code indisponible:', error?.message || error)
    overview.value = null
  }
}

async function openPresenter() {
  errorMessage.value = ''
  const wanted = Math.round(Number(xpReward.value))
  if (!Number.isFinite(wanted) || wanted < MIN_CHECKIN_XP || wanted > MAX_CHECKIN_XP) {
    errorMessage.value = `Indiquez un nombre de points entre ${MIN_CHECKIN_XP} et ${MAX_CHECKIN_XP}.`
    return
  }
  if (wanted !== savedXpReward.value) {
    saving.value = true
    try {
      await configureEventCheckin(props.event.id, wanted)
      savedXpReward.value = wanted
    } catch (error) {
      console.error('Réglage des points impossible:', error)
      errorMessage.value = 'Les points n’ont pas pu être enregistrés. Réessayez.'
      return
    } finally {
      saving.value = false
    }
  }
  presenterMounted.value = true
  presenterVisible.value = true
}

watch(() => props.event.id, load, { immediate: true })
</script>

<style scoped>
.checkin { margin-top: 1.5rem; padding: 1.25rem; border: 1px solid var(--surface-border); border-radius: .9rem; color: var(--text-color); background: var(--surface-section); }
.checkin h3 { display: flex; align-items: center; gap: .5rem; margin: 0 0 .6rem; font-size: 1.1rem; }
.checkin__text { margin: 0; color: var(--text-color-secondary); line-height: 1.55; }
.checkin__settings { display: grid; gap: .4rem; max-width: 22rem; margin-top: 1rem; }
.checkin__settings label { font-weight: 600; }
.checkin__actions { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem 1rem; margin-top: 1rem; }
.checkin__count { color: var(--text-color-secondary); font-variant-numeric: tabular-nums; }
.checkin__error { margin: .75rem 0 0; color: var(--red-300, #fca5a5); }
.checkin__done { display: flex; align-items: center; gap: .5rem; margin: 0; font-weight: 600; }
.checkin__done i { color: var(--green-400, #4ade80); }
</style>
