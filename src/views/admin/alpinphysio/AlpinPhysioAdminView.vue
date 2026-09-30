<template>
  <AdminLayout wide>
    <div class="alpin-admin">
      <header class="page-heading">
        <div>
          <p class="eyebrow">Administration · association étudiante</p>
          <h1>Alp’in Physio</h1>
          <p class="heading-copy">Pilotez les événements, les présences, le matériel et la vitrine depuis un espace unique.</p>
        </div>
        <RouterLink class="public-link" to="/alpinphysio" target="_blank">
          Voir la vitrine <i class="pi pi-arrow-up-right" aria-hidden="true" />
        </RouterLink>
      </header>

      <nav class="section-tabs" aria-label="Sections Alp’in Physio">
        <RouterLink v-for="item in sections" :key="item.id" :to="item.to" :class="{ active: section === item.id }">
          <i :class="item.icon" aria-hidden="true" />{{ item.label }}
        </RouterLink>
      </nav>

      <div v-if="notice.text" class="notice" :class="`notice--${notice.kind}`" role="status">
        <i :class="notice.kind === 'error' ? 'pi pi-exclamation-circle' : 'pi pi-check-circle'" aria-hidden="true" />
        {{ notice.text }}
      </div>

      <div v-if="loading" class="loading-state" role="status"><i class="pi pi-spin pi-spinner" /> Chargement de l’espace Alp’in Physio…</div>

      <template v-else-if="section === 'dashboard'">
        <section class="metric-grid" aria-label="Indicateurs">
          <article><span>Événements à venir</span><strong>{{ metrics.upcoming }}</strong><i class="pi pi-calendar" /></article>
          <article><span>Réponses « présent »</span><strong>{{ metrics.going }}</strong><i class="pi pi-users" /></article>
          <article><span>Réponses en attente</span><strong>{{ metrics.maybe }}</strong><i class="pi pi-clock" /></article>
          <article><span>Matériel manquant</span><strong>{{ metrics.missing }}</strong><i class="pi pi-box" /></article>
        </section>
        <section class="panel">
          <div class="panel-heading"><div><p class="eyebrow">Prochaines dates</p><h2>Événements à préparer</h2></div><RouterLink to="/admin/alpinphysio/events">Gérer les événements</RouterLink></div>
          <div v-if="upcomingEvents.length" class="event-stack">
            <button v-for="event in upcomingEvents.slice(0, 5)" :key="event.id" type="button" class="event-row" @click="openOperationalEvent(event)">
              <time :datetime="event.start_date"><strong>{{ day(event.start_date) }}</strong><span>{{ month(event.start_date) }}</span></time>
              <span class="event-main"><strong>{{ event.title }}</strong><small>{{ event.lieu || 'Lieu à confirmer' }}</small></span>
              <span class="status" :class="`status--${event.status}`">{{ statusLabel(event.status) }}</span>
              <span class="event-count"><strong>{{ event.going_count || 0 }}</strong><small>présents</small></span>
              <i class="pi pi-chevron-right" aria-hidden="true" />
            </button>
          </div>
          <div v-else class="empty-state"><i class="pi pi-calendar-plus" /><h3>Aucun événement à venir</h3><p>Créez une première date pour alimenter la vitrine et l’espace étudiant.</p><RouterLink to="/admin/alpinphysio/events">Créer un événement</RouterLink></div>
        </section>
      </template>

      <template v-else-if="section === 'events'">
        <section class="split-layout">
          <div class="panel event-list-panel">
            <div class="panel-heading"><div><p class="eyebrow">Calendrier</p><h2>Événements</h2></div><button class="primary-button" type="button" @click="startNewEvent"><i class="pi pi-plus" />Créer</button></div>
            <label class="search-field"><span class="sr-only">Rechercher un événement</span><i class="pi pi-search" /><input v-model="search" type="search" placeholder="Rechercher un événement" /></label>
            <div v-if="filteredEvents.length" class="event-stack compact">
              <button v-for="event in filteredEvents" :key="event.id" type="button" class="event-row" :class="{ selected: eventForm.id === event.id }" @click="editEvent(event)">
                <time :datetime="event.start_date"><strong>{{ day(event.start_date) }}</strong><span>{{ month(event.start_date) }}</span></time>
                <span class="event-main"><strong>{{ event.title }}</strong><small>{{ formatDate(event.start_date) }} · {{ event.lieu || 'Lieu à confirmer' }}</small></span>
                <span class="status" :class="`status--${event.status}`">{{ statusLabel(event.status) }}</span>
              </button>
            </div>
            <div v-else class="empty-state small"><p>Aucun événement ne correspond à cette recherche.</p></div>
          </div>

          <form class="panel editor" @submit.prevent="saveEvent">
            <div class="panel-heading"><div><p class="eyebrow">{{ eventForm.id ? 'Modification' : 'Nouvel événement' }}</p><h2>{{ eventForm.id ? eventForm.title || 'Événement' : 'Créer une date' }}</h2></div><span class="autosave-hint">Enregistrement manuel</span></div>
            <div class="form-grid">
              <label class="field field--wide"><span>Titre</span><input v-model.trim="eventForm.title" required maxlength="160" /></label>
              <label class="field field--wide"><span>Description</span><textarea v-model.trim="eventForm.description" rows="4" /></label>
              <label class="field"><span>Début</span><input v-model="eventForm.start_date" type="datetime-local" required /></label>
              <label class="field"><span>Fin</span><input v-model="eventForm.end_date" type="datetime-local" required /></label>
              <label class="field"><span>Lieu</span><input v-model.trim="eventForm.lieu" placeholder="Verbier" /></label>
              <label class="field"><span>Point de rendez-vous</span><input v-model.trim="eventForm.meeting_point" placeholder="Entrée principale" /></label>
              <label class="field"><span>Date limite de réponse</span><input v-model="eventForm.registration_deadline" type="datetime-local" /></label>
              <label class="field"><span>Nombre de places</span><input v-model.number="eventForm.capacity" type="number" min="1" inputmode="numeric" /></label>
              <label class="field"><span>Email de contact</span><input v-model.trim="eventForm.contact_email" type="email" placeholder="alpinphysio@hevs.ch" /></label>
              <label class="field"><span>Adresse de l’image</span><input v-model.trim="eventForm.image_url" type="url" placeholder="https://…" /></label>
              <label class="field"><span>État</span><select v-model="eventForm.status"><option value="draft">Brouillon</option><option value="published">Publié</option><option value="cancelled">Annulé</option></select></label>
              <div class="field field--wide toggles">
                <label><input v-model="eventForm.show_on_public_site" type="checkbox" />Afficher sur la vitrine publique</label>
                <label><input v-model="eventForm.show_in_feed" type="checkbox" />Publier aussi dans le feed HEdS</label>
              </div>
            </div>
            <div class="form-actions">
              <button v-if="eventForm.id" class="danger-button" type="button" @click="removeEvent"><i class="pi pi-trash" />Supprimer</button>
              <button class="secondary-button" type="button" @click="startNewEvent">Réinitialiser</button>
              <button class="primary-button" type="submit" :disabled="saving"><i :class="saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'" />{{ eventForm.id ? 'Enregistrer' : 'Créer l’événement' }}</button>
            </div>
          </form>
        </section>
      </template>

      <template v-else-if="section === 'attendance'">
        <OperationalEventPicker v-model="selectedEventId" :events="events" label="Événement suivi" @update:modelValue="loadOperations" />
        <section class="metric-grid metric-grid--three">
          <article><span>Présents</span><strong>{{ attendanceCounts.going }}</strong><i class="pi pi-check-circle" /></article>
          <article><span>Peut-être</span><strong>{{ attendanceCounts.maybe }}</strong><i class="pi pi-question-circle" /></article>
          <article><span>Absents</span><strong>{{ attendanceCounts.not_going }}</strong><i class="pi pi-times-circle" /></article>
        </section>
        <section class="panel">
          <div class="panel-heading"><div><p class="eyebrow">Réponses étudiantes</p><h2>Liste des présences</h2></div><button class="secondary-button" type="button" :disabled="!attendance.length" @click="exportAttendance"><i class="pi pi-download" />Exporter</button></div>
          <div class="table-scroll">
            <table><thead><tr><th>Étudiant·e</th><th>Réponse</th><th>Commentaire</th><th>Mise à jour</th></tr></thead><tbody><tr v-for="person in attendance" :key="person.id"><td><strong>{{ fullName(person) }}</strong></td><td><span class="response" :class="`response--${person.response}`">{{ responseLabel(person.response) }}</span></td><td>{{ person.note || '—' }}</td><td>{{ formatDateTime(person.updated_at || person.registered_at) }}</td></tr></tbody></table>
          </div>
          <div v-if="!attendance.length" class="empty-state small"><p>Aucune réponse enregistrée pour cet événement.</p></div>
        </section>
      </template>

      <template v-else-if="section === 'materials'">
        <OperationalEventPicker v-model="selectedEventId" :events="events" label="Événement à préparer" @update:modelValue="loadOperations" />
        <section class="split-layout materials-layout">
          <form class="panel editor" @submit.prevent="addMaterial">
            <div class="panel-heading"><div><p class="eyebrow">Checklist</p><h2>Ajouter du matériel</h2></div></div>
            <div class="form-grid">
              <label class="field field--wide"><span>Matériel</span><input v-model.trim="materialForm.label" required placeholder="Table de massage" /></label>
              <label class="field"><span>Quantité</span><input v-model.number="materialForm.quantity" type="number" min="1" required /></label>
              <label class="field"><span>Responsable</span><input v-model.trim="materialForm.assigned_to" placeholder="Prénom" /></label>
              <label class="field field--wide"><span>Note</span><textarea v-model.trim="materialForm.notes" rows="3" /></label>
            </div>
            <button class="primary-button" type="submit" :disabled="!selectedEventId"><i class="pi pi-plus" />Ajouter à la checklist</button>
          </form>
          <section class="panel">
            <div class="panel-heading"><div><p class="eyebrow">Préparation</p><h2>Matériel de l’événement</h2></div><strong class="progress-copy">{{ readyMaterials }}/{{ materials.length }} prêt</strong></div>
            <div v-if="materials.length" class="material-list">
              <article v-for="item in materials" :key="item.id">
                <button type="button" class="material-check" :aria-label="`Changer l’état de ${item.label}`" @click="cycleMaterial(item)"><i :class="materialIcon(item.status)" /></button>
                <div><strong>{{ item.quantity }} × {{ item.label }}</strong><small>{{ item.assigned_to || 'Responsable à définir' }}<template v-if="item.notes"> · {{ item.notes }}</template></small></div>
                <span class="status" :class="`material--${item.status}`">{{ materialLabel(item.status) }}</span>
                <button type="button" class="icon-button danger" :aria-label="`Supprimer ${item.label}`" @click="removeMaterial(item)"><i class="pi pi-trash" /></button>
              </article>
            </div>
            <div v-else class="empty-state small"><p>Aucun matériel ajouté pour cet événement.</p></div>
          </section>
        </section>
      </template>

      <template v-else-if="section === 'site'">
        <AlpinPhysioSiteEditor :content="siteForm" :saving="saving" @save="saveContent" />
      </template>

      <template v-else-if="section === 'team'">
        <section class="split-layout team-layout">
          <form class="panel editor" @submit.prevent="addTeamMember">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Accès Alp’in Physio</p>
                <h2>Ajouter une personne</h2>
                <p>La personne doit déjà posséder un compte sur la plateforme. Elle pourra ensuite gérer les événements, les présences, le matériel et la vitrine.</p>
              </div>
            </div>
            <label class="field">
              <span>Adresse email institutionnelle</span>
              <input v-model.trim="teamEmail" type="email" required autocomplete="off" placeholder="prenom.nom@hevs.ch" />
            </label>
            <button class="primary-button team-submit" type="submit" :disabled="saving || !teamEmail">
              <i class="pi pi-user-plus" />Donner l’accès
            </button>
          </form>

          <section class="panel">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Responsables actifs</p>
                <h2>Équipe Alp’in Physio</h2>
                <p>Ces accès sont indépendants des rôles Physiothérapie et Soins infirmiers.</p>
              </div>
              <strong class="progress-copy">{{ team.length }} personne{{ team.length > 1 ? 's' : '' }}</strong>
            </div>
            <div v-if="team.length" class="team-list">
              <article v-for="member in team" :key="member.id">
                <span class="avatar" aria-hidden="true">{{ initials(member) }}</span>
                <div>
                  <strong>{{ teamName(member) }}</strong>
                  <small>{{ member.email }}</small>
                </div>
                <span class="status status--published">{{ member.role === 'ADMIN' ? 'Administrateur' : 'Responsable' }}</span>
                <button v-if="member.role !== 'ADMIN'" type="button" class="icon-button danger" :aria-label="`Retirer l’accès de ${teamName(member)}`" @click="removeTeamMember(member)">
                  <i class="pi pi-user-minus" />
                </button>
              </article>
            </div>
            <div v-else class="empty-state small">
              <i class="pi pi-users" />
              <h3>Aucun responsable enregistré</h3>
              <p>Ajoutez au moins une personne pour administrer l’espace Alp’in Physio.</p>
            </div>
          </section>
        </section>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import OperationalEventPicker from '@/components/alpinphysio/OperationalEventPicker.vue'
