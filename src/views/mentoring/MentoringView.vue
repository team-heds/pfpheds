<template>
  <div class="page-wrapper" data-page-scroll>
    <Navbar />
    <main class="mentoring">
      <GamificationPageHeader
        title="Mentorat"
        description="Des étudiants proposent un moment pour répondre à vos questions, en personne ou en visio. Réservez un créneau ou proposez le vôtre."
        icon="pi pi-comments"
        @back="goBack"
      >
        <template #actions>
          <Button
            label="Proposer un créneau"
            icon="pi pi-plus"
            class="mentoring__primary"
            @click="openCreate"
          />
        </template>
      </GamificationPageHeader>

      <p class="mentoring__rule">
        <i class="pi pi-star-fill" aria-hidden="true"></i>
        <span>
          Après la rencontre, le mentor et l’étudiant la confirment chacun de leur côté : chacun gagne alors
          {{ xp }} XP, qui comptent aussi pour sa maison ({{ weeklyCap }} rencontres récompensées par semaine au maximum).
        </span>
      </p>

      <TabView v-model:activeIndex="activeTab" class="mentoring__tabs">
        <!-- Créneaux libres -->
        <TabPanel header="Créneaux libres">
          <form class="filters" aria-label="Filtrer les créneaux" @submit.prevent>
            <div class="field">
              <label for="mentoring-filter-tag">Sujet</label>
              <Dropdown
                v-model="filters.tag"
                input-id="mentoring-filter-tag"
                :options="filterOptions.tags"
                placeholder="Tous les sujets"
                show-clear
              />
            </div>
            <div class="field">
              <label for="mentoring-filter-classe">Classe du mentor</label>
              <Dropdown
                v-model="filters.classe"
                input-id="mentoring-filter-classe"
                :options="filterOptions.classes"
                placeholder="Toutes les classes"
                show-clear
              />
            </div>
            <div class="field">
              <label for="mentoring-filter-date">Date</label>
              <input
                id="mentoring-filter-date"
                v-model="filters.date"
                type="date"
                class="p-inputtext p-component"
                :min="today"
              />
            </div>
            <div class="filters__toggle">
              <Checkbox v-model="filters.includeBooked" input-id="mentoring-filter-booked" binary />
              <label for="mentoring-filter-booked">Afficher aussi les créneaux déjà pris</label>
            </div>
            <Button
              v-if="hasActiveFilters"
              type="button"
              label="Effacer les filtres"
              icon="pi pi-filter-slash"
              text
              @click="resetFilters"
            />
          </form>

          <div v-if="loading" class="state" role="status">
            <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
            <p>Chargement des créneaux…</p>
          </div>

          <div v-else-if="loadError" class="state" role="alert">
            <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
            <p>{{ loadError }}</p>
            <Button label="Réessayer" icon="pi pi-refresh" @click="loadAll" />
          </div>

          <div v-else-if="visibleSlots.length === 0" class="state">
            <i class="pi pi-calendar" aria-hidden="true"></i>
            <p v-if="hasActiveFilters">Aucun créneau ne correspond à ces filtres.</p>
            <p v-else>Aucun créneau libre pour le moment. Vous pouvez être la première personne à en proposer un.</p>
            <Button
              v-if="hasActiveFilters"
              label="Effacer les filtres"
              icon="pi pi-filter-slash"
              outlined
              @click="resetFilters"
            />
            <Button v-else label="Proposer un créneau" icon="pi pi-plus" @click="openCreate" />
          </div>

          <div v-else aria-live="polite">
            <p class="count">{{ visibleSlots.length }} {{ visibleSlots.length > 1 ? 'créneaux' : 'créneau' }}</p>
            <section v-for="day in slotDays" :key="day.key" class="day">
              <h2 class="day__title">{{ formatDay(day.date) }}</h2>
              <ul class="slots">
                <li v-for="slot in day.slots" :key="slot.slot_id" class="slot" :class="{ 'slot--taken': slot.is_booked }">
                  <div class="slot__time">
                    <span class="slot__start">{{ formatTime(slot.starts_at) }}</span>
                    <span class="slot__end">jusqu’à {{ formatTime(slot.ends_at) }}</span>
                  </div>
                  <div class="slot__body">
                    <h3 class="slot__topics">{{ slot.topics }}</h3>
                    <p class="slot__meta">
                      <span><i class="pi pi-user" aria-hidden="true"></i> {{ slot.mentor_name }}</span>
                      <span class="slot__classe">{{ slot.mentor_classe || 'Classe non renseignée' }}</span>
                      <span><i class="pi pi-map-marker" aria-hidden="true"></i> {{ slot.location }}</span>
                    </p>
                    <ul v-if="slot.tags.length" class="tags" aria-label="Sujets">
                      <li v-for="tag in slot.tags" :key="tag">{{ tag }}</li>
                    </ul>
                    <p v-if="slot.note" class="slot__note">{{ slot.note }}</p>
                  </div>
                  <div class="slot__actions">
                    <span v-if="slot.is_mine" class="status status--muted">Votre créneau</span>
                    <span v-else-if="slot.booked_by_me" class="status status--ok">Réservé par vous</span>
                    <span v-else-if="slot.is_booked" class="status status--muted">Déjà pris</span>
                    <Button
                      v-else
                      label="Réserver"
                      icon="pi pi-calendar-plus"
                      :aria-label="`Réserver le créneau de ${slot.mentor_name}, ${formatDay(day.date)} à ${formatTime(slot.starts_at)}`"
                      @click="openBooking(slot)"
                    />
                    <Button
                      v-if="isAdmin"
                      label="Retirer"
                      icon="pi pi-ban"
                      severity="danger"
                      text
                      :aria-label="`Retirer le créneau de ${slot.mentor_name} (administration)`"
                      @click="openRemove(slot)"
                    />
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </TabPanel>

        <!-- Mes créneaux -->
        <TabPanel>
          <template #header>
            <span>Mes créneaux</span>
            <span v-if="toConfirmCount" class="tab-badge" :aria-label="`${toConfirmCount} à confirmer`">{{ toConfirmCount }}</span>
          </template>

          <PushOptIn
            class="mentoring__push"
            purpose="quand un de vos créneaux est réservé, annulé ou confirmé"
          />

          <div v-if="loading" class="state" role="status">
            <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
            <p>Chargement de vos créneaux…</p>
          </div>

          <div v-else-if="loadError" class="state" role="alert">
            <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
            <p>{{ loadError }}</p>
            <Button label="Réessayer" icon="pi pi-refresh" @click="loadAll" />
          </div>

          <div v-else-if="mySlots.length === 0" class="state">
            <i class="pi pi-calendar" aria-hidden="true"></i>
            <p>Vous n’avez encore ni proposé ni réservé de créneau.</p>
            <Button label="Voir les créneaux libres" icon="pi pi-search" outlined @click="activeTab = 0" />
          </div>

          <template v-else>
            <section v-for="group in myGroups" :key="group.key" class="day">
              <h2 class="day__title">{{ group.title }}</h2>
              <ul class="slots">
                <li v-for="row in group.rows" :key="`${row.my_role}-${row.booking_id || row.slot_id}`" class="slot">
                  <div class="slot__time">
                    <span class="slot__date">{{ formatShortDay(row.starts_at) }}</span>
                    <span class="slot__start">{{ formatTime(row.starts_at) }}</span>
                    <span class="slot__end">jusqu’à {{ formatTime(row.ends_at) }}</span>
                  </div>
                  <div class="slot__body">
                    <p class="slot__role">
                      {{ row.my_role === 'mentor' ? 'Vous proposez ce créneau' : 'Vous avez réservé ce créneau' }}
                    </p>
                    <h3 class="slot__topics">{{ row.topics }}</h3>
                    <p class="slot__meta">
                      <span v-if="row.other_name">
                        <i class="pi pi-user" aria-hidden="true"></i>
                        {{ row.my_role === 'mentor' ? 'Réservé par' : 'Mentor :' }} {{ row.other_name }}
                      </span>
                      <span v-if="row.other_name" class="slot__classe">{{ row.other_classe || 'Classe non renseignée' }}</span>
                      <span><i class="pi pi-map-marker" aria-hidden="true"></i> {{ row.location }}</span>
                    </p>
                    <p v-if="row.booking_message" class="slot__message">
                      <span class="slot__message-label">{{ row.my_role === 'mentor' ? 'Message reçu' : 'Votre message' }}</span>
                      {{ row.booking_message }}
                    </p>
                    <p v-if="row.note" class="slot__note">{{ row.note }}</p>
                    <p class="slot__phase" :class="`slot__phase--${phaseOf(row).tone}`">
                      <i :class="phaseOf(row).icon" aria-hidden="true"></i>
                      {{ phaseOf(row).label }}
                    </p>
                  </div>
                  <div class="slot__actions">
                    <Button
                      v-if="phaseOf(row).key === 'to_confirm'"
                      label="Confirmer la rencontre"
                      icon="pi pi-check"
                      :loading="busyId === row.slot_id"
                      @click="confirmSession(row)"
                    />
                    <Button
                      v-if="phaseOf(row).key === 'upcoming' && row.my_role === 'mentee'"
                      label="Annuler ma réservation"
                      icon="pi pi-times"
                      severity="secondary"
                      outlined
                      @click="openCancel(row, 'booking')"
                    />
                    <Button
                      v-if="['open', 'upcoming'].includes(phaseOf(row).key) && row.my_role === 'mentor'"
                      label="Annuler le créneau"
                      icon="pi pi-times"
                      severity="secondary"
                      outlined
                      @click="openCancel(row, 'slot')"
                    />
                  </div>
                </li>
              </ul>
            </section>
          </template>

          <section v-if="notifications.length" class="news" aria-labelledby="mentoring-news-title">
            <h2 id="mentoring-news-title" class="day__title">Dernières notifications</h2>
            <ul>
              <li v-for="item in notifications" :key="item.id">
                <span class="news__date">{{ formatDateTime(item.created_at) }}</span>
                <span>{{ item.body }}</span>
              </li>
            </ul>
          </section>
        </TabPanel>
      </TabView>
    </main>

    <!-- Proposer un créneau -->
    <Dialog
      v-model:visible="createVisible"
      header="Proposer un créneau"
      modal
      :draggable="false"
      :style="{ width: '640px', maxWidth: '96vw' }"
    >
      <form id="mentoring-create-form" class="form" novalidate @submit.prevent="submitCreate">
        <div class="form__row">
          <div class="field">
            <label for="mentoring-date">Date</label>
            <input
              id="mentoring-date"
              v-model="draft.date"
              type="date"
              class="p-inputtext p-component"
              :class="{ 'p-invalid': draftErrors.start }"
              :min="today"
              required
              :aria-describedby="draftErrors.start ? 'mentoring-start-error' : undefined"
            />
          </div>
          <div class="field">
            <label for="mentoring-start">Début</label>
            <input
              id="mentoring-start"
              v-model="draft.startTime"
              type="time"
              class="p-inputtext p-component"
              :class="{ 'p-invalid': draftErrors.start }"
              required
              :aria-describedby="draftErrors.start ? 'mentoring-start-error' : undefined"
            />
          </div>
          <div class="field">
            <label for="mentoring-end">Fin</label>
            <input
              id="mentoring-end"
              v-model="draft.endTime"
              type="time"
              class="p-inputtext p-component"
              :class="{ 'p-invalid': draftErrors.end }"
              required
              :aria-describedby="draftErrors.end ? 'mentoring-end-error' : undefined"
            />
          </div>
        </div>
        <small v-if="draftErrors.start" id="mentoring-start-error" class="form__error">{{ draftErrors.start }}</small>
        <small v-if="draftErrors.end" id="mentoring-end-error" class="form__error">{{ draftErrors.end }}</small>

        <div class="field">
          <label for="mentoring-location">Lieu</label>
          <InputText
            id="mentoring-location"
            v-model="draft.location"
            maxlength="160"
            placeholder="Cafétéria HEdS, ou « en visio »"
            :class="{ 'p-invalid': draftErrors.location }"
            :aria-describedby="draftErrors.location ? 'mentoring-location-error' : undefined"
          />
          <small v-if="draftErrors.location" id="mentoring-location-error" class="form__error">{{ draftErrors.location }}</small>
        </div>

        <div class="field">
          <label for="mentoring-topics">Sujets sur lesquels vous pouvez aider</label>
          <Textarea
            id="mentoring-topics"
            v-model="draft.topics"
            rows="2"
            auto-resize
            maxlength="500"
            placeholder="Par exemple : préparer l’examen d’anatomie, choisir ses stages PFP"
            :class="{ 'p-invalid': draftErrors.topics }"
            :aria-describedby="draftErrors.topics ? 'mentoring-topics-error' : undefined"
          />
          <small v-if="draftErrors.topics" id="mentoring-topics-error" class="form__error">{{ draftErrors.topics }}</small>
        </div>

        <fieldset class="field form__tags">
          <legend>Étiquettes <span class="form__hint">(facultatif, {{ maxTags }} au maximum)</span></legend>
          <div class="tag-picker">
            <button
              v-for="tag in tagChoices"
              :key="tag"
              type="button"
              class="tag-toggle"
              :class="{ 'tag-toggle--on': draft.tags.includes(tag) }"
              :aria-pressed="draft.tags.includes(tag)"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
          <div class="tag-add">
            <label for="mentoring-tag-new" class="sr-only">Ajouter une autre étiquette</label>
            <InputText
              id="mentoring-tag-new"
              v-model="newTag"
              maxlength="30"
              placeholder="Autre étiquette"
              @keydown.enter.prevent="addCustomTag"
            />
            <Button type="button" label="Ajouter" icon="pi pi-plus" outlined :disabled="!newTag.trim()" @click="addCustomTag" />
          </div>
          <small v-if="draftErrors.tags" class="form__error">{{ draftErrors.tags }}</small>
        </fieldset>

        <div class="field">
          <label for="mentoring-note">Note <span class="form__hint">(facultatif)</span></label>
          <Textarea
            id="mentoring-note"
            v-model="draft.note"
            rows="2"
            auto-resize
            maxlength="500"
            placeholder="Une précision utile : où vous trouver, quoi apporter…"
          />
        </div>

        <p v-if="createError" class="form__error" role="alert">{{ createError }}</p>
      </form>
      <template #footer>
        <Button label="Fermer" text @click="createVisible = false" />
        <Button
          type="submit"
          form="mentoring-create-form"
          label="Publier le créneau"
          icon="pi pi-check"
          :loading="saving"
        />
      </template>
    </Dialog>

    <!-- Réserver -->
    <Dialog
      v-model:visible="bookingVisible"
      header="Réserver ce créneau"
      modal
      :draggable="false"
      :style="{ width: '520px', maxWidth: '96vw' }"
    >
      <form v-if="selectedSlot" id="mentoring-book-form" class="form" @submit.prevent="submitBooking">
        <p class="form__summary">
          <strong>{{ selectedSlot.topics }}</strong><br />
          {{ formatDay(new Date(selectedSlot.starts_at)) }}, {{ formatTime(selectedSlot.starts_at) }} – {{ formatTime(selectedSlot.ends_at) }}<br />
          {{ selectedSlot.mentor_name }} · {{ selectedSlot.location }}
        </p>
        <div class="field">
          <label for="mentoring-message">Message au mentor <span class="form__hint">(facultatif)</span></label>
          <Textarea
            id="mentoring-message"
            v-model="bookingMessage"
            rows="3"
            auto-resize
            maxlength="500"
            placeholder="Vos questions, ce que vous aimeriez aborder…"
          />
          <small class="form__hint">Seul le mentor lira ce message.</small>
        </div>
        <p v-if="bookingError" class="form__error" role="alert">{{ bookingError }}</p>
      </form>
      <template #footer>
        <Button label="Fermer" text @click="bookingVisible = false" />
        <Button type="submit" form="mentoring-book-form" label="Réserver" icon="pi pi-calendar-plus" :loading="saving" />
      </template>
    </Dialog>

    <!-- Annuler (réservation ou créneau) -->
    <Dialog
      v-model:visible="cancelVisible"
      :header="cancelKind === 'slot' ? 'Annuler ce créneau ?' : 'Annuler votre réservation ?'"
      modal
      :draggable="false"
      :style="{ width: '480px', maxWidth: '96vw' }"
    >
      <p v-if="selectedRow" class="form__summary">
        {{ formatShortDay(selectedRow.starts_at) }}, {{ formatTime(selectedRow.starts_at) }} – {{ formatTime(selectedRow.ends_at) }} ·
        {{ selectedRow.topics }}
      </p>
      <p>
        <template v-if="cancelKind === 'slot'">
          Le créneau disparaîtra de la liste.
          <template v-if="selectedRow?.other_name">{{ selectedRow.other_name }} sera prévenu·e.</template>
        </template>
        <template v-else>Le créneau redeviendra libre et le mentor sera prévenu.</template>
      </p>
      <p v-if="cancelError" class="form__error" role="alert">{{ cancelError }}</p>
      <template #footer>
        <Button label="Garder" text @click="cancelVisible = false" />
        <Button
          :label="cancelKind === 'slot' ? 'Annuler le créneau' : 'Annuler ma réservation'"
          icon="pi pi-times"
          severity="danger"
          :loading="saving"
          @click="submitCancel"
        />
      </template>
    </Dialog>

    <!-- Administration : retirer un créneau -->
    <Dialog
      v-model:visible="removeVisible"
      header="Retirer ce créneau ?"
      modal
      :draggable="false"
      :style="{ width: '520px', maxWidth: '96vw' }"
    >
      <form v-if="selectedSlot" id="mentoring-remove-form" class="form" @submit.prevent="submitRemove">
        <p class="form__summary">
          <strong>{{ selectedSlot.topics }}</strong><br />
          {{ selectedSlot.mentor_name }} · {{ formatDay(new Date(selectedSlot.starts_at)) }}, {{ formatTime(selectedSlot.starts_at) }}
        </p>
        <p>Le créneau ne sera plus visible. Son auteur et la personne qui l’a réservé seront prévenus.</p>
        <div class="field">
          <label for="mentoring-remove-reason">Motif <span class="form__hint">(facultatif, conservé pour l’administration)</span></label>
          <InputText id="mentoring-remove-reason" v-model="removeReason" maxlength="300" />
        </div>
        <p v-if="removeError" class="form__error" role="alert">{{ removeError }}</p>
      </form>
      <template #footer>
        <Button label="Fermer" text @click="removeVisible = false" />
        <Button type="submit" form="mentoring-remove-form" label="Retirer le créneau" icon="pi pi-ban" severity="danger" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'
