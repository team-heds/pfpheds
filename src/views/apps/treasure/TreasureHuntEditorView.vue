<template>
  <Navbar />
  <main class="th-page" data-page-scroll>
    <div class="th-shell">
      <GamificationPageHeader
        :title="isNew ? 'Nouvelle chasse au trésor' : (hunt?.title || 'Chasse au trésor')"
        description="Informations, étapes et QR codes. Une chasse reste invisible des joueurs tant qu’elle n’est pas publiée."
        eyebrow="Gestion"
        icon="pi pi-map"
        @back="router.push(TREASURE_HUNT_MANAGE_PATH)"
      >
        <template v-if="hunt" #actions>
          <Button
            label="Imprimer les QR codes"
            icon="pi pi-print"
            class="th-primary th-touch"
            :disabled="!steps.length"
            @click="router.push(`${TREASURE_HUNT_MANAGE_PATH}/${hunt.id}/impression`)"
          />
        </template>
      </GamificationPageHeader>

      <section v-if="loading" class="th-panel th-state" aria-busy="true" role="status">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <div><h2>Chargement</h2><p class="th-muted">Un instant…</p></div>
      </section>

      <section v-else-if="loadError" class="th-panel th-state" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <div>
          <h2>Chargement impossible</h2>
          <p class="th-muted">{{ loadError }}</p>
          <div class="th-actions th-gap"><Button label="Retour à la liste" icon="pi pi-arrow-left" @click="router.push(TREASURE_HUNT_MANAGE_PATH)" /></div>
        </div>
      </section>

      <template v-else>
        <!-- Publication -->
        <section v-if="hunt" class="th-panel publish" aria-labelledby="publish-title">
          <div>
            <h2 id="publish-title" class="publish__title">
              <Tag :value="huntStateLabel(hunt.state)" :severity="huntStateSeverity(hunt.state)" />
              {{ hunt.published ? 'Publiée' : 'Brouillon' }}
            </h2>
            <p class="th-muted">
              {{ hunt.published
                ? 'Les joueurs des classes visées voient la chasse et ses indices.'
                : 'Testez vos QR codes (sans points), puis publiez la chasse.' }}
            </p>
          </div>
          <div class="th-actions">
            <Button
              :label="hunt.published ? 'Dépublier' : 'Publier'"
              :icon="hunt.published ? 'pi pi-eye-slash' : 'pi pi-send'"
              :class="{ 'th-primary': !hunt.published }"
              :outlined="hunt.published"
              :loading="publishing"
              @click="togglePublished"
            />
            <Button label="Vue joueur" icon="pi pi-eye" text @click="router.push(`${TREASURE_HUNT_PATH}/${hunt.id}`)" />
          </div>
          <p v-if="publishError" class="th-error publish__error" role="alert">{{ publishError }}</p>
        </section>

        <!-- Informations -->
        <section class="th-panel" aria-labelledby="info-title">
          <h2 id="info-title" class="th-panel__title">Informations</h2>
          <form class="info-form" novalidate @submit.prevent="saveInfo">
            <div class="th-field info-form__wide">
              <label for="hunt-title">Titre</label>
              <InputText id="hunt-title" v-model="form.title" maxlength="120" aria-describedby="hunt-title-help" />
              <small id="hunt-title-help">Entre 3 et 120 caractères. Il est imprimé sur chaque QR code.</small>
            </div>
            <div class="th-field info-form__wide">
              <label for="hunt-description">Description</label>
              <Textarea id="hunt-description" v-model="form.description" rows="3" auto-resize maxlength="1000" />
            </div>
            <div class="th-field">
              <label for="hunt-starts">Début</label>
              <Calendar v-model="form.starts_at" input-id="hunt-starts" show-time hour-format="24" date-format="dd.mm.yy" show-icon />
            </div>
            <div class="th-field">
              <label for="hunt-ends">Fin</label>
              <Calendar v-model="form.ends_at" input-id="hunt-ends" show-time hour-format="24" date-format="dd.mm.yy" show-icon />
            </div>
            <div class="th-field">
              <label for="hunt-classes">Classes visées</label>
              <MultiSelect
                v-model="form.target_classes"
                input-id="hunt-classes"
                :options="classOptions"
                placeholder="Toutes les classes"
                display="chip"
                :show-toggle-all="false"
                aria-describedby="hunt-classes-help"
              />
              <small id="hunt-classes-help">Sans sélection, la chasse est ouverte à toutes les classes.</small>
            </div>
            <div class="th-field">
              <span id="hunt-order-label" class="th-field__label">Ordre des étapes</span>
              <div class="order-choice" role="radiogroup" aria-labelledby="hunt-order-label">
                <label class="order-choice__item">
                  <RadioButton v-model="form.ordered" :value="false" input-id="hunt-order-free" />
                  <span><strong>Libre</strong><small>Les étapes se trouvent dans n’importe quel ordre.</small></span>
                </label>
                <label class="order-choice__item">
                  <RadioButton v-model="form.ordered" :value="true" input-id="hunt-order-fixed" />
                  <span><strong>Imposé</strong><small>Chaque indice se dévoile après l’étape précédente.</small></span>
                </label>
              </div>
            </div>
            <p v-if="infoError" class="th-error info-form__wide" role="alert">{{ infoError }}</p>
            <div class="th-actions info-form__wide">
              <Button type="submit" :label="isNew ? 'Créer la chasse' : 'Enregistrer'" icon="pi pi-save" class="th-primary" :loading="savingInfo" />
            </div>
          </form>
        </section>

        <!-- Étapes -->
        <section v-if="hunt" class="th-panel" aria-labelledby="steps-title">
          <div class="steps-head">
            <h2 id="steps-title" class="th-panel__title">Étapes ({{ steps.length }})</h2>
            <Button label="Ajouter une étape" icon="pi pi-plus" outlined class="th-touch" :disabled="steps.length >= MAX_STEPS" @click="openStep(null)" />
          </div>
          <p v-if="!steps.length" class="th-muted">Ajoutez la première étape : un nom (pour vous), un indice (pour les joueurs) et des points.</p>
          <p v-if="stepsError" class="th-error" role="alert">{{ stepsError }}</p>
          <ol class="edit-steps">
            <li v-for="(step, index) in steps" :key="step.id" class="edit-step" :class="{ 'edit-step--off': !step.code_active }">
              <div class="edit-step__qr">
                <img v-if="step.code_active && qrImages[step.id]" :src="qrImages[step.id]" :alt="`QR code de l’étape ${step.position}`" width="96" height="96" />
                <span v-else class="edit-step__qr-off"><i class="pi pi-ban" aria-hidden="true"></i>Désactivé</span>
                <code v-if="step.code_active">{{ step.short_code }}</code>
              </div>
              <div class="edit-step__body">
                <h3>{{ step.position }}. {{ step.name }}</h3>
                <p class="edit-step__hint"><i class="pi pi-lightbulb" aria-hidden="true"></i>{{ step.hint }}</p>
                <p class="th-meta">
                  <span><i class="pi pi-star" aria-hidden="true"></i>{{ step.xp_reward }} XP</span>
                  <span><i class="pi pi-user" aria-hidden="true"></i>Trouvée {{ step.find_count }} fois</span>
                </p>
                <div class="th-actions edit-step__actions">
                  <Button icon="pi pi-arrow-up" text rounded :disabled="index === 0 || busy" :aria-label="`Monter l’étape ${step.position}`" @click="move(index, -1)" />
                  <Button icon="pi pi-arrow-down" text rounded :disabled="index === steps.length - 1 || busy" :aria-label="`Descendre l’étape ${step.position}`" @click="move(index, 1)" />
                  <Button label="Modifier" icon="pi pi-pencil" text :disabled="busy" @click="openStep(step)" />
                  <Button
                    :label="step.code_active ? 'Nouveau QR' : 'Réactiver (nouveau QR)'"
                    icon="pi pi-refresh"
                    text
                    :disabled="busy"
                    @click="confirmRenew(step, false)"
                  />
                  <Button v-if="step.code_active" label="Désactiver le QR" icon="pi pi-ban" text :disabled="busy" @click="confirmRenew(step, true)" />
                  <Button label="Supprimer" icon="pi pi-trash" text severity="danger" :disabled="busy || step.find_count > 0" @click="confirmDeleteStep(step)" />
                </div>
              </div>
            </li>
          </ol>
        </section>

        <!-- Suivi -->
        <section v-if="hunt && ranking.player_count" class="th-panel" aria-labelledby="follow-title">
          <h2 id="follow-title" class="th-panel__title">Suivi</h2>
          <p class="th-muted">{{ ranking.player_count }} joueur{{ ranking.player_count > 1 ? 's' : '' }} classé{{ ranking.player_count > 1 ? 's' : '' }}, {{ hunt.completed_count }} à 100 %.</p>
          <ol class="follow-list">
            <li v-for="player in ranking.players.slice(0, 10)" :key="`${player.rank}-${player.name}`">
              <span>{{ player.rank }}. {{ player.name }}<template v-if="player.house"> · {{ player.house }}</template></span>
              <span>{{ player.found }}/{{ steps.length }} · {{ player.points }} XP</span>
            </li>
          </ol>
        </section>

        <section v-if="hunt" class="th-panel danger" aria-labelledby="danger-title">
          <h2 id="danger-title" class="th-panel__title">Supprimer la chasse</h2>
          <p class="th-muted">Possible tant que personne n’a trouvé d’étape. Ensuite, dépubliez-la plutôt.</p>
          <div class="th-actions th-gap">
            <Button label="Supprimer la chasse" icon="pi pi-trash" severity="danger" outlined :disabled="busy || steps.some((s) => s.find_count > 0)" @click="confirmDeleteHunt" />
          </div>
        </section>
      </template>
    </div>

    <Dialog
      v-model:visible="stepDialog"
      modal
      :header="stepForm.id ? `Modifier l’étape ${stepForm.position}` : 'Nouvelle étape'"
      :style="{ width: 'min(94vw, 520px)' }"
      :draggable="false"
    >
      <form class="th-page step-form" novalidate @submit.prevent="saveStep">
        <div class="th-field">
          <label for="step-name">Nom de l’étape</label>
          <InputText id="step-name" v-model="stepForm.name" maxlength="80" autofocus aria-describedby="step-name-help" />
          <small id="step-name-help">Pour vous et pour l’impression (ex. « Bibliothèque »). Les joueurs le voient une fois l’étape trouvée.</small>
        </div>
        <div class="th-field">
          <label for="step-hint">Indice affiché aux joueurs</label>
          <Textarea id="step-hint" v-model="stepForm.hint" rows="3" auto-resize maxlength="300" aria-describedby="step-hint-help" />
          <small id="step-hint-help">{{ (stepForm.hint || '').length }}/300 caractères.</small>
        </div>
        <div class="th-field">
          <label for="step-xp">Points (XP)</label>
          <InputNumber v-model="stepForm.xp_reward" input-id="step-xp" :min="MIN_STEP_XP" :max="MAX_STEP_XP" show-buttons :step="5" aria-describedby="step-xp-help" />
          <small id="step-xp-help">Entre {{ MIN_STEP_XP }} et {{ MAX_STEP_XP }} XP, comptés aussi pour la maison.</small>
        </div>
        <p v-if="stepFormError" class="th-error" role="alert">{{ stepFormError }}</p>
        <div class="th-actions">
          <Button type="submit" :label="stepForm.id ? 'Enregistrer' : 'Ajouter l’étape'" icon="pi pi-check" class="th-primary" :loading="savingStep" />
          <Button type="button" label="Annuler" text @click="stepDialog = false" />
        </div>
      </form>
    </Dialog>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import RadioButton from 'primevue/radiobutton'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/common/utils/Navbar.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import { buildScanUrl } from '@/service/eventCheckinService'
