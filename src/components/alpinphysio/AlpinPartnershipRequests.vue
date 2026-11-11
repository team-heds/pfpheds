<template>
  <section class="requests" aria-labelledby="requests-title">
    <header class="requests__heading">
      <div>
        <p class="requests__eyebrow">Page publique</p>
        <h2 id="requests-title">Demandes de partenariat</h2>
        <p>Les organisateurs remplissent le formulaire de la page publique. Répondez par e-mail, puis classez la demande.</p>
      </div>
      <label class="requests__filter">
        <span>Afficher</span>
        <select v-model="filter">
          <option value="open">À traiter ({{ openCount }})</option>
          <option value="all">Toutes ({{ requests.length }})</option>
          <option v-for="status in PARTNERSHIP_STATUSES" :key="status.value" :value="status.value">{{ status.label }}</option>
        </select>
      </label>
    </header>

    <p v-if="message" class="requests__notice" :class="{ 'requests__notice--error': failed }" role="status">{{ message }}</p>
    <div v-if="loading" class="requests__empty" role="status"><i class="pi pi-spin pi-spinner" aria-hidden="true" /> Chargement des demandes…</div>

    <div v-else-if="visible.length" class="requests__list">
      <article v-for="request in visible" :key="request.id" class="request-card">
        <div class="request-card__top">
          <div>
            <h3>{{ request.organization }}</h3>
            <p>Reçue le {{ formatDateTime(request.created_at) }}</p>
          </div>
          <span class="request-card__status" :class="`request-card__status--${request.status}`">{{ partnershipStatusLabel(request.status) }}</span>
        </div>
        <dl class="request-card__facts">
          <div><dt>Contact</dt><dd>{{ request.contact_name }}</dd></div>
          <div><dt>E-mail</dt><dd><a :href="`mailto:${request.email}`">{{ request.email }}</a></dd></div>
          <div v-if="request.phone"><dt>Téléphone</dt><dd><a :href="`tel:${request.phone.replace(/\s+/g, '')}`">{{ request.phone }}</a></dd></div>
          <div v-if="request.event_date"><dt>Date</dt><dd>{{ formatDate(request.event_date) }}</dd></div>
          <div v-if="request.location"><dt>Lieu</dt><dd>{{ request.location }}</dd></div>
          <div v-if="request.masseurs_count"><dt>Masseurs souhaités</dt><dd>{{ request.masseurs_count }}</dd></div>
        </dl>
        <p v-if="request.message" class="request-card__message">{{ request.message }}</p>
        <label class="request-card__notes">
          <span>Notes internes (non visibles par l’organisateur)</span>
          <textarea v-model="drafts[request.id]" rows="2" maxlength="2000" placeholder="Qui s’en occupe, ce qui a été convenu…" />
        </label>
        <div class="request-card__actions">
          <a class="request-card__button request-card__button--primary" :href="partnershipReplyLink(request)"><i class="pi pi-envelope" aria-hidden="true" />Répondre par e-mail</a>
          <button v-if="(drafts[request.id] || '') !== (request.internal_notes || '')" type="button" class="request-card__button" :disabled="savingId === request.id" @click="save(request, { internal_notes: drafts[request.id] })"><i class="pi pi-save" aria-hidden="true" />Enregistrer la note</button>
          <label class="request-card__state">
            <span class="sr-only">État de la demande de {{ request.organization }}</span>
            <select :value="request.status" :disabled="savingId === request.id" @change="save(request, { status: $event.target.value })">
              <option v-for="status in PARTNERSHIP_STATUSES" :key="status.value" :value="status.value">{{ status.label }}</option>
            </select>
          </label>
        </div>
      </article>
    </div>

    <div v-else class="requests__empty">
      <i class="pi pi-inbox" aria-hidden="true" />
      <h3>{{ requests.length ? 'Aucune demande dans cette vue' : 'Aucune demande pour le moment' }}</h3>
      <p>Les demandes envoyées depuis la page publique apparaîtront ici.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { listPartnershipRequests, updatePartnershipRequest } from '@/service/alpinPhysioPartnershipService'
import { PARTNERSHIP_STATUSES, partnershipReplyLink, partnershipStatusLabel } from '@/utils/alpinPhysioPartnership'

const authStore = useAuthStore()
const requests = ref([])
const drafts = reactive({})
const filter = ref('open')
const loading = ref(true)
const savingId = ref(null)
const message = ref('')
const failed = ref(false)

const openCount = computed(() => requests.value.filter((request) => ['new', 'in_progress'].includes(request.status)).length)
const visible = computed(() => {
  if (filter.value === 'all') return requests.value
  if (filter.value === 'open') return requests.value.filter((request) => ['new', 'in_progress'].includes(request.status))
  return requests.value.filter((request) => request.status === filter.value)
})
const formatDateTime = (value) => new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const formatDate = (value) => new Intl.DateTimeFormat('fr-CH', { dateStyle: 'long' }).format(new Date(`${value}T12:00:00`))
const notify = (text, error = false) => { message.value = text; failed.value = error }