import Textarea from 'primevue/textarea'
import Navbar from '@/components/common/utils/Navbar.vue'
import PushOptIn from '@/components/push/PushOptIn.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import { useAuthStore } from '@/stores/authStore'
import { useRoleStore } from '@/stores/role'
import {
  MENTORING_MAX_TAGS,
  MENTORING_SUGGESTED_TAGS,
  MENTORING_WEEKLY_CAP,
  MENTORING_XP,
  describeConfirmation,
  filterSlots,
  groupSlotsByDay,
  mentoringService,
  mySlotPhase,
  normalizeTags,
  slotFilterOptions,
  validateSlotDraft,
} from '@/service/mentoringServiceSupabase'

const MY_TAB_QUERY = 'mes-creneaux'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()
const roleStore = useRoleStore()

const xp = MENTORING_XP
const weeklyCap = MENTORING_WEEKLY_CAP
const maxTags = MENTORING_MAX_TAGS

const loading = ref(true)
const loadError = ref('')
const slots = ref([])
const mySlots = ref([])
const notifications = ref([])
const activeTab = ref(route.query.onglet === MY_TAB_QUERY ? 1 : 0)
const saving = ref(false)
const busyId = ref(null)
const now = ref(new Date())

const isAdmin = computed(() => Boolean(roleStore.isSuper || roleStore.can?.('admin')))