import AlpinPhysioSiteEditor from '@/components/alpinphysio/AlpinPhysioSiteEditor.vue'
import { useAuthStore } from '@/stores/authStore'
import { cloneAlpinPhysioSiteContent } from '@/data/alpinPhysioSiteContent'
import {
  addAlpinTeamMember, deactivateAlpinTeamMember, deleteAlpinEvent, deleteMaterial,
  getSiteContent, listAlpinEvents, listAlpinTeam, listAttendance, listMaterials,
  saveAlpinEvent, saveMaterial, saveSiteContent,
} from '@/service/alpinPhysioAdminService'

const props = defineProps({ section: { type: String, default: 'dashboard' } })
const router = useRouter()
const authStore = useAuthStore()
const section = computed(() => props.section)
const sections = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'pi pi-th-large', to: '/admin/alpinphysio' },
  { id: 'events', label: 'Événements', icon: 'pi pi-calendar', to: '/admin/alpinphysio/events' },
  { id: 'attendance', label: 'Présences', icon: 'pi pi-users', to: '/admin/alpinphysio/presences' },
  { id: 'materials', label: 'Matériel', icon: 'pi pi-box', to: '/admin/alpinphysio/materiel' },
  { id: 'site', label: 'Site vitrine', icon: 'pi pi-desktop', to: '/admin/alpinphysio/site' },
  { id: 'team', label: 'Équipe & accès', icon: 'pi pi-id-card', to: '/admin/alpinphysio/equipe' },
]

