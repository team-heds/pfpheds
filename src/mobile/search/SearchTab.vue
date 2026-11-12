<template>
  <section ref="scrollerRef" class="m-search" aria-label="Recherche">
    <div class="m-search__bar">
      <form class="m-search__field" role="search" @submit.prevent="inputRef?.blur()">
        <MIcon v-if="!loading" name="search" />
        <span v-else class="m-spinner" aria-hidden="true"></span>
        <label for="m-search-input" class="m-sr-only">Rechercher une personne, une institution, une page ou un module</label>
        <input
          id="m-search-input"
          ref="inputRef"
          v-model="query"
          type="search"
          inputmode="search"
          enterkeyhint="search"
          autocomplete="off"
          autocapitalize="none"
          placeholder="Personnes, institutions, pages"
        />
        <button v-if="query" type="button" class="m-search__clear" aria-label="Effacer la recherche" @click="clearQuery">
          <MIcon name="x" />
        </button>
      </form>
    </div>

    <p class="m-sr-only" role="status" aria-live="polite">{{ statusMessage }}</p>

    <!-- Résultats -->
    <template v-if="trimmed">
      <p v-if="trimmed.length < MIN_LENGTH" class="m-search__hint">Saisis au moins {{ MIN_LENGTH }} caractères.</p>
      <template v-else>
        <section v-for="group in groups" :key="group.key" class="m-search__group" :aria-labelledby="`m-search-${group.key}`">
          <h2 :id="`m-search-${group.key}`" class="m-search__heading">{{ group.title }}</h2>
          <ul class="m-search__results">
            <li v-for="item in group.items" :key="item.key">
              <button type="button" class="m-search__result" @click="openResult(item)">
                <span class="m-search__thumb" aria-hidden="true">
                  <img v-if="item.image" :src="item.image" alt="" loading="lazy" />
                  <MIcon v-else :name="item.icon" />
                </span>
                <span class="m-search__copy">
                  <span>{{ item.label }}</span>
                  <small v-if="item.detail">{{ item.detail }}</small>
                </span>
                <MIcon name="next" />
              </button>
            </li>
          </ul>
        </section>
        <div v-if="searched && !loading && !groups.length" class="m-state">
          <span class="m-state__icon" aria-hidden="true"><MIcon name="search" /></span>
          <p class="m-state__title">Aucun résultat</p>
          <p class="m-state__text">Rien ne correspond à « {{ trimmed }} ». Essaie un autre mot.</p>
        </div>
      </template>
    </template>

    <!-- Accueil de l'onglet : accès rapide, classement, autres accès -->
    <template v-else>
      <section aria-labelledby="m-search-quick">
        <h2 id="m-search-quick" class="m-search__heading">Accès rapide</h2>
        <div class="m-search__tiles">
          <button v-for="tile in tiles" :key="tile.key" type="button" class="m-tile" @click="openTile(tile)">
            <span class="m-tile__icon" aria-hidden="true"><MIcon :name="tile.icon" /></span>
            <span class="m-tile__label">{{ tile.label }}</span>
            <span class="m-tile__detail">{{ tile.detail }}</span>
          </button>
        </div>
      </section>

      <section v-if="rankingEnabled" aria-labelledby="m-search-ranking">
        <h2 id="m-search-ranking" class="m-search__heading">Classement des maisons</h2>
        <component
          :is="rankingRoute ? 'button' : 'div'"
          :type="rankingRoute ? 'button' : undefined"
          class="m-ranking"
          :aria-label="rankingRoute ? 'Classement des maisons : ouvrir le détail' : undefined"
          @click="rankingRoute && router.push(rankingRoute)"
        >
          <template v-if="ranking.length">
            <span v-for="house in ranking" :key="house.key" class="m-ranking__row">
              <span class="m-ranking__line">
                <span class="m-ranking__name">{{ house.rank }}. {{ house.name }}</span>
                <span class="m-ranking__xp">{{ formatXp(house.xp) }}</span>
              </span>
              <span class="m-ranking__track" aria-hidden="true">
                <span class="m-ranking__fill" :style="{ width: `${house.percent}%`, background: house.color }"></span>
              </span>
            </span>
          </template>
          <span v-else-if="rankingFailed" class="m-ranking__empty">Classement indisponible pour le moment.</span>
          <template v-else>
            <span v-for="n in 4" :key="n" class="m-ranking__row" aria-hidden="true">
              <span class="m-skeleton m-ranking__skeleton"></span>
            </span>
          </template>
        </component>
      </section>

      <section v-if="others.length" aria-labelledby="m-search-others">
        <h2 id="m-search-others" class="m-search__heading">Plus</h2>
        <div class="m-search__others">
          <button v-for="item in others" :key="item.key" type="button" class="m-row-link" @click="router.push(item.to)">
            <span class="m-row-link__icon" aria-hidden="true"><i :class="item.icon"></i></span>
            <span class="m-row-link__text">
              <span>{{ item.label }}</span>
              <small>{{ item.description }}</small>
            </span>
            <MIcon name="next" />
          </button>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import MIcon from '@/mobile/ui/MIcon.vue'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { useNavigationDestinations } from '@/composables/useNavigationDestinations'