const pad = (value) => String(value).padStart(2, '0')
const toDateInput = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const fromDateInput = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null
}
const today = toDateInput(new Date())

// --- Affichage des dates -----------------------------------------------------
const dayFormat = new Intl.DateTimeFormat('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDayFormat = new Intl.DateTimeFormat('fr-CH', { weekday: 'short', day: 'numeric', month: 'short' })
const timeFormat = new Intl.DateTimeFormat('fr-CH', { hour: '2-digit', minute: '2-digit' })
const dateTimeFormat = new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)
const formatDay = (date) => capitalize(dayFormat.format(date))
const formatShortDay = (value) => capitalize(shortDayFormat.format(new Date(value)))
const formatTime = (value) => timeFormat.format(new Date(value))
const formatDateTime = (value) => dateTimeFormat.format(new Date(value))

// --- Liste publique et filtres ----------------------------------------------
const filters = reactive({ tag: null, classe: null, date: '', includeBooked: false })
const filterOptions = computed(() => slotFilterOptions(slots.value))
const hasActiveFilters = computed(() => Boolean(filters.tag || filters.classe || filters.date || filters.includeBooked))
const visibleSlots = computed(() => filterSlots(slots.value, {
  tag: filters.tag,
  classe: filters.classe,
  date: fromDateInput(filters.date),
  includeBooked: filters.includeBooked,
}))
const slotDays = computed(() => groupSlotsByDay(visibleSlots.value))