const loading = ref(true)
const saving = ref(false)
const search = ref('')
const events = ref([])
const attendance = ref([])
const materials = ref([])
const team = ref([])
const teamEmail = ref('')
const selectedEventId = ref(null)
const notice = reactive({ text: '', kind: 'success' })
const defaultEvent = () => ({ id: null, title: '', description: '', lieu: '', meeting_point: '', contact_email: 'alpinphysio@hevs.ch', start_date: '', end_date: '', registration_deadline: '', capacity: null, image_url: '', status: 'draft', show_on_public_site: true, show_in_feed: true })
const eventForm = reactive(defaultEvent())
const materialForm = reactive({ label: '', quantity: 1, assigned_to: '', notes: '' })
const siteForm = reactive(cloneAlpinPhysioSiteContent())

const upcomingEvents = computed(() => events.value.filter((event) => new Date(event.end_date) >= new Date() && event.status !== 'cancelled'))
const filteredEvents = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? events.value.filter((event) => [event.title, event.lieu, event.description].some((value) => String(value || '').toLowerCase().includes(q))) : events.value
})
const metrics = computed(() => ({
  upcoming: upcomingEvents.value.length,
  going: upcomingEvents.value.reduce((sum, event) => sum + Number(event.going_count || 0), 0),
  maybe: upcomingEvents.value.reduce((sum, event) => sum + Number(event.maybe_count || 0), 0),
  missing: materials.value.filter((item) => item.status === 'missing').length,
}))
const attendanceCounts = computed(() => attendance.value.reduce((counts, item) => ({ ...counts, [item.response]: (counts[item.response] || 0) + 1 }), { going: 0, maybe: 0, not_going: 0 }))
const readyMaterials = computed(() => materials.value.filter((item) => item.status === 'ready').length)