import {
  DEFAULT_STEP_XP,
  MAX_STEPS,
  MAX_STEP_XP,
  MIN_STEP_XP,
  TREASURE_CLASSES,
  TREASURE_HUNT_MANAGE_PATH,
  TREASURE_HUNT_PATH,
  deleteTreasureHunt,
  deleteTreasureHuntStep,
  huntStateLabel,
  huntStateSeverity,
  manageGetTreasureHunt,
  moveItem,
  renewTreasureHuntStepCode,
  reorderTreasureHuntSteps,
  saveTreasureHunt,
  saveTreasureHuntStep,
  setTreasureHuntPublished,
  treasureErrorMessage,
} from '@/service/treasureHuntService'
import './treasure-shared.css'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const classOptions = [...TREASURE_CLASSES]
const isNew = computed(() => props.id === 'nouvelle')

const loading = ref(true)
const loadError = ref('')
const hunt = ref(null)
const steps = ref([])
const ranking = ref({ players: [], player_count: 0 })
const qrImages = reactive({})

const defaultStart = () => {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 1)
  return date
}
const defaultEnd = () => {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  date.setHours(18, 0, 0, 0)
  return date
}

const form = reactive({ title: '', description: '', starts_at: defaultStart(), ends_at: defaultEnd(), target_classes: [], ordered: false })
const savingInfo = ref(false)
const infoError = ref('')
const publishing = ref(false)
const publishError = ref('')
const busy = ref(false)
const stepsError = ref('')

