<template>
  <div ref="scrollerRef" class="m-inst-view">
    <div class="m-inst-search">
      <form class="m-inst-search__field" role="search" @submit.prevent="inputRef?.blur()">
        <MIcon name="search" />
        <label for="m-inst-search-input" class="m-sr-only">Rechercher une institution</label>
        <input
          id="m-inst-search-input"
          ref="inputRef"
          v-model="state.searchTerm"
          type="search"
          inputmode="search"
          enterkeyhint="search"
          autocomplete="off"
          autocapitalize="none"
          placeholder="Nom, ville ou canton"
        />
        <button v-if="state.searchTerm" type="button" class="m-inst-search__clear" aria-label="Effacer la recherche" @click="state.searchTerm = ''">
          <MIcon name="x" />
        </button>
      </form>
      <button
        type="button"
        class="m-inst-search__filters"
        :class="{ 'is-active': filterCount > 0 }"
        :aria-label="filterCount ? `Filtres (${filterCount} actifs)` : 'Filtres'"
        @click="shell.open('filtres')"
      >
        <MIcon name="settings" />
        <span v-if="filterCount" class="m-inst-search__badge" aria-hidden="true">{{ filterCount }}</span>
      </button>
    </div>

    <div v-if="chips.length" class="m-inst-chips" role="group" aria-label="Filtres actifs">
      <button
        v-for="chip in chips"
        :key="`${chip.group}:${chip.value}`"
        type="button"
        class="m-inst-chip"
        :aria-label="`Retirer le filtre ${chip.label}`"
        @click="state.toggle(chip.group, chip.value)"
      >
        {{ chip.label }}
        <MIcon name="x" />
      </button>
      <button type="button" class="m-inst-chip m-inst-chip--clear" @click="state.clearFilters()">Tout effacer</button>
    </div>

    <div v-if="loading && !institutions.length" class="m-inst-list" role="status" aria-label="Chargement des institutions">
      <div v-for="n in 3" :key="n" class="m-inst-skeleton" aria-hidden="true">
        <span class="m-skeleton m-inst-skeleton__photo"></span>
        <span class="m-skeleton" style="width: 70%"></span>
        <span class="m-skeleton" style="width: 40%"></span>
      </div>
    </div>

    <div v-else-if="failed && !institutions.length" class="m-state" role="alert">
      <span class="m-state__icon" aria-hidden="true"><MIcon name="alert" /></span>
      <p class="m-state__title">Les institutions ne se chargent pas</p>
      <p class="m-state__text">Vérifie ta connexion, puis réessaie.</p>
      <button type="button" class="m-ghost-button" @click="load(true)">Réessayer</button>
    </div>

    <template v-else>
      <p class="m-inst-count" role="status" aria-live="polite">{{ countLabel }}</p>

      <div v-if="!results.length" class="m-state">
        <span class="m-state__icon" aria-hidden="true"><MIcon name="search" /></span>
        <p class="m-state__title">Aucune institution trouvée</p>
        <p class="m-state__text">Essaie un autre mot ou retire des filtres.</p>
        <button type="button" class="m-ghost-button" @click="state.clearAll()">Tout afficher</button>
      </div>

      <div v-else class="m-inst-list">
        <InstitutionCard
          v-for="institution in results"
          :key="institution.InstitutionId || institution.id"
          :institution="institution"
          :offer="offers.get(String(institution.InstitutionId ?? institution.id))"
          @open="openInstitution"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import MIcon from '@/mobile/ui/MIcon.vue'
import InstitutionCard from '@/mobile/institutions/InstitutionCard.vue'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePlacesStore } from '@/stores/placesStore'
import { filterInstitutions } from '@/service/institutionFiltersService'
import { useMobileShell } from '@/mobile/shell/useMobileShell'
import { useMobileShellStore } from '@/mobile/shell/mobileShellStore'
import { useKeptScroll } from '@/mobile/shell/useKeptScroll'
import { useMobileInstitutionsStore } from '@/mobile/institutions/mobileInstitutionsStore'
import { activeFilterChips, countActiveFilters, indexOffers } from '@/mobile/institutions/institutionHelpers'

const props = defineProps({ active: { type: Boolean, default: true } })

const router = useRouter()
const shell = useMobileShell()
const state = useMobileInstitutionsStore()
const institutionsStore = useInstitutionsStore()
const placesStore = usePlacesStore()
const { scrollTopSignal } = storeToRefs(useMobileShellStore())

const scrollerRef = ref(null)
const inputRef = ref(null)
const kept = useKeptScroll(scrollerRef, () => props.active)
const loading = ref(false)
const failed = ref(false)