const localInput = (value) => value ? new Date(value).toISOString().slice(0, 16) : ''
const apiDate = (value) => value ? new Date(value).toISOString() : null
const flash = (text, kind = 'success') => { notice.text = text; notice.kind = kind; window.setTimeout(() => { if (notice.text === text) notice.text = '' }, 5000) }
const day = (value) => new Intl.DateTimeFormat('fr-CH', { day: '2-digit' }).format(new Date(value))
const month = (value) => new Intl.DateTimeFormat('fr-CH', { month: 'short' }).format(new Date(value)).replace('.', '').toUpperCase()
const formatDate = (value) => new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium' }).format(new Date(value))
const formatDateTime = (value) => value ? new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const statusLabel = (value) => ({ draft: 'Brouillon', published: 'Publié', cancelled: 'Annulé' }[value] || value)
const responseLabel = (value) => ({ going: 'Présent·e', maybe: 'Peut-être', not_going: 'Absent·e' }[value] || value)
const materialLabel = (value) => ({ to_prepare: 'À préparer', ready: 'Prêt', missing: 'Manquant' }[value] || value)
const materialIcon = (value) => ({ to_prepare: 'pi pi-circle', ready: 'pi pi-check-circle', missing: 'pi pi-exclamation-circle' }[value])
const fullName = (person) => `${person.user_prenom || ''} ${person.user_nom || ''}`.trim() || 'Profil sans nom'