const stepDialog = ref(false)
const stepForm = reactive({ id: null, position: null, name: '', hint: '', xp_reward: DEFAULT_STEP_XP })
const savingStep = ref(false)
const stepFormError = ref('')

async function renderQrImages() {
  for (const step of steps.value) {
    if (!step.code_active || !step.token) continue
    try {
      qrImages[step.id] = await QRCode.toDataURL(buildScanUrl(step.token), { margin: 1, width: 192, errorCorrectionLevel: 'M' })
    } catch (cause) {
      console.error('QR code impossible à dessiner:', cause)
    }
  }
}

async function load() {
  if (isNew.value) {
    hunt.value = null
    steps.value = []
    loading.value = false
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const data = await manageGetTreasureHunt(props.id)
    if (!data?.found) {
      loadError.value = 'Cette chasse n’existe plus.'
      return
    }
    hunt.value = data.hunt
    steps.value = data.steps || []
    ranking.value = data.ranking || { players: [], player_count: 0 }
    Object.assign(form, {
      title: data.hunt.title,
      description: data.hunt.description || '',
      starts_at: new Date(data.hunt.starts_at),
      ends_at: new Date(data.hunt.ends_at),
      target_classes: [...(data.hunt.target_classes || [])],
      ordered: Boolean(data.hunt.ordered),
    })
    renderQrImages()
  } catch (cause) {
    console.error('Chargement de la chasse impossible:', cause)
    loadError.value = treasureErrorMessage(cause, 'Vérifiez votre connexion puis réessayez.')
  } finally {
    loading.value = false
  }
}