const institutions = computed(() => institutionsStore.institutions || [])
const places = computed(() => placesStore.places || [])
const offers = computed(() => indexOffers(places.value))
const results = computed(() => filterInstitutions({
  institutions: institutions.value,
  places: places.value,
  filters: state.filters,
  searchTerm: state.searchTerm,
}).slice().sort((a, b) => String(a.Name || '').localeCompare(String(b.Name || ''), 'fr-CH')))
const filterCount = computed(() => countActiveFilters(state.filters))
const chips = computed(() => activeFilterChips(state.filters))
const countLabel = computed(() => {
  const count = results.value.length
  return `${count} institution${count > 1 ? 's' : ''}`
})

async function load(force = false) {
  loading.value = true
  failed.value = false
  try {
    await Promise.all([
      institutionsStore.fetchInstitutions({ force }),
      // Les places servent aux filtres et aux pastilles : leur absence ne bloque pas la liste.
      Promise.resolve(placesStore.fetchPlaces()).catch((error) => console.warn('[Institutions] Places indisponibles:', error)),
    ])
  } catch (error) {
    console.error('[Institutions] Chargement impossible:', error)
    failed.value = true
  } finally {
    loading.value = false
  }
}

function openInstitution(institution) {
  const id = institution.InstitutionId ?? institution.id
  if (id != null) router.push({ name: 'InstitutionView', params: { id } })
}

// Une nouvelle recherche ou un nouveau filtre repart du haut de la liste.
watch(() => [state.searchTerm, state.filters], () => kept.scrollToTop(false))
watch(scrollTopSignal, () => {
  if (props.active) kept.scrollToTop()
})

onMounted(() => load())
</script>

<style scoped>
.m-inst-search {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  gap: 8px;
  margin: 0 -16px;
  padding: 4px 16px 8px;
  background: var(--m-bg);
}
.m-inst-search__field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 48px;
  padding: 0 4px 0 14px;
  border-radius: 14px;
  background: var(--m-surface);
  color: var(--m-muted);
}
.m-inst-search__field:focus-within {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 1px;
}
.m-inst-search__field input {
  flex: 1;
  min-width: 0;
  height: 46px;
  margin: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: none;
  color: var(--m-fg);
  font: inherit;
  font-size: 16px;
  -webkit-appearance: none;
  appearance: none;
}
.m-inst-search__field input::placeholder {
  color: var(--m-muted);
}
.m-inst-search__field input::-webkit-search-cancel-button {
  display: none;
}
.m-inst-search__clear {
  display: grid;
  place-items: center;
  width: 40px;
  height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--m-muted);
  cursor: pointer;
}
.m-inst-search__clear :deep(.m-icon) {
  width: 18px;
  height: 18px;
}
.m-inst-search__filters {
  position: relative;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 0;
  border-radius: 14px;
  background: var(--m-surface);
  color: var(--m-fg);
  cursor: pointer;
  touch-action: manipulation;
}
.m-inst-search__filters.is-active {
  background: var(--m-accent);
  color: var(--m-on-accent);
}
.m-inst-search__filters:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-inst-search__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border: 2px solid var(--m-bg);
  border-radius: 99px;
  background: var(--m-fg);
  color: var(--m-bg);
  font-size: 0.6875rem;
  font-weight: 700;
}
.m-inst-chips {
  display: flex;
  gap: 8px;
  margin: 0 -16px 4px;
  padding: 4px 16px;
  overflow-x: auto;
  scrollbar-width: none;
}
.m-inst-chips::-webkit-scrollbar {
  display: none;
}
.m-inst-chip {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 10px 0 14px;
  border: 1px solid var(--m-accent);
  border-radius: 99px;
  background: rgba(243, 195, 0, 0.12);
  color: var(--m-fg);
  font: inherit;
  font-size: 0.8125rem;
  white-space: nowrap;
  cursor: pointer;
}
.m-inst-chip::after {
  content: '';
  position: absolute;
  inset: -4px 0;
}
.m-inst-chip :deep(.m-icon) {
  width: 14px;
  height: 14px;
}
.m-inst-chip--clear {
  padding: 0 14px;
  border-color: var(--m-line);
  background: none;
  color: var(--m-muted);
}
.m-inst-count {
  margin: 4px 0 10px;
  color: var(--m-muted);
  font-size: 0.8125rem;
}
.m-inst-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.m-inst-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 14px;
  overflow: hidden;
  border-radius: 18px;
  background: var(--m-surface);
}
.m-inst-skeleton .m-skeleton {
  display: block;
  height: 12px;
  margin: 0 14px;
  border-radius: 6px;
}
.m-inst-skeleton__photo.m-skeleton {
  height: 136px;
  margin: 0;
  border-radius: 0;
}
</style>