import { searchAccessibleProfiles, searchModules } from '@/service/globalSearchService'
import { gamificationFeatures } from '@/config/gamificationFeatures'
import { institutionImageOf, INSTITUTION_PLACEHOLDER } from '@/utils/institutionImage'
import { useMobileShellStore } from '@/mobile/shell/mobileShellStore'
import { useKeptScroll } from '@/mobile/shell/useKeptScroll'
import { useMobileInstitutionsStore } from '@/mobile/institutions/mobileInstitutionsStore'
import {
  buildQuickTiles,
  fetchHouseRanking,
  formatXp,
  matchEntries,
  matchInstitutions,
  otherDestinations,
} from '@/mobile/search/searchHelpers'

const MIN_LENGTH = 2

const props = defineProps({
  /** L'onglet reste en mémoire quand on en change : vrai quand il est affiché. */
  active: { type: Boolean, default: true },
})

const router = useRouter()
const institutionsStore = useInstitutionsStore()
const institutionsView = useMobileInstitutionsStore()
const { destinations } = useNavigationDestinations()
const { scrollTopSignal } = storeToRefs(useMobileShellStore())

const scrollerRef = ref(null)
const inputRef = ref(null)
const kept = useKeptScroll(scrollerRef, () => props.active)

const hasPath = (path) => {
  const resolved = router.resolve(path)
  return Boolean(resolved.matched?.length) && resolved.name !== 'Error404'
}
const tiles = computed(() => buildQuickTiles({ features: gamificationFeatures, hasPath }))
const others = computed(() => otherDestinations(destinations.value))

function openTile(tile) {
  if (tile.action === 'documents') {
    // Les documents vivent dans l'onglet Institutions : on l'ouvre sur la bonne vue.
    institutionsView.view = 'documents'
    router.push('/institution')
    return
  }
  router.push(tile.to)
}

// --- Classement des maisons --------------------------------------------------
const rankingEnabled = gamificationFeatures.userJourney
const rankingRoute = hasPath('/houses/ranking') ? '/houses/ranking' : null
const ranking = ref([])
const rankingFailed = ref(false)
let rankingLoadedAt = 0
async function loadRanking() {
  if (!rankingEnabled) return
  try {
    ranking.value = await fetchHouseRanking()
    rankingFailed.value = false
    rankingLoadedAt = Date.now()
  } catch (error) {
    console.warn('[Recherche] Classement indisponible:', error)
    rankingFailed.value = !ranking.value.length
  }
}

// --- Recherche ---------------------------------------------------------------
const query = ref('')
const loading = ref(false)
const searched = ref(false)
const people = ref([])
const modules = ref([])
let debounce = null
let requestId = 0