async function refresh() {
  const data = await manageGetTreasureHunt(props.id)
  if (data?.found) {
    hunt.value = data.hunt
    steps.value = data.steps || []
    ranking.value = data.ranking || { players: [], player_count: 0 }
    renderQrImages()
  }
}

async function saveInfo() {
  infoError.value = ''
  const title = form.title.trim()
  if (title.length < 3) {
    infoError.value = 'Le titre doit compter au moins 3 caractères.'
    return
  }
  if (!(form.starts_at instanceof Date) || !(form.ends_at instanceof Date) || form.ends_at <= form.starts_at) {
    infoError.value = 'Choisissez une date de fin postérieure au début.'
    return
  }
  savingInfo.value = true
  try {
    const saved = await saveTreasureHunt({ ...form, title, id: isNew.value ? null : props.id })
    toast.add({ severity: 'success', summary: isNew.value ? 'Chasse créée' : 'Informations enregistrées', detail: isNew.value ? 'Ajoutez maintenant les étapes.' : undefined, life: 3000 })
    if (isNew.value) await router.replace(`${TREASURE_HUNT_MANAGE_PATH}/${saved.id}`)
    else await refresh()
  } catch (cause) {
    infoError.value = treasureErrorMessage(cause)
  } finally {
    savingInfo.value = false
  }
}

