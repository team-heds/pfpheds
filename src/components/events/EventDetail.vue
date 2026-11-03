<template>
  <article class="event-detail">
    <img v-if="image" :src="image" :alt="event.title" class="event-image" />
    <div v-else class="event-placeholder"><i class="pi pi-calendar" aria-hidden="true" /></div>
    <div class="event-body">
      <div class="event-heading"><span class="event-badge">{{ eventTypeLabel }}</span><h2>{{ event.title }}</h2></div>
      <dl class="event-facts">
        <div><dt><i class="pi pi-calendar" aria-hidden="true" /> Date</dt><dd>{{ formatDateTime(startDate) }}<template v-if="endDate"> – {{ formatDateTime(endDate) }}</template></dd></div>
        <div v-if="event.lieu"><dt><i class="pi pi-map-marker" aria-hidden="true" /> Lieu</dt><dd>{{ event.lieu }}</dd></div>
        <div v-if="event.registration_deadline"><dt><i class="pi pi-clock" aria-hidden="true" /> Répondre avant</dt><dd>{{ formatDateTime(event.registration_deadline) }}</dd></div>
      </dl>
      <p class="description">{{ event.description }}</p>

      <section v-if="event.type === 'alpinphysio'" class="attendance" aria-labelledby="attendance-title">
        <div><p class="kicker">Votre réponse</p><h3 id="attendance-title">Serez-vous présent·e ?</h3></div>
        <div class="response-actions">
          <button v-for="option in responseOptions" :key="option.value" type="button" :class="{ selected: currentResponse === option.value }" :aria-pressed="currentResponse === option.value" :disabled="saving" @click="respond(option.value)">
            <i :class="option.icon" aria-hidden="true" />{{ option.label }}
          </button>
        </div>
        <p v-if="responseMessage" class="response-message" role="status">{{ responseMessage }}</p>
      </section>

      <div class="event-actions">
        <Button v-if="event.type !== 'alpinphysio'" icon="pi pi-user-plus" :label="isUserRegistered ? 'Se désinscrire' : 'S’inscrire'" rounded @click="$emit('register', event)" />
        <Button v-if="canManageEvent" icon="pi pi-pencil" label="Modifier" severity="warning" rounded @click="$emit('edit', event)" />
        <Button v-if="canManageEvent" icon="pi pi-trash" label="Supprimer" severity="danger" rounded @click="confirmDelete" />
        <Button icon="pi pi-share-alt" label="Partager" severity="secondary" rounded @click="share" />
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import { useConfirm } from 'primevue/useconfirm'
import { supabase } from '@/supabase'
import { setAttendance } from '@/service/alpinPhysioAdminService'

const props = defineProps({ event: { type: Object, required: true }, userId: { type: String, required: true }, userProfile: { type: Object, default: null } })
const emit = defineEmits(['register', 'edit', 'delete', 'attendance-updated'])
const confirm = useConfirm()
const saving = ref(false)
const currentResponse = ref(props.event.current_response || null)
const responseMessage = ref('')
const startDate = computed(() => props.event.start_date || props.event.startDate)
const endDate = computed(() => props.event.end_date || props.event.endDate)
const image = computed(() => props.event.image_url || props.event.image)
const canManageEvent = computed(() => props.event && props.userId && (props.event.admin_uid || props.event.admin) === props.userId)
const isUserRegistered = computed(() => currentResponse.value === 'going' || props.event.registered?.some?.((item) => (typeof item === 'string' ? item : item.uid) === props.userId))
const eventTypeLabel = computed(() => ({ private: 'Privé', alpinphysio: "Alp’in Physio", public: 'Public' }[props.event.type] || 'Événement'))
const responseOptions = [
  { value: 'going', label: 'Oui, je serai là', icon: 'pi pi-check' },
  { value: 'maybe', label: 'Peut-être', icon: 'pi pi-question' },
  { value: 'not_going', label: 'Non, absent·e', icon: 'pi pi-times' },
]

watch(() => props.event.current_response, (value) => { currentResponse.value = value || null })
const formatDateTime = (value) => value ? new Intl.DateTimeFormat('fr-CH', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value)) : ''

async function respond(response) {
  saving.value = true
  responseMessage.value = ''
  try {
    let profile = props.userProfile || {}
    if (!props.userProfile && props.userId) {
      const { data } = await supabase.from('user_profiles').select('family_name,forname,avatar_url').eq('user_id', props.userId).maybeSingle()
      profile = data || {}
    }
    await setAttendance(props.event.id, response, profile)
    currentResponse.value = response
    responseMessage.value = 'Votre réponse a bien été enregistrée.'
    emit('attendance-updated', { eventId: props.event.id, response })
  } catch (error) { responseMessage.value = `Impossible d’enregistrer la réponse : ${error.message}` }
  finally { saving.value = false }
}

function confirmDelete() {
  confirm.require({ message: 'Supprimer définitivement cet événement ?', header: 'Supprimer l’événement', icon: 'pi pi-exclamation-triangle', acceptLabel: 'Supprimer', rejectLabel: 'Annuler', accept: () => emit('delete', props.event) })
}
async function share() {
  const shareData = { title: props.event.title, text: props.event.description || '', url: `${window.location.origin}/events` }
  if (navigator.share) await navigator.share(shareData)
  else { await navigator.clipboard.writeText(shareData.url); responseMessage.value = 'Lien copié dans le presse-papiers.' }
}
</script>

<style scoped>
.event-detail{max-width:680px;margin:auto;overflow:hidden;color:var(--text-color,#172123);background:var(--surface-card,#fff);border-radius:1rem}.event-image,.event-placeholder{width:100%;height:260px;display:block;object-fit:cover}.event-placeholder{display:grid;place-items:center;color:#168794;background:#eaf7f6;font-size:3rem}.event-body{padding:1.5rem}.event-heading h2{margin:.65rem 0 1.25rem;font-size:clamp(1.6rem,4vw,2.4rem);line-height:1.1;text-wrap:balance}.event-badge{display:inline-flex;padding:.3rem .6rem;color:#0d525a;background:#dff5f3;border-radius:999px;font-size:.72rem;font-weight:700}.event-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin:0 0 1.25rem}.event-facts div{padding:1rem;background:var(--surface-ground,#f6f8f8);border-radius:.75rem}.event-facts dt{display:flex;align-items:center;gap:.45rem;color:#647477;font-size:.7rem;font-weight:700;text-transform:uppercase}.event-facts dd{margin:.45rem 0 0;font-size:.84rem;font-weight:600}.description{max-width:65ch;line-height:1.65}.attendance{margin-top:1.5rem;padding:1.25rem;background:#eaf7f6;border-radius:.9rem}.kicker{margin:0 0 .3rem;color:#168794;font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.attendance h3{margin:0;font-size:1.1rem}.response-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;margin-top:1rem}.response-actions button{min-height:48px;display:flex;align-items:center;justify-content:center;gap:.45rem;padding:.65rem;border:1px solid #bcd8d5;border-radius:.65rem;color:#183f43;background:#fff;font:inherit;font-size:.78rem;font-weight:700;cursor:pointer}.response-actions button.selected{color:#fff;background:#103b40;border-color:#103b40}.response-actions button:focus-visible{outline:3px solid #64d0d8;outline-offset:2px}.response-message{margin:.85rem 0 0;font-size:.78rem}.event-actions{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:1.5rem}@media(max-width:560px){.event-image,.event-placeholder{height:210px}.event-body{padding:1rem}.event-facts,.response-actions{grid-template-columns:1fr}.event-actions :deep(button){width:100%}}
</style>