async function reload() {
  loading.value = true
  try {
    events.value = await listAlpinEvents()
    if (!selectedEventId.value && events.value.length) selectedEventId.value = upcomingEvents.value[0]?.id || events.value[0].id
    if (['dashboard', 'attendance', 'materials'].includes(section.value)) await loadOperations()
    if (section.value === 'site') {
      const { content } = await getSiteContent()
      Object.assign(siteForm, cloneAlpinPhysioSiteContent(content || {}))
    }
    if (section.value === 'team') team.value = await listAlpinTeam()
  } catch (error) { flash(`Impossible de charger les données : ${error.message}`, 'error') }
  finally { loading.value = false }
}

function startNewEvent() { Object.assign(eventForm, defaultEvent()) }
function editEvent(event) { Object.assign(eventForm, { ...defaultEvent(), ...event, start_date: localInput(event.start_date), end_date: localInput(event.end_date), registration_deadline: localInput(event.registration_deadline) }) }
async function saveEvent() {
  if (new Date(eventForm.end_date) < new Date(eventForm.start_date)) return flash('La date de fin doit être postérieure à la date de début.', 'error')
  saving.value = true
  try {
    const saved = await saveAlpinEvent({ ...eventForm, start_date: apiDate(eventForm.start_date), end_date: apiDate(eventForm.end_date), registration_deadline: apiDate(eventForm.registration_deadline) }, authStore.user?.id)
    flash(saved.status === 'draft' ? 'Brouillon enregistré.' : 'Événement publié et synchronisé.')
    await reload(); editEvent(saved)
  } catch (error) { flash(`Enregistrement impossible : ${error.message}`, 'error') }
  finally { saving.value = false }
}
async function removeEvent() {
  if (!window.confirm(`Supprimer définitivement « ${eventForm.title} » ?`)) return
  try { await deleteAlpinEvent(eventForm.id); startNewEvent(); await reload(); flash('Événement supprimé.') }
  catch (error) { flash(`Suppression impossible : ${error.message}`, 'error') }
}
async function loadOperations() {
  if (!selectedEventId.value) { attendance.value = []; materials.value = []; return }
  try { [attendance.value, materials.value] = await Promise.all([listAttendance(selectedEventId.value), listMaterials(selectedEventId.value)]) }
  catch (error) { flash(`Données opérationnelles indisponibles : ${error.message}`, 'error') }
}
function openOperationalEvent(event) { selectedEventId.value = event.id; router.push('/admin/alpinphysio/presences') }
async function addMaterial() {
  try { await saveMaterial({ ...materialForm, event_id: selectedEventId.value }); Object.assign(materialForm, { label: '', quantity: 1, assigned_to: '', notes: '' }); await loadOperations(); flash('Matériel ajouté.') }
  catch (error) { flash(`Ajout impossible : ${error.message}`, 'error') }
}
async function cycleMaterial(item) {
  const next = { to_prepare: 'ready', ready: 'missing', missing: 'to_prepare' }[item.status]
  try { await saveMaterial({ ...item, status: next }); await loadOperations() }
  catch (error) { flash(`Mise à jour impossible : ${error.message}`, 'error') }
}
async function removeMaterial(item) {
  if (!window.confirm(`Retirer « ${item.label} » de la checklist ?`)) return
  try { await deleteMaterial(item.id); await loadOperations() }
  catch (error) { flash(`Suppression impossible : ${error.message}`, 'error') }
}
async function saveContent(content = siteForm) {
  saving.value = true
  try {
    await saveSiteContent(cloneAlpinPhysioSiteContent(content), authStore.user?.id)
    Object.assign(siteForm, cloneAlpinPhysioSiteContent(content))
    flash('La vitrine a été mise à jour.')
  }
  catch (error) { flash(`Publication impossible : ${error.message}`, 'error') }
  finally { saving.value = false }
}
const teamName = (member) => member.display_name || `${member.forname || ''} ${member.family_name || ''}`.trim() || member.email
const initials = (member) => `${member.forname?.[0] || ''}${member.family_name?.[0] || ''}`.toUpperCase() || '@'
async function addTeamMember() {
  saving.value = true
  try {
    await addAlpinTeamMember(teamEmail.value, authStore.user?.id)
    teamEmail.value = ''
    team.value = await listAlpinTeam()
    flash('L’accès Alp’in Physio a été ajouté.')
  } catch (error) { flash(`Ajout impossible : ${error.message}`, 'error') }
  finally { saving.value = false }
}
async function removeTeamMember(member) {
  if (!window.confirm(`Retirer l’accès Alp’in Physio de ${teamName(member)} ?`)) return
  try {
    await deactivateAlpinTeamMember(member.id)
    team.value = await listAlpinTeam()
    flash('L’accès Alp’in Physio a été retiré.')
  } catch (error) { flash(`Retrait impossible : ${error.message}`, 'error') }
}
function exportAttendance() {
  const rows = [['Nom', 'Prénom', 'Réponse', 'Commentaire'], ...attendance.value.map((person) => [person.user_nom || '', person.user_prenom || '', responseLabel(person.response), person.note || ''])]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n')
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = 'presences-alpinphysio.csv'; link.click(); URL.revokeObjectURL(link.href)
}