async function togglePublished() {
  publishError.value = ''
  publishing.value = true
  try {
    await setTreasureHuntPublished(hunt.value.id, !hunt.value.published)
    await refresh()
    toast.add({ severity: 'success', summary: hunt.value.published ? 'Chasse publiée' : 'Chasse dépubliée', life: 3000 })
  } catch (cause) {
    publishError.value = treasureErrorMessage(cause)
  } finally {
    publishing.value = false
  }
}

function openStep(step) {
  stepFormError.value = ''
  Object.assign(stepForm, step
    ? { id: step.id, position: step.position, name: step.name, hint: step.hint, xp_reward: step.xp_reward }
    : { id: null, position: null, name: '', hint: '', xp_reward: DEFAULT_STEP_XP })
  stepDialog.value = true
}

async function saveStep() {
  stepFormError.value = ''
  if (!stepForm.name.trim() || !stepForm.hint.trim()) {
    stepFormError.value = 'Le nom et l’indice sont obligatoires.'
    return
  }
  const xp = Number(stepForm.xp_reward)
  if (!Number.isFinite(xp) || xp < MIN_STEP_XP || xp > MAX_STEP_XP) {
    stepFormError.value = `Une étape rapporte entre ${MIN_STEP_XP} et ${MAX_STEP_XP} XP.`
    return
  }
  savingStep.value = true
  try {
    await saveTreasureHuntStep({ ...stepForm, hunt_id: hunt.value.id })
    stepDialog.value = false
    await refresh()
  } catch (cause) {
    stepFormError.value = treasureErrorMessage(cause)
  } finally {
    savingStep.value = false
  }
}

async function runStepAction(action) {
  stepsError.value = ''
  busy.value = true
  try {
    await action()
    await refresh()
  } catch (cause) {
    stepsError.value = treasureErrorMessage(cause)
  } finally {
    busy.value = false
  }
}

function move(index, direction) {
  const ordered = moveItem(steps.value, index, direction)
  runStepAction(() => reorderTreasureHuntSteps(hunt.value.id, ordered.map((step) => step.id)))
}