function resetFilters() {
  Object.assign(filters, { tag: null, classe: null, date: '', includeBooked: false })
}

// --- Mes créneaux -------------------------------------------------------------
const PHASES = {
  open: { label: 'Libre : personne n’a encore réservé.', icon: 'pi pi-clock', tone: 'muted' },
  expired: { label: 'Passé sans réservation.', icon: 'pi pi-minus-circle', tone: 'muted' },
  upcoming: { label: 'Rencontre à venir.', icon: 'pi pi-calendar', tone: 'ok' },
  in_progress: { label: 'Rencontre en cours. Vous pourrez la confirmer après l’heure de fin.', icon: 'pi pi-clock', tone: 'ok' },
  to_confirm: { label: 'À confirmer : la rencontre a-t-elle eu lieu ?', icon: 'pi pi-exclamation-circle', tone: 'action' },
  waiting_other: { label: 'Vous avez confirmé. En attente de la confirmation de l’autre personne.', icon: 'pi pi-hourglass', tone: 'muted' },
  confirmation_closed: { label: 'Délai de confirmation dépassé.', icon: 'pi pi-minus-circle', tone: 'muted' },
  booking_cancelled: { label: 'Réservation annulée.', icon: 'pi pi-times-circle', tone: 'muted' },
  cancelled: { label: 'Créneau annulé.', icon: 'pi pi-times-circle', tone: 'muted' },
  removed: { label: 'Créneau retiré par l’administration.', icon: 'pi pi-ban', tone: 'muted' },
}