watch(section, reload)
onMounted(reload)
</script>

<style scoped>
.alpin-admin{--heds-navy:#0b213f;--heds-navy-deep:#071426;--heds-yellow:#f3c300;--heds-yellow-ink:#8a6a00;--alpin:var(--heds-yellow-ink);--alpin-dark:var(--heds-navy);--alpin-pale:#fff8d8;--surface:#fff;--line:#d8e0ea;--muted:#66758a;max-width:1440px;margin:0 auto;padding:1rem 1rem 4rem;color:var(--text-color,#172123)}
.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:2rem;padding:1.25rem 0 2rem}.eyebrow{margin:0 0 .45rem;color:var(--alpin);font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}.page-heading h1{margin:0;font-size:clamp(2.2rem,4vw,4.1rem);line-height:1;letter-spacing:-.045em}.heading-copy{max-width:62ch;margin:.9rem 0 0;color:var(--muted);line-height:1.6}.public-link,.primary-button,.secondary-button,.danger-button{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.55rem;padding:.7rem 1rem;border-radius:.65rem;font:inherit;font-size:.85rem;font-weight:700;text-decoration:none;cursor:pointer}.public-link,.primary-button{border:1px solid var(--alpin-dark);color:#fff;background:var(--alpin-dark)}.secondary-button{border:1px solid var(--line);color:inherit;background:var(--surface)}.danger-button{border:1px solid #e7b9b9;color:#a92727;background:#fff5f5}.primary-button:active,.secondary-button:active,.danger-button:active,.public-link:active{transform:scale(.96)}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #64d0d8;outline-offset:2px}.section-tabs{display:flex;gap:.5rem;margin-bottom:1.5rem;padding:.4rem;background:var(--alpin-pale);border-radius:.85rem;overflow-x:auto}.section-tabs a{min-height:44px;display:flex;align-items:center;gap:.55rem;padding:.65rem .9rem;color:var(--alpin-dark);border-radius:.6rem;font-size:.82rem;font-weight:600;text-decoration:none;white-space:nowrap}.section-tabs a.active{background:#fff;box-shadow:0 4px 16px rgba(16,59,64,.1)}.notice,.loading-state{display:flex;align-items:center;gap:.65rem;margin-bottom:1rem;padding:1rem;border-radius:.7rem}.notice--success{color:#145b3b;background:#e9f7ef}.notice--error{color:#842525;background:#fff0f0}.loading-state{color:var(--muted);background:var(--alpin-pale)}.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1rem}.metric-grid--three{grid-template-columns:repeat(3,1fr)}.metric-grid article{position:relative;min-height:138px;padding:1.25rem;background:var(--surface);border:1px solid var(--line);border-radius:1rem;box-shadow:0 8px 30px rgba(16,59,64,.05)}.metric-grid span{display:block;color:var(--muted);font-size:.78rem}.metric-grid strong{display:block;margin-top:.45rem;font-size:2.25rem;font-variant-numeric:tabular-nums}.metric-grid article>i{position:absolute;right:1.2rem;bottom:1.2rem;color:var(--alpin);font-size:1.35rem}.panel{padding:1.25rem;background:var(--surface);border:1px solid var(--line);border-radius:1rem;box-shadow:0 12px 40px rgba(16,59,64,.05)}.panel-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1.25rem}.panel-heading h2{margin:0;font-size:1.3rem}.panel-heading p:not(.eyebrow){max-width:68ch;margin:.45rem 0 0;color:var(--muted);font-size:.85rem}.panel-heading>a{color:var(--alpin);font-size:.82rem;font-weight:700}.event-stack{display:flex;flex-direction:column;gap:.55rem}.event-stack.compact{max-height:620px;overflow:auto}.event-row{width:100%;display:grid;grid-template-columns:64px minmax(0,1fr) auto 80px 20px;align-items:center;gap:1rem;padding:.75rem;border:1px solid transparent;border-radius:.75rem;color:inherit;background:#f8fbfa;text-align:start;cursor:pointer}.compact .event-row{grid-template-columns:54px minmax(0,1fr) auto}.event-row:hover,.event-row.selected{border-color:#9bcfcb;background:var(--alpin-pale)}.event-row time{display:flex;align-items:baseline;gap:.3rem;color:var(--alpin)}.event-row time strong{font-size:1.45rem}.event-row time span{font-size:.65rem;font-weight:700}.event-main{min-width:0}.event-main strong,.event-main small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.event-main small,.event-count small{margin-top:.2rem;color:var(--muted);font-size:.72rem}.event-count{text-align:center}.status,.response{display:inline-flex;align-items:center;padding:.3rem .55rem;border-radius:999px;font-size:.68rem;font-weight:700;white-space:nowrap}.status--published,.response--going,.material--ready{color:#12613b;background:#def5e8}.status--draft,.response--maybe,.material--to_prepare{color:#745b12;background:#fff3c7}.status--cancelled,.response--not_going,.material--missing{color:#8a2424;background:#ffe5e5}.split-layout{display:grid;grid-template-columns:minmax(300px,.85fr) minmax(480px,1.4fr);gap:1rem}.materials-layout{grid-template-columns:minmax(320px,.75fr) minmax(480px,1.25fr)}.search-field{min-height:44px;display:flex;align-items:center;gap:.65rem;margin-bottom:1rem;padding:0 .8rem;border:1px solid var(--line);border-radius:.65rem}.search-field input{width:100%;border:0;outline:0;background:transparent;font:inherit}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.field{display:flex;flex-direction:column;gap:.45rem}.field--wide{grid-column:1/-1}.field>span{font-size:.76rem;font-weight:700}.field input,.field textarea,.field select{width:100%;min-height:44px;padding:.7rem .75rem;border:1px solid var(--line);border-radius:.6rem;color:inherit;background:#fbfdfc;font:inherit;font-size:16px}.field textarea{resize:vertical;line-height:1.5}.toggles{display:flex;align-items:flex-start;gap:1.25rem;padding:1rem;background:var(--alpin-pale);border-radius:.7rem}.toggles label{display:flex;align-items:center;gap:.55rem;font-size:.82rem;font-weight:600}.toggles input{width:18px;min-height:auto;height:18px}.form-actions{display:flex;justify-content:flex-end;gap:.65rem;margin-top:1.5rem}.autosave-hint,.progress-copy{color:var(--muted);font-size:.72rem}.event-picker{margin-bottom:1rem}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse}th,td{padding:.9rem .75rem;border-bottom:1px solid var(--line);font-size:.8rem;text-align:start}th{color:var(--muted);font-size:.69rem;letter-spacing:.05em;text-transform:uppercase}.material-list{display:flex;flex-direction:column;gap:.65rem}.material-list article{display:grid;grid-template-columns:42px minmax(0,1fr) auto 42px;align-items:center;gap:.75rem;padding:.75rem;background:#f8fbfa;border-radius:.7rem}.material-list small{display:block;margin-top:.25rem;color:var(--muted);font-size:.72rem}.material-check,.icon-button{width:40px;height:40px;display:grid;place-items:center;border:1px solid var(--line);border-radius:.55rem;color:var(--alpin);background:#fff;cursor:pointer}.icon-button.danger{color:#a92727}.empty-state{display:grid;place-items:center;padding:3.5rem 1rem;text-align:center}.empty-state.small{padding:2rem 1rem}.empty-state>i{color:var(--alpin);font-size:2rem}.empty-state h3{margin:1rem 0 .35rem}.empty-state p{max-width:48ch;margin:.25rem 0;color:var(--muted);font-size:.82rem}.empty-state a{margin-top:1rem;color:var(--alpin);font-weight:700}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:1050px){.metric-grid{grid-template-columns:repeat(2,1fr)}.split-layout,.materials-layout{grid-template-columns:1fr}.event-list-panel{max-height:none}}@media(max-width:680px){.alpin-admin{padding-inline:0}.page-heading{align-items:flex-start;flex-direction:column}.public-link{width:100%}.metric-grid,.metric-grid--three,.form-grid{grid-template-columns:1fr}.field--wide{grid-column:1}.event-row{grid-template-columns:52px minmax(0,1fr) auto}.event-count,.event-row>i{display:none}.compact .event-row{grid-template-columns:48px minmax(0,1fr)}.compact .status{grid-column:2;justify-self:start}.form-actions,.toggles{align-items:stretch;flex-direction:column}.form-actions button{width:100%}.panel{padding:1rem}.section-tabs{margin-inline:-.25rem}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
.team-layout{grid-template-columns:minmax(300px,.7fr) minmax(480px,1.3fr)}
.team-submit{width:100%;margin-top:1rem}
.team-list{display:flex;flex-direction:column;gap:.65rem}
.team-list article{display:grid;grid-template-columns:48px minmax(0,1fr) auto 42px;align-items:center;gap:.8rem;padding:.8rem;background:#f8fbfa;border-radius:.75rem}
.team-list small{display:block;margin-top:.2rem;color:var(--muted);font-size:.74rem}
.avatar{width:44px;height:44px;display:grid;place-items:center;border-radius:50%;color:#fff;background:var(--alpin-dark);font-size:.78rem;font-weight:800;letter-spacing:.04em}
@media(max-width:1050px){.team-layout{grid-template-columns:1fr}}
@media(max-width:680px){.team-list article{grid-template-columns:44px minmax(0,1fr) 42px}.team-list .status{grid-column:2;justify-self:start}.team-list .icon-button{grid-column:3;grid-row:1/3}}
.page-heading{padding:1.5rem;color:#fff;background:linear-gradient(135deg,var(--heds-navy-deep),var(--heds-navy));border-radius:1rem}.page-heading .eyebrow{color:var(--heds-yellow)}.page-heading .heading-copy{color:rgba(255,255,255,.72)}.page-heading .public-link{color:var(--heds-navy);background:var(--heds-yellow);border-color:var(--heds-yellow)}
.section-tabs{background:var(--heds-navy)}.section-tabs a{color:rgba(255,255,255,.78)}.section-tabs a:hover{color:#fff;background:rgba(255,255,255,.08)}.section-tabs a.active{color:var(--heds-navy);background:var(--heds-yellow);box-shadow:0 5px 18px rgba(7,20,38,.22)}
.primary-button{color:var(--heds-navy);background:var(--heds-yellow);border-color:var(--heds-yellow)}.metric-grid article>i,.event-row time,.empty-state>i,.material-check,.icon-button{color:var(--heds-yellow-ink)}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline-color:var(--heds-yellow)}
</style>