const trimmed = computed(() => query.value.trim())
const pageResults = computed(() => {
  const entries = [
    ...tiles.value.map((tile) => ({ key: `tile:${tile.key}`, label: tile.label, detail: tile.detail, icon: tile.icon, tile })),
    ...destinations.value.map((item) => ({ key: `page:${item.key}`, label: item.label, detail: item.description, icon: 'next', to: item.to })),
  ]
  const seen = new Set()
  return matchEntries(entries, trimmed.value).filter((entry) => {
    const id = entry.label
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
})
const institutionResults = computed(() => matchInstitutions(institutionsStore.institutions || [], trimmed.value).map((institution) => {
  const image = institutionImageOf(institution)
  return {
    key: `institution:${institution.InstitutionId ?? institution.id}`,
    label: institution.Name,
    detail: [institution.Locality, institution.Canton].filter(Boolean).join(', '),
    icon: 'building',
    image: image === INSTITUTION_PLACEHOLDER ? null : image,
    to: { name: 'InstitutionView', params: { id: institution.InstitutionId ?? institution.id } },
  }
}))
const groups = computed(() => [
  { key: 'people', title: 'Personnes', items: people.value },
  { key: 'institutions', title: 'Institutions', items: institutionResults.value },
  { key: 'pages', title: 'Pages', items: pageResults.value },
  { key: 'modules', title: 'Modules', items: modules.value },
].filter((group) => group.items.length))

const statusMessage = computed(() => {
  if (!trimmed.value || trimmed.value.length < MIN_LENGTH) return ''
  if (loading.value) return 'Recherche en cours…'
  const total = groups.value.reduce((sum, group) => sum + group.items.length, 0)
  return total ? `${total} résultat${total > 1 ? 's' : ''}` : `Aucun résultat pour ${trimmed.value}`
})

async function runSearch() {
  clearTimeout(debounce)
  const text = trimmed.value
  const current = ++requestId
  if (text.length < MIN_LENGTH) {
    people.value = []
    modules.value = []
    loading.value = false
    searched.value = false
    return
  }
  loading.value = true
  // Les institutions sont cherchées sur la liste déjà connue : on la charge au besoin.
  void Promise.resolve(institutionsStore.fetchInstitutions()).catch(() => null)
  const [foundPeople, foundModules] = await Promise.all([
    searchAccessibleProfiles(text).catch(() => []),
    searchModules(text).catch(() => []),
  ])
  // Une réponse plus ancienne ne doit pas remplacer la recherche en cours.
  if (current !== requestId) return
  people.value = foundPeople.map((item) => ({ key: `person:${item.id}`, label: item.name, detail: item.role, icon: 'user', image: item.avatarUrl || null, to: item.route }))
  modules.value = foundModules.map((item) => ({ key: `module:${item.id}`, label: item.name, detail: item.description, icon: 'file', to: item.route }))
  loading.value = false
  searched.value = true
}

function openResult(item) {
  if (item.tile) openTile(item.tile)
  else if (item.to) router.push(item.to)
}

function clearQuery() {
  query.value = ''
  inputRef.value?.focus()
}

watch(query, () => {
  clearTimeout(debounce)
  kept.scrollToTop(false)
  debounce = setTimeout(runSearch, 300)
})
watch(scrollTopSignal, () => {
  if (props.active) kept.scrollToTop()
})
// Le classement bouge dans la journée : on le rafraîchit au retour sur l'onglet.
watch(() => props.active, (active) => {
  if (active && Date.now() - rankingLoadedAt > 60 * 1000) void loadRanking()
})

onMounted(loadRanking)
onBeforeUnmount(() => clearTimeout(debounce))
</script>

<style scoped>
.m-search {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 16px 24px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  background: var(--m-bg);
}
.m-search::-webkit-scrollbar {
  display: none;
}
.m-search > * {
  flex-shrink: 0;
}
.m-search__bar {
  position: sticky;
  top: 0;
  z-index: 3;
  margin: 0 -16px;
  padding: 4px 16px 6px;
  background: var(--m-bg);
}
.m-search__field {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 4px 0 14px;
  border-radius: 14px;
  background: var(--m-surface);
  color: var(--m-muted);
}
.m-search__field:focus-within {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 1px;
}
.m-search__field input {
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
.m-search__field input::placeholder {
  color: var(--m-muted);
}
.m-search__field input::-webkit-search-cancel-button {
  display: none;
}
.m-search__clear {
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
.m-search__clear :deep(.m-icon) {
  width: 18px;
  height: 18px;
}
.m-search__heading {
  margin: 0 0 8px;
  color: var(--m-muted);
  font-size: 0.8125rem;
  font-weight: 600;
}
.m-search__hint {
  margin: 0;
  color: var(--m-muted);
  font-size: 0.875rem;
}
.m-search__tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.m-tile {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 112px;
  padding: 14px;
  border: 0;
  border-radius: 18px;
  background: var(--m-surface);
  color: var(--m-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  transition: transform 120ms ease;
}
.m-tile:active {
  background: var(--m-raised);
  transform: scale(0.98);
}
.m-tile:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-tile__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-bottom: 4px;
  border-radius: 12px;
  background: var(--m-raised);
  color: var(--m-accent-text);
}
.m-tile__label {
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.25;
}
.m-tile__detail {
  color: var(--m-muted);
  font-size: 0.75rem;
  line-height: 1.35;
}
.m-ranking {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border: 0;
  border-radius: 18px;
  background: var(--m-surface);
  color: var(--m-fg);
  font: inherit;
  text-align: left;
}
button.m-ranking {
  cursor: pointer;
  touch-action: manipulation;
}
button.m-ranking:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-ranking__row {
  display: block;
}
.m-ranking__line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.m-ranking__name {
  font-size: 0.9375rem;
  font-weight: 500;
}
.m-ranking__xp {
  color: var(--m-muted);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}
.m-ranking__track {
  display: block;
  height: 6px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 3px;
  background: var(--m-raised);
}
.m-ranking__fill {
  display: block;
  height: 100%;
  border-radius: 3px;
}
.m-ranking__skeleton {
  display: block;
  height: 28px;
  border-radius: 8px;
}
.m-ranking__empty {
  color: var(--m-muted);
  font-size: 0.875rem;
}
.m-search__others {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.m-search__others .m-row-link__icon i {
  font-size: 1.1rem;
}
.m-search__results {
  margin: 0;
  padding: 0 12px;
  border-radius: 18px;
  background: var(--m-surface);
  list-style: none;
}
.m-search__results li + li {
  border-top: 1px solid var(--m-line);
}
.m-search__result {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 60px;
  padding: 8px 0;
  border: 0;
  background: none;
  color: var(--m-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
}
.m-search__result:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
  border-radius: 8px;
}
.m-search__result > :deep(.m-icon:last-child) {
  width: 18px;
  height: 18px;
  color: var(--m-muted);
}
.m-search__thumb {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 12px;
  background: var(--m-raised);
  color: var(--m-accent-text);
}
.m-search__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.m-search__copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.35;
}
.m-search__copy small {
  overflow: hidden;
  color: var(--m-muted);
  font-size: 0.8125rem;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
  .m-tile {
    transition: none;
  }
}
</style>