async function load() {
  loading.value = true
  try {
    requests.value = await listPartnershipRequests()
    requests.value.forEach((request) => { drafts[request.id] = request.internal_notes || '' })
  } catch (error) { notify(`Impossible de charger les demandes : ${error.message}`, true) }
  finally { loading.value = false }
}

async function save(request, changes) {
  savingId.value = request.id
  try {
    const saved = await updatePartnershipRequest(request.id, changes, authStore.user?.id)
    Object.assign(request, saved)
    drafts[request.id] = saved.internal_notes || ''
    notify(changes.status ? `Demande de ${request.organization} : ${partnershipStatusLabel(saved.status).toLowerCase()}.` : 'Note enregistrée.')
  } catch (error) { notify(`Enregistrement impossible : ${error.message}`, true) }
  finally { savingId.value = null }
}

onMounted(load)
</script>

<style scoped>
.requests{display:flex;flex-direction:column;gap:1rem;color:#f7f9fc}
.requests__heading{display:flex;align-items:flex-end;justify-content:space-between;gap:1.5rem;padding:1.35rem 1.5rem;background:#071426;border:1px solid #294866;border-radius:1rem}
.requests__eyebrow{margin:0 0 .35rem;color:#f3c300;font-size:.7rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
.requests__heading h2{margin:0;color:#fff;font-size:1.45rem}
.requests__heading p:not(.requests__eyebrow){max-width:62ch;margin:.45rem 0 0;color:#aab8c9;font-size:.84rem;line-height:1.5}
.requests__filter{display:flex;flex-direction:column;gap:.35rem;min-width:200px;font-size:.72rem;font-weight:700}
.requests__filter select,.request-card__state select{min-height:44px;padding:.55rem .7rem;color:#f7f9fc;background:#071426;border:1px solid #294866;border-radius:.55rem;font:inherit;font-size:16px;color-scheme:dark}
.requests__notice{margin:0;padding:.85rem 1rem;color:#c8f7d9;background:#123d31;border-radius:.7rem;font-size:.86rem}
.requests__notice--error{color:#ffc7c7;background:#3a1c27}
.requests__list{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr));gap:1rem}
.request-card{display:flex;flex-direction:column;gap:1rem;padding:1.25rem;background:#102c4e;border:1px solid #294866;border-radius:1rem;box-shadow:0 12px 35px rgba(2,10,22,.2)}
.request-card__top{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
.request-card__top h3{margin:0;font-size:1.1rem;line-height:1.3;overflow-wrap:anywhere}
.request-card__top p{margin:.25rem 0 0;color:#aab8c9;font-size:.74rem}
.request-card__status{flex:0 0 auto;padding:.3rem .6rem;border-radius:999px;font-size:.68rem;font-weight:700;white-space:nowrap}
.request-card__status--new{color:#0b213f;background:#f3c300}
.request-card__status--in_progress{color:#745b12;background:#fff3c7}
.request-card__status--done{color:#12613b;background:#def5e8}
.request-card__status--archived{color:#d4deea;background:#071426;border:1px solid #294866}
.request-card__facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;margin:0}
.request-card__facts div{min-width:0}
.request-card__facts dt{color:#aab8c9;font-size:.68rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
.request-card__facts dd{margin:.2rem 0 0;font-size:.88rem;overflow-wrap:anywhere}
.request-card__facts a{color:#f3c300}
.request-card__message{margin:0;padding:.85rem 1rem;color:#e6edf5;background:#0b213f;border-radius:.7rem;font-size:.86rem;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}
.request-card__notes{display:flex;flex-direction:column;gap:.4rem;font-size:.72rem;font-weight:700}
.request-card__notes textarea{width:100%;min-height:44px;padding:.65rem .72rem;color:#f7f9fc;background:#071426;border:1px solid #294866;border-radius:.55rem;font:inherit;font-size:16px;line-height:1.5;resize:vertical;color-scheme:dark}
.request-card__notes textarea::placeholder{color:#8294aa}
.request-card__actions{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;margin-top:auto}
.request-card__button{min-height:44px;display:inline-flex;align-items:center;gap:.5rem;padding:.6rem .9rem;color:#f7f9fc;background:#102c4e;border:1px solid #294866;border-radius:.6rem;font:inherit;font-size:.82rem;font-weight:700;text-decoration:none;cursor:pointer}
.request-card__button--primary{color:#0b213f;background:#f3c300;border-color:#f3c300}
.request-card__state{margin-left:auto}
.requests select:focus-visible,.requests textarea:focus-visible,.requests a:focus-visible,.requests button:focus-visible{outline:3px solid #f3c300;outline-offset:2px}
.requests__empty{display:grid;place-items:center;gap:.4rem;padding:3rem 1rem;color:#aab8c9;background:#102c4e;border:1px solid #294866;border-radius:1rem;text-align:center}
.requests__empty>i{color:#f3c300;font-size:2rem}
.requests__empty h3{margin:.5rem 0 0;color:#f7f9fc}
.requests__empty p{margin:0;font-size:.84rem}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
@media(max-width:680px){.requests__heading{align-items:stretch;flex-direction:column}.request-card__facts{grid-template-columns:1fr}.request-card__state{width:100%;margin-left:0}.request-card__state select{width:100%}.request-card__button{flex:1 1 auto;justify-content:center}}
</style>