function phaseOf(row) {
  const key = mySlotPhase(row, now.value)
  if (key === 'completed') {
    const gained = Number(row.my_xp || 0)
    const label = gained > 0
      ? `Rencontre confirmée par vous deux : +${gained} XP.`
      : row.my_reward_reason === 'weekly_cap'
        ? 'Rencontre confirmée. Plafond hebdomadaire atteint : pas de points supplémentaires.'
        : 'Rencontre confirmée par vous deux.'
    return { key, label, icon: 'pi pi-check-circle', tone: 'ok' }
  }
  return { key, ...PHASES[key] }
}

const ACTIVE_PHASES = ['to_confirm', 'in_progress', 'upcoming', 'open', 'waiting_other']
const toConfirmCount = computed(() => mySlots.value.filter((row) => mySlotPhase(row, now.value) === 'to_confirm').length)
const myGroups = computed(() => {
  const current = []
  const past = []
  for (const row of mySlots.value) {
    (ACTIVE_PHASES.includes(mySlotPhase(row, now.value)) ? current : past).push(row)
  }
  past.reverse()
  return [
    { key: 'current', title: 'À venir et à confirmer', rows: current },
    { key: 'past', title: 'Terminés et annulés', rows: past },
  ].filter((group) => group.rows.length)
})

