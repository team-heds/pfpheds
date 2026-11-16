<template>
  <main class="print-page">
    <div class="print-toolbar" role="region" aria-label="Impression">
      <Button label="Retour" icon="pi pi-arrow-left" text class="print-toolbar__back" @click="router.push(`${TREASURE_HUNT_MANAGE_PATH}/${id}`)" />
      <div class="print-toolbar__copy">
        <h1>QR codes à imprimer</h1>
        <p v-if="hunt">{{ sheets.length }} page{{ sheets.length > 1 ? 's' : '' }} A4, une par étape<template v-if="disabledCount">, {{ disabledCount }} étape{{ disabledCount > 1 ? 's' : '' }} désactivée{{ disabledCount > 1 ? 's' : '' }} non imprimée{{ disabledCount > 1 ? 's' : '' }}</template>.</p>
      </div>
      <Button label="Imprimer" icon="pi pi-print" class="print-toolbar__print" :disabled="!ready" @click="print" />
    </div>

    <p v-if="loading" class="print-state" role="status">Préparation des QR codes…</p>
    <p v-else-if="error" class="print-state" role="alert">{{ error }}</p>
    <p v-else-if="!sheets.length" class="print-state">Aucune étape active à imprimer.</p>

    <template v-else>
    <section
      v-for="sheet in sheets"
      :key="sheet.id"
      class="sheet"
      :aria-label="`Étape ${sheet.position}`"
    >
      <header class="sheet__head">
        <p class="sheet__eyebrow">Chasse au trésor · HEdS</p>
        <h2 class="sheet__title">{{ hunt.title }}</h2>
      </header>

      <div class="sheet__step">
        <span class="sheet__number">Étape {{ sheet.position }}<template v-if="hunt.ordered"> sur {{ steps.length }}</template></span>
        <span class="sheet__xp">+{{ sheet.xp_reward }} XP</span>
      </div>

      <img class="sheet__qr" :src="sheet.image" :alt="`QR code de l’étape ${sheet.position}`" />

      <p class="sheet__scan">Scannez avec l’appareil photo de votre téléphone<br />ou avec le scanner de la plateforme.</p>

      <div class="sheet__fallback">
        <span>Code de secours</span>
        <strong>{{ formatShortCode(sheet.short_code) }}</strong>
        <small>à saisir dans {{ host }}/scan</small>
      </div>

      <footer class="sheet__foot">
        <span>{{ sheet.name }}</span>
        <span>{{ formatHuntPeriod(hunt.starts_at, hunt.ends_at) }}</span>
      </footer>
    </section>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import Button from 'primevue/button'
import { buildScanUrl } from '@/service/eventCheckinService'
import {
  TREASURE_HUNT_MANAGE_PATH,
  formatHuntPeriod,
  manageGetTreasureHunt,
  treasureErrorMessage,
} from '@/service/treasureHuntService'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()

const loading = ref(true)
const error = ref('')
const hunt = ref(null)
const steps = ref([])
const sheets = ref([])
const host = window.location.host
const ready = computed(() => !loading.value && sheets.value.length > 0)
const disabledCount = computed(() => steps.value.filter((step) => !step.code_active).length)

const formatShortCode = (code) => String(code || '').replace(/^(.{3})(.{3})$/, '$1 $2')

function print() {
  window.print()
}