function confirmRenew(step, disable) {
  confirm.require({
    header: disable ? 'Désactiver ce QR code ?' : 'Créer un nouveau QR code ?',
    message: disable
      ? `Le QR code imprimé de l’étape « ${step.name} » ne fonctionnera plus. Les joueurs qui l’ont déjà trouvée gardent leurs points.`
      : `Le QR code actuel de l’étape « ${step.name} » cessera de fonctionner : il faudra imprimer et coller le nouveau. Les joueurs qui l’ont déjà trouvée gardent leurs points.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: disable ? 'Désactiver' : 'Nouveau QR code',
    rejectLabel: 'Annuler',
    accept: () => runStepAction(() => renewTreasureHuntStepCode(step.id, disable)),
  })
}

function confirmDeleteStep(step) {
  confirm.require({
    header: 'Supprimer cette étape ?',
    message: `L’étape « ${step.name} » et son QR code seront supprimés. Les étapes suivantes remontent d’un rang.`,
    icon: 'pi pi-trash',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: () => runStepAction(() => deleteTreasureHuntStep(step.id)),
  })
}

function confirmDeleteHunt() {
  confirm.require({
    header: 'Supprimer la chasse ?',
    message: `« ${hunt.value.title} », ses étapes et ses QR codes seront définitivement supprimés.`,
    icon: 'pi pi-trash',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteTreasureHunt(hunt.value.id)
        toast.add({ severity: 'success', summary: 'Chasse supprimée', life: 3000 })
        router.push(TREASURE_HUNT_MANAGE_PATH)
      } catch (cause) {
        stepsError.value = treasureErrorMessage(cause)
      }
    },
  })
}

watch(() => props.id, load)
onMounted(load)
</script>

<style scoped>
.th-gap { margin-top: 1rem; }
.publish { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.publish__title { display: flex; align-items: center; gap: .6rem; margin-bottom: .35rem !important; font-size: 1.15rem; }
.publish__error { flex-basis: 100%; }

.info-form { display: grid; gap: 1rem; }
.info-form :deep(.p-calendar), .info-form :deep(.p-multiselect), .info-form :deep(.p-inputtext) { width: 100%; }
.th-field__label { font-weight: 600; }
.order-choice { display: grid; gap: .5rem; }
.order-choice__item { display: flex; align-items: flex-start; gap: .6rem; padding: .6rem .7rem; border: 1px solid var(--surface-border); border-radius: 10px; cursor: pointer; }
.order-choice__item span { display: grid; gap: .15rem; }
.order-choice__item small { color: var(--text-color-secondary); }

.steps-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem 1rem; }
.steps-head .th-panel__title { margin-bottom: .5rem; }
.edit-steps { display: grid; gap: .8rem; margin: .5rem 0 0; padding: 0; list-style: none; }
.edit-step { display: grid; grid-template-columns: 6.5rem minmax(0, 1fr); gap: 1rem; padding: .9rem; border: 1px solid var(--surface-border); border-radius: 12px; background: var(--surface-section); }
.edit-step--off { border-style: dashed; }
.edit-step__qr { display: grid; justify-items: center; align-content: start; gap: .35rem; }
.edit-step__qr img { width: 96px; height: 96px; border-radius: 8px; background: #fff; }
.edit-step__qr code { font-size: .95rem; font-weight: 700; letter-spacing: .12em; }
.edit-step__qr-off { display: grid; width: 96px; height: 96px; place-content: center; justify-items: center; gap: .3rem; border: 1px dashed var(--surface-border); border-radius: 8px; color: var(--text-color-secondary); font-size: .85rem; }
.edit-step__body { display: grid; gap: .4rem; min-width: 0; }
.edit-step__body h3 { font-size: 1.05rem; overflow-wrap: anywhere; }
.edit-step__hint { display: flex; gap: .45rem; line-height: 1.45; overflow-wrap: anywhere; }
.edit-step__hint i { margin-top: .2rem; color: var(--th-accent); }
.edit-step__actions { gap: .15rem; margin-top: .2rem; }
.edit-step__actions .p-button { min-height: 40px; }

.follow-list { display: grid; gap: .4rem; margin: .8rem 0 0; padding: 0; list-style: none; }
.follow-list li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .25rem 1rem; padding: .45rem 0; border-bottom: 1px solid var(--surface-border); }
.follow-list li span:last-child { color: var(--text-color-secondary); }

.step-form { display: grid; gap: 1rem; min-height: 0; padding: 0; }
.step-form :deep(.p-inputtext), .step-form :deep(.p-inputnumber) { width: 100%; }

@media (min-width: 760px) {
  .info-form { grid-template-columns: 1fr 1fr; }
  .info-form__wide { grid-column: 1 / -1; }
}
@media (max-width: 480px) {
  .edit-step { grid-template-columns: 1fr; }
  .edit-step__qr { grid-template-columns: auto auto; justify-content: start; align-items: center; }
}
</style>
