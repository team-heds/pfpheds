<template>
  <div ref="scrollerRef" class="m-inst-view">
    <div v-if="loading && !stages.length" class="m-stages" role="status" aria-label="Chargement de tes stages">
      <div v-for="n in 2" :key="n" class="m-stage m-stage--skeleton" aria-hidden="true">
        <span class="m-skeleton" style="width: 30%"></span>
        <span class="m-skeleton" style="width: 75%"></span>
        <span class="m-skeleton" style="width: 50%"></span>
      </div>
    </div>

    <div v-else-if="failed" class="m-state" role="alert">
      <span class="m-state__icon" aria-hidden="true"><MIcon name="alert" /></span>
      <p class="m-state__title">Tes stages ne se chargent pas</p>
      <p class="m-state__text">Vérifie ta connexion, puis réessaie.</p>
      <button type="button" class="m-ghost-button" @click="load">Réessayer</button>
    </div>

    <section v-if="!loading && !failed && loadedFor" class="m-criteria" aria-labelledby="m-criteria-title">
      <div class="m-criteria__head">
        <h3 id="m-criteria-title">Mes critères</h3>
        <span class="m-criteria__count">{{ criteria.validated.length }} sur {{ criteria.validated.length + criteria.remaining.length }}</span>
      </div>
      <div class="m-criteria__bar" role="progressbar" :aria-valuenow="criteriaPercent" aria-valuemin="0" aria-valuemax="100" aria-label="Critères validés">
        <span :style="{ width: `${criteriaPercent}%` }"></span>
      </div>
      <p class="m-criteria__label">Validés</p>
      <ul v-if="criteria.validated.length" class="m-criteria__list">
        <li v-for="criterion in criteria.validated" :key="criterion.key" class="m-criteria__item is-done">
          <MIcon name="check" />
          <span><strong>{{ criterion.key }}</strong> {{ criterion.label }}</span>
        </li>
      </ul>
      <p v-else class="m-criteria__empty">Aucun critère validé pour l’instant.</p>
      <p class="m-criteria__label">À valider</p>
      <ul v-if="criteria.remaining.length" class="m-criteria__list">
        <li v-for="criterion in criteria.remaining" :key="criterion.key" class="m-criteria__item">
          <span class="m-criteria__dot" aria-hidden="true"></span>
          <span><strong>{{ criterion.key }}</strong> {{ criterion.label }}</span>
        </li>
      </ul>
      <p v-else class="m-criteria__empty">Tous les critères sont validés.</p>
    </section>

    <div v-if="loadedFor && !loading && !failed && !stages.length" class="m-state">
      <span class="m-state__icon" aria-hidden="true"><MIcon name="building" /></span>
      <p class="m-state__title">Pas encore de stage</p>
      <p class="m-state__text">Tes places apparaîtront ici dès qu’elles seront attribuées.</p>
    </div>

    <ul v-else-if="stages.length" class="m-stages">
      <li v-for="stage in stages" :key="stage._key">
        <component
          :is="stage.InstitutionId ? 'button' : 'div'"
          :type="stage.InstitutionId ? 'button' : undefined"
          class="m-stage"
          @click="openInstitution(stage)"
        >
          <span class="m-stage__top">
            <span class="m-stage__level">{{ stage.pfp_type || stage.period || 'Stage' }}</span>
            <span class="m-stage__status" :class="`m-stage__status--${stageStatus(stage.status).tone}`">
              {{ stageStatus(stage.status).label }}
            </span>
          </span>
          <span class="m-stage__name">{{ stage.Institutionname || stage.NomPlace || 'Institution non précisée' }}</span>
          <span v-if="stage.NomPlace && stage.Institutionname" class="m-stage__place">{{ stage.NomPlace }}</span>
          <span v-if="formatStagePeriod(stage)" class="m-stage__period">
            <MIcon name="cal" />
            {{ formatStagePeriod(stage) }}
          </span>
          <span v-if="criteriaOf(stage).length" class="m-stage__tags">
            <span v-for="tag in criteriaOf(stage)" :key="tag">{{ tag }}</span>
          </span>
          <MIcon v-if="stage.InstitutionId" name="next" class="m-stage__go" />
        </component>
      </li>
    </ul>

    <div class="m-stages__links">
      <button type="button" class="m-row-link" @click="router.push(votationPath)">
        <span class="m-row-link__icon" aria-hidden="true"><MIcon name="check" /></span>
        <span class="m-row-link__text">
          <span>Mes choix de places</span>
          <small>Consulter la votation et classer mes choix</small>
        </span>
        <MIcon name="next" />
      </button>
      <button v-if="userId" type="button" class="m-row-link" @click="shell.open('mon-dossier')">
        <span class="m-row-link__icon" aria-hidden="true"><MIcon name="file" /></span>
        <span class="m-row-link__text">
          <span>Mon dossier de stage</span>
          <small>Critères validés et documents à déposer</small>
        </span>
        <MIcon name="next" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MIcon from '@/mobile/ui/MIcon.vue'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePlacesStore } from '@/stores/placesStore'