onMounted(async () => {
  try {
    const data = await manageGetTreasureHunt(props.id)
    if (!data?.found) {
      error.value = 'Cette chasse n’existe plus.'
      return
    }
    hunt.value = data.hunt
    steps.value = data.steps || []
    document.title = `QR codes – ${data.hunt.title}`
    sheets.value = await Promise.all(steps.value
      .filter((step) => step.code_active && step.token)
      .map(async (step) => ({
        ...step,
        // Correction d'erreur élevée : le code reste lisible s'il est un peu abîmé.
        image: await QRCode.toDataURL(buildScanUrl(step.token), { margin: 2, width: 900, errorCorrectionLevel: 'H' }),
      })))
  } catch (cause) {
    console.error('Préparation de l’impression impossible:', cause)
    error.value = treasureErrorMessage(cause, 'Les QR codes n’ont pas pu être préparés. Réessayez.')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.print-page { min-height: 100vh; padding: 0 0 3rem; color: #071426; background: #e9edf2; font-family: Poppins, system-ui, sans-serif; }
.print-toolbar { position: sticky; top: 0; z-index: 2; display: flex; flex-wrap: wrap; align-items: center; gap: .75rem 1rem; padding: .75rem 1rem; color: #f8fafc; background: #071426; }
.print-toolbar__copy { flex: 1 1 14rem; }
.print-toolbar h1 { margin: 0; font-size: 1.1rem; }
.print-toolbar p { margin: .15rem 0 0; color: #cbd5e1; font-size: .9rem; }
.print-toolbar__back.p-button { min-height: 44px; color: #f8fafc; }
.print-toolbar__print.p-button { min-height: 44px; border-color: #f3c300; color: #071426; background: #f3c300; }
.print-state { margin: 2rem auto; max-width: 40rem; padding: 0 1rem; text-align: center; }

.sheet {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100% - 2rem, 210mm);
  min-height: 297mm;
  margin: 1.5rem auto;
  padding: 16mm 16mm 12mm;
  border-top: 10mm solid #f3c300;
  background: #fff;
  box-shadow: 0 6px 24px rgba(7, 20, 38, .18);
  text-align: center;
}
.sheet__head { width: 100%; }
.sheet__eyebrow { margin: 0; color: #475569; font-size: 12pt; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
.sheet__title { margin: 3mm 0 0; font-size: 26pt; line-height: 1.15; overflow-wrap: anywhere; }
.sheet__step { display: flex; align-items: center; justify-content: center; gap: 6mm; margin-top: 8mm; }
.sheet__number { font-size: 22pt; font-weight: 700; }
.sheet__xp { padding: 1.5mm 4mm; border-radius: 999px; background: #071426; color: #f3c300; font-size: 16pt; font-weight: 700; }
.sheet__qr { width: 120mm; max-width: 100%; height: auto; margin-top: 8mm; image-rendering: pixelated; }
.sheet__scan { margin: 6mm 0 0; font-size: 14pt; line-height: 1.4; }
.sheet__fallback { display: grid; gap: 1mm; margin-top: 7mm; padding: 4mm 10mm; border: 0.6mm dashed #94a3b8; border-radius: 4mm; }
.sheet__fallback span { color: #475569; font-size: 11pt; }
.sheet__fallback strong { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 26pt; letter-spacing: .15em; }
.sheet__fallback small { color: #475569; font-size: 10pt; }
.sheet__foot { display: flex; justify-content: space-between; gap: 8mm; width: 100%; margin-top: auto; padding-top: 6mm; border-top: 0.3mm solid #cbd5e1; color: #64748b; font-size: 9pt; text-align: left; }

@media (max-width: 640px) {
  .sheet { min-height: 0; padding: 1.25rem 1rem; border-top-width: .5rem; }
  .sheet__title { font-size: 1.4rem; }
  .sheet__number { font-size: 1.2rem; }
  .sheet__xp { font-size: 1rem; }
  .sheet__scan { font-size: 1rem; }
  .sheet__fallback strong { font-size: 1.5rem; }
}

@media print {
  @page { size: A4 portrait; margin: 0; }
  .print-page { padding: 0; background: #fff; }
  .print-toolbar, .print-state { display: none; }
  .sheet {
    width: 210mm;
    height: 297mm;
    min-height: 0;
    margin: 0;
    box-shadow: none;
    break-after: page;
    page-break-after: always;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet:last-of-type { break-after: auto; page-break-after: auto; }
}
</style>

<style>
/* Impression : seule la page des QR codes sort, sans les éléments communs de l'application. */
@media print {
  .skip-link, .p-toast, .pwa-install-prompt, .offline-banner, .version-badge { display: none !important; }
}
</style>