// --- Chargement ----------------------------------------------------------------
async function loadAll() {
  loading.value = true
  loadError.value = ''
  try {
    const [publicSlots, mine] = await Promise.all([
      mentoringService.listSlots(),
      mentoringService.listMySlots(),
    ])
    slots.value = publicSlots
    mySlots.value = mine
    now.value = new Date()
    notifications.value = await mentoringService.listNotifications(authStore.user?.id)
  } catch (error) {
    loadError.value = error.message
  } finally {
    loading.value = false
  }
}

async function refresh() {
  try {
    const [publicSlots, mine] = await Promise.all([
      mentoringService.listSlots(),
      mentoringService.listMySlots(),
    ])
    slots.value = publicSlots
    mySlots.value = mine
    now.value = new Date()
  } catch {
    // La liste affichée reste en place ; le prochain chargement la corrigera.
  }
}

// --- Proposer un créneau ------------------------------------------------------
const emptyDraft = () => ({ date: '', startTime: '', endTime: '', location: '', topics: '', tags: [], note: '' })
const createVisible = ref(false)
const createError = ref('')
const draft = reactive(emptyDraft())
const draftErrors = ref({})
const newTag = ref('')
const tagChoices = computed(() => normalizeTags([...MENTORING_SUGGESTED_TAGS, ...draft.tags]))

function openCreate() {
  Object.assign(draft, emptyDraft())
  draftErrors.value = {}
  createError.value = ''
  newTag.value = ''
  createVisible.value = true
}

function toggleTag(tag) {
  draft.tags = draft.tags.includes(tag)
    ? draft.tags.filter((item) => item !== tag)
    : [...draft.tags, tag]
}

function addCustomTag() {
  const [tag] = normalizeTags([newTag.value])
  if (tag && !draft.tags.includes(tag)) draft.tags = [...draft.tags, tag]
  newTag.value = ''
}

// Après un envoi refusé, les messages d'erreur suivent la saisie.
watch(draft, () => {
  if (Object.keys(draftErrors.value).length) {
    draftErrors.value = validateSlotDraft({ ...draft, date: fromDateInput(draft.date) }).errors
  }
}, { deep: true })

async function submitCreate() {
  const check = validateSlotDraft({ ...draft, date: fromDateInput(draft.date) })
  draftErrors.value = check.errors
  createError.value = ''
  if (!check.valid) return
  saving.value = true
  try {
    await mentoringService.createSlot({ ...check, note: draft.note })
    createVisible.value = false
    toast.add({ severity: 'success', summary: 'Créneau publié', detail: 'Il apparaît maintenant dans la liste des créneaux libres.', life: 5000 })
    activeTab.value = 1
    await refresh()
  } catch (error) {
    createError.value = error.message
  } finally {
    saving.value = false
  }
}

// --- Réserver -------------------------------------------------------------------
const bookingVisible = ref(false)
const bookingMessage = ref('')
const bookingError = ref('')
const selectedSlot = ref(null)

function openBooking(slot) {
  selectedSlot.value = slot
  bookingMessage.value = ''
  bookingError.value = ''
  bookingVisible.value = true
}

async function submitBooking() {
  saving.value = true
  bookingError.value = ''
  try {
    await mentoringService.bookSlot(selectedSlot.value.slot_id, bookingMessage.value)
    bookingVisible.value = false
    toast.add({ severity: 'success', summary: 'Créneau réservé', detail: 'Le mentor est prévenu. Retrouvez la rencontre dans « Mes créneaux ».', life: 6000 })
    activeTab.value = 1
  } catch (error) {
    bookingError.value = error.message
  } finally {
    saving.value = false
    await refresh()
  }
}

// --- Annuler --------------------------------------------------------------------
const cancelVisible = ref(false)
const cancelKind = ref('booking')
const cancelError = ref('')
const selectedRow = ref(null)

function openCancel(row, kind) {
  selectedRow.value = row
  cancelKind.value = kind
  cancelError.value = ''
  cancelVisible.value = true
}