import { getVotationDestination } from '@/composables/useNavigationDestinations'
import { PROFILE_CRITERIA_KEYS } from '@/utils/profileStages'
import { useKeptScroll } from '@/mobile/shell/useKeptScroll'
import { useMobileShell } from '@/mobile/shell/useMobileShell'
import { fetchMyStages, splitCriteria } from '@/mobile/institutions/myStagesService'
import { formatStagePeriod, stageStatus } from '@/mobile/institutions/institutionHelpers'

const props = defineProps({ active: { type: Boolean, default: false } })

const router = useRouter()
const shell = useMobileShell()
const authStore = useAuthStore()
const userStore = useUserStore()
const institutionsStore = useInstitutionsStore()
const placesStore = usePlacesStore()

const scrollerRef = ref(null)
useKeptScroll(scrollerRef, () => props.active)

const stages = ref([])
const criteria = ref(splitCriteria())
const criteriaPercent = computed(() => {
  const total = criteria.value.validated.length + criteria.value.remaining.length
  return total ? Math.round((criteria.value.validated.length / total) * 100) : 0
})
const loading = ref(false)
const failed = ref(false)
const loadedFor = ref(null)

const userId = computed(() => {
  const id = authStore.user?.id
  return id && id !== 'guest-user' ? id : null
})
const votationPath = computed(() => getVotationDestination(userStore.profile))
const criteriaOf = (stage) => PROFILE_CRITERIA_KEYS.filter((key) => stage[key])

async function load() {
  if (!userId.value || loading.value) return
  loading.value = true
  failed.value = false
  try {
    await Promise.all([
      Promise.resolve(placesStore.fetchPlaces()).catch(() => null),
      Promise.resolve(institutionsStore.fetchInstitutions()).catch(() => null),
    ])
    const result = await fetchMyStages(userId.value, {
      places: placesStore.places || [],
      resolveInstitutionName: (id) => {
        const name = id ? institutionsStore.getInstitutionNameById(id) : ''
        return name === 'Institution inconnue' ? '' : name
      },
    })
    // Le plus récent en premier.
    stages.value = result.stages.slice().reverse()
    criteria.value = result.criteria
    loadedFor.value = userId.value
  } catch (error) {
    console.error('[Mes stages] Chargement impossible:', error)
    failed.value = true
  } finally {
    loading.value = false
  }
}

function openInstitution(stage) {
  if (stage.InstitutionId) router.push({ name: 'InstitutionView', params: { id: stage.InstitutionId } })
}

// Chargé à la première ouverture de la vue, puis gardé.
watch(() => [props.active, userId.value], ([active, id]) => {
  if (active && id && loadedFor.value !== id) void load()
}, { immediate: true })
</script>

<style scoped>
.m-stages {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 4px 0 0;
  list-style: none;
}
.m-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 14px 40px 14px 14px;
  border: 0;
  border-radius: 18px;
  background: var(--m-surface);
  color: var(--m-fg);
  font: inherit;
  text-align: left;
}
button.m-stage {
  cursor: pointer;
  touch-action: manipulation;
}
button.m-stage:active {
  background: var(--m-raised);
}
button.m-stage:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-stage--skeleton .m-skeleton {
  display: block;
  height: 12px;
  border-radius: 6px;
}
.m-stage__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.m-stage__level {
  padding: 3px 10px;
  border-radius: 99px;
  background: var(--m-accent);
  color: var(--m-on-accent);
  font-size: 0.75rem;
  font-weight: 700;
}
.m-stage__status {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--m-muted);
}
.m-stage__status--ok {
  color: var(--m-ok);
}
.m-stage__status--danger {
  color: var(--m-danger);
}
.m-stage__name {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}
.m-stage__place,
.m-stage__period {
  color: var(--m-muted);
  font-size: 0.8125rem;
}
.m-stage__period {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.m-stage__period :deep(.m-icon) {
  width: 15px;
  height: 15px;
}
.m-stage__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.m-stage__tags span {
  padding: 2px 9px;
  border-radius: 99px;
  background: var(--m-raised);
  color: var(--m-muted);
  font-size: 0.6875rem;
  font-weight: 500;
}
.m-stage__go {
  position: absolute;
  top: 50%;
  right: 12px;
  width: 18px;
  height: 18px;
  color: var(--m-muted);
  transform: translateY(-50%);
}
.m-criteria {
  margin-bottom: 14px;
  padding: 14px;
  border-radius: 18px;
  background: var(--m-surface);
}
.m-criteria__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.m-criteria__head h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
}
.m-criteria__count {
  color: var(--m-muted);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}
.m-criteria__bar {
  display: block;
  height: 6px;
  margin: 10px 0 4px;
  overflow: hidden;
  border-radius: 3px;
  background: var(--m-raised);
}
.m-criteria__bar span {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--m-ok);
}
.m-criteria__label {
  margin: 12px 0 6px;
  color: var(--m-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.m-criteria__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.m-criteria__item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.875rem;
  line-height: 1.35;
}
.m-criteria__item strong {
  margin-right: 4px;
  font-weight: 600;
}
.m-criteria__item :deep(.m-icon) {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--m-ok);
  stroke-width: 2.4;
}
.m-criteria__dot {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: 2px solid var(--m-line);
  border-radius: 50%;
}
.m-criteria__empty {
  margin: 0;
  color: var(--m-muted);
  font-size: 0.8125rem;
}
.m-stages__links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}
</style>