async function submitCancel() {
  saving.value = true
  cancelError.value = ''
  try {
    if (cancelKind.value === 'slot') await mentoringService.cancelSlot(selectedRow.value.slot_id)
    else await mentoringService.cancelBooking(selectedRow.value.slot_id)
    cancelVisible.value = false
    toast.add({
      severity: 'info',
      summary: cancelKind.value === 'slot' ? 'Créneau annulé' : 'Réservation annulée',
      life: 4000,
    })
  } catch (error) {
    cancelError.value = error.message
  } finally {
    saving.value = false
    await refresh()
  }
}

// --- Confirmer la rencontre ----------------------------------------------------
async function confirmSession(row) {
  busyId.value = row.slot_id
  try {
    const result = await mentoringService.confirmSession(row.slot_id)
    toast.add({ ...describeConfirmation(result), life: 7000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Confirmation impossible', detail: error.message, life: 7000 })
  } finally {
    busyId.value = null
    await refresh()
  }
}

// --- Administration --------------------------------------------------------------
const removeVisible = ref(false)
const removeReason = ref('')
const removeError = ref('')

function openRemove(slot) {
  selectedSlot.value = slot
  removeReason.value = ''
  removeError.value = ''
  removeVisible.value = true
}

async function submitRemove() {
  saving.value = true
  removeError.value = ''
  try {
    await mentoringService.adminRemoveSlot(selectedSlot.value.slot_id, removeReason.value)
    removeVisible.value = false
    toast.add({ severity: 'info', summary: 'Créneau retiré', life: 4000 })
  } catch (error) {
    removeError.value = error.message
  } finally {
    saving.value = false
    await refresh()
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/feed')
}

watch(activeTab, (index) => {
  const query = { ...route.query }
  if (index === 1) query.onglet = MY_TAB_QUERY
  else delete query.onglet
  router.replace({ query }).catch(() => {})
})

onMounted(loadAll)
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
}

.mentoring {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  color: var(--text-color);
}

.mentoring :deep(.game-header) { max-width: none; }

:deep(.mentoring__primary) {
  min-height: 44px;
  border-radius: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.mentoring__rule {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  max-width: 75ch;
  margin: 0 0 1.5rem;
  color: var(--text-color-secondary);
  line-height: 1.55;
}

.mentoring__rule i {
  margin-top: 0.2rem;
  color: #f3c300;
}

.mentoring__tabs :deep(.p-tabview-panels) {
  padding: 1.25rem 0 0;
  background: transparent;
}

.mentoring__tabs :deep(.p-tabview-nav),
.mentoring__tabs :deep(.p-tabview-nav li .p-tabview-nav-link) {
  background: transparent;
}

.mentoring__tabs :deep(.p-tabview-nav-link) {
  gap: 0.5rem;
  min-height: 48px;
}

.tab-badge {
  display: inline-grid;
  min-width: 1.4rem;
  height: 1.4rem;
  padding: 0 0.35rem;
  place-items: center;
  color: #071426;
  font-size: 0.78rem;
  font-weight: 800;
  background: #f3c300;
  border-radius: 999px;
}

.mentoring__push { margin-bottom: 1.5rem; }

/* Filtres */
.filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 14rem)) auto;
  gap: 0.85rem 1rem;
  align-items: end;
  margin-bottom: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  margin: 0;
}

.field label,
.form__tags legend {
  color: var(--text-color);
  font-size: 0.9rem;
  font-weight: 600;
}

.field :deep(.p-dropdown),
.field :deep(.p-inputtext),
.field input.p-inputtext {
  width: 100%;
  min-height: 44px;
}

.filters__toggle {
  display: flex;
  grid-column: 1 / -1;
  gap: 0.6rem;
  align-items: center;
  min-height: 44px;
}

.filters > :deep(.p-button) { justify-self: start; }

/* États */
.state {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  align-items: center;
  padding: 3rem 1rem;
  color: var(--text-color-secondary);
  text-align: center;
  border: 1px dashed var(--surface-border);
  border-radius: 0.85rem;
}

.state i { font-size: 1.75rem; color: var(--primary-color); }
.state p { max-width: 46ch; margin: 0; line-height: 1.5; }

.count {
  margin: 0 0 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

/* Agenda */
.day { margin-top: 2rem; }
.day:first-of-type { margin-top: 0.5rem; }

.day__title {
  margin: 0 0 0.6rem;
  color: var(--text-color);
  font-size: 1.05rem;
  font-weight: 700;
}

.slots {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--surface-border);
}

.slot {
  display: grid;
  grid-template-columns: 7.5rem minmax(0, 1fr) auto;
  gap: 1.25rem;
  align-items: start;
  padding: 1.1rem 0.25rem;
  border-bottom: 1px solid var(--surface-border);
}

.slot--taken .slot__body,
.slot--taken .slot__time { opacity: 0.72; }

.slot__time {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-variant-numeric: tabular-nums;
}

.slot__date {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.slot__start {
  color: var(--text-color);
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.15;
}

.slot__end {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.slot__role {
  margin: 0 0 0.2rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.slot__topics {
  margin: 0 0 0.4rem;
  color: var(--text-color);
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.slot__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 1rem;
  align-items: center;
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.92rem;
  overflow-wrap: anywhere;
}

.slot__meta i { margin-right: 0.25rem; font-size: 0.85rem; }

.slot__classe {
  padding: 0.1rem 0.5rem;
  color: var(--text-color);
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.6rem 0 0;
  padding: 0;
  list-style: none;
}

.tags li {
  padding: 0.15rem 0.6rem;
  color: var(--text-color);
  font-size: 0.8rem;
  background: var(--surface-hover);
  border-radius: 999px;
}

.slot__note,
.slot__message {
  max-width: 70ch;
  margin: 0.6rem 0 0;
  color: var(--text-color-secondary);
  font-size: 0.92rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.slot__message {
  padding: 0.6rem 0.8rem;
  color: var(--text-color);
  background: var(--surface-hover);
  border-radius: 0.6rem;
}

.slot__message-label {
  display: block;
  margin-bottom: 0.15rem;
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  font-weight: 600;
}

.slot__phase {
  display: flex;
  gap: 0.45rem;
  align-items: baseline;
  margin: 0.7rem 0 0;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.4;
}

.slot__phase--muted { color: var(--text-color-secondary); font-weight: 500; }
.slot__phase--ok { color: var(--green-400, #4ade80); }
.slot__phase--action { color: #f3c300; }

.slot__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
  min-width: 10rem;
}

.slot__actions :deep(.p-button) { min-height: 44px; justify-content: center; }

.status {
  padding: 0.6rem 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

.status--muted { color: var(--text-color-secondary); }
.status--ok { color: var(--green-400, #4ade80); }

/* Notifications */
.news { margin-top: 2.5rem; }

.news ul {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--surface-border);
}

.news li {
  display: grid;
  grid-template-columns: 9rem minmax(0, 1fr);
  gap: 1rem;
  padding: 0.6rem 0.25rem;
  color: var(--text-color);
  font-size: 0.92rem;
  line-height: 1.45;
  border-bottom: 1px solid var(--surface-border);
}

.news__date { color: var(--text-color-secondary); font-variant-numeric: tabular-nums; }

/* Formulaires */
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form__row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 0.85rem;
}

.form__tags {
  padding: 0;
  border: 0;
}

.form__tags legend { margin-bottom: 0.4rem; padding: 0; }

.form__hint {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  font-weight: 400;
}

.form__error {
  margin: 0;
  color: var(--red-400, #f87171);
  font-size: 0.88rem;
}

.form__summary {
  margin: 0;
  color: var(--text-color);
  line-height: 1.55;
}

.tag-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-toggle {
  min-height: 40px;
  padding: 0.35rem 0.9rem;
  color: var(--text-color);
  font: inherit;
  font-size: 0.9rem;
  background: transparent;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.tag-toggle:hover { border-color: var(--primary-color); }

.tag-toggle:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.tag-toggle--on {
  color: var(--primary-color-text);
  font-weight: 600;
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.tag-add {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.6rem;
}

.tag-add :deep(.p-inputtext) { flex: 1; min-width: 0; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  white-space: nowrap;
  border: 0;
  clip: rect(0, 0, 0, 0);
}

@media (max-width: 900px) {
  .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .mentoring { padding: 1rem 1rem 5rem; }
  .filters { grid-template-columns: minmax(0, 1fr); }

  .slot {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.6rem;
  }

  .slot__time {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: baseline;
  }

  .slot__actions { min-width: 0; }
  .form__row { grid-template-columns: minmax(0, 1fr); }
  .news li { grid-template-columns: minmax(0, 1fr); gap: 0.15rem; }
  .mentoring :deep(.game-header__actions) { flex-direction: column; align-items: stretch; }
  :deep(.mentoring__primary) { width: 100%; justify-content: center; }
  .mentoring__tabs :deep(.p-tabview-nav-link) { padding: 0.9rem 0.75rem; }
}

@media (prefers-reduced-motion: reduce) {
  .tag-toggle { transition: none; }
}

/* Téléphone : un seul défilement, celui de la page (.content dans App.vue).
   Un second bloc défilant de la hauteur de l'écran obligeait à faire défiler
   deux zones imbriquées. */
@media (max-width: 768px) {
  .page-wrapper {
    height: auto;
    min-height: 0;
    overflow: visible;
  }
}
</style>
