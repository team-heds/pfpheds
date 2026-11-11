<template>
  <div class="mobile-search">
    <Navbar />

    <main class="mobile-search__content" aria-labelledby="mobile-search-title">
      <h1 id="mobile-search-title" tabindex="-1">Recherche</h1>

      <form class="mobile-search__form" role="search" @submit.prevent="runSearch">
        <label class="mobile-search__label" for="mobile-search-input">Rechercher une page, une personne ou un module</label>
        <div class="mobile-search__field">
          <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-search'" aria-hidden="true"></i>
          <input
            id="mobile-search-input"
            ref="inputRef"
            v-model="query"
            type="search"
            inputmode="search"
            enterkeyhint="search"
            autocomplete="off"
            autocapitalize="none"
            placeholder="Page, personne, module…"
          />
          <button v-if="query" type="button" class="mobile-search__clear" aria-label="Effacer la recherche" @click="clearQuery">
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>
      </form>

      <p class="mobile-search__status" role="status" aria-live="polite">{{ statusMessage }}</p>

      <section v-for="group in groups" :key="group.key" class="mobile-search__group" :aria-labelledby="`mobile-search-${group.key}`">
        <h2 :id="`mobile-search-${group.key}`">{{ group.title }}</h2>
        <ul>
          <li v-for="item in group.items" :key="`${group.key}-${item.key}`">
            <RouterLink :to="item.to" class="mobile-search__result">
              <span class="mobile-search__icon">
                <img v-if="item.avatarUrl" :src="item.avatarUrl" alt="" loading="lazy" />
                <i v-else :class="item.icon" aria-hidden="true"></i>
              </span>
              <span class="mobile-search__copy">
                <span class="mobile-search__name">{{ item.label }}</span>
                <span v-if="item.detail" class="mobile-search__detail">{{ item.detail }}</span>
              </span>
              <i class="pi pi-angle-right mobile-search__arrow" aria-hidden="true"></i>
            </RouterLink>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/common/utils/Navbar.vue'
import { useNavigationDestinations } from '@/composables/useNavigationDestinations'
import { searchAccessibleProfiles, searchModules } from '@/service/globalSearchService'

const MIN_LENGTH = 2
const { destinations } = useNavigationDestinations()

const inputRef = ref(null)
const query = ref('')
const loading = ref(false)
const searched = ref(false)
const people = ref([])
const modules = ref([])
let debounceTimer = null
let requestId = 0

const normalize = value => String(value || '').toLocaleLowerCase('fr-CH').normalize('NFD').replace(/[̀-ͯ]/g, '')
const trimmedQuery = computed(() => query.value.trim())

// Sans saisie, la page propose directement les accès de l'étudiant.
const pageResults = computed(() => {
  const needle = normalize(trimmedQuery.value)
  return destinations.value
    .filter(item => !needle || normalize(`${item.label} ${item.description}`).includes(needle))
    .map(item => ({ key: item.key, to: item.to, label: item.label, detail: item.description, icon: item.icon }))
})

const groups = computed(() => [
  { key: 'pages', title: trimmedQuery.value ? 'Pages' : 'Accès rapides', items: pageResults.value },
  { key: 'people', title: 'Personnes', items: people.value },
  { key: 'modules', title: 'Modules', items: modules.value },
].filter(group => group.items.length > 0))

const statusMessage = computed(() => {
  if (!trimmedQuery.value) return ''
  if (trimmedQuery.value.length < MIN_LENGTH) return `Saisissez au moins ${MIN_LENGTH} caractères.`
  if (loading.value) return 'Recherche en cours…'
  if (searched.value && groups.value.length === 0) return `Aucun résultat pour « ${trimmedQuery.value} ».`
  return ''
})

async function runSearch() {
  clearTimeout(debounceTimer)
  const text = trimmedQuery.value
  const currentRequest = ++requestId
  if (text.length < MIN_LENGTH) {
    people.value = []
    modules.value = []
    loading.value = false
    searched.value = false
    return
  }

  loading.value = true
  const [foundPeople, foundModules] = await Promise.all([
    searchAccessibleProfiles(text).catch(() => []),
    searchModules(text).catch(() => []),
  ])
  // Une réponse plus ancienne ne doit pas remplacer la recherche en cours.
  if (currentRequest !== requestId) return

  people.value = foundPeople.map(item => ({
    key: item.id, to: item.route, label: item.name, detail: item.role, icon: 'pi pi-user', avatarUrl: item.avatarUrl,
  }))
  modules.value = foundModules.map(item => ({
    key: item.id, to: item.route, label: item.name, detail: item.description, icon: 'pi pi-video',
  }))
  loading.value = false
  searched.value = true
}

function clearQuery() {
  query.value = ''
  inputRef.value?.focus()
}

watch(query, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(runSearch, 300)
})

onMounted(() => inputRef.value?.focus({ preventScroll: true }))
onBeforeUnmount(() => clearTimeout(debounceTimer))
</script>

<style scoped>
.mobile-search { min-height: 100%; }
.mobile-search__content { width: min(100%, 44rem); margin-inline: auto; padding: .5rem clamp(0rem, 2vw, 1.5rem) 2rem; }
.mobile-search__content h1 { margin: .25rem 0 1rem; font-size: 1.75rem; line-height: 1.2; letter-spacing: -.02em; }
.mobile-search__label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.mobile-search__form { position: sticky; top: 0; z-index: 2; padding-block: .25rem .5rem; background: var(--surface-ground); }
.mobile-search__field { position: relative; display: flex; align-items: center; gap: .65rem; min-height: 3.25rem; padding-inline: 1rem .35rem; border: 1px solid var(--surface-border); border-radius: 1rem; background: var(--surface-card); color: var(--text-color-secondary); }
.mobile-search__field:focus-within { border-color: var(--primary-color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 22%, transparent); }
.mobile-search__field input { flex: 1 1 auto; min-width: 0; height: 3rem; border: 0; outline: none; background: transparent; color: var(--text-color); font-size: 1rem; }
.mobile-search__field input::-webkit-search-cancel-button { display: none; }
.mobile-search__clear { display: inline-flex; flex: 0 0 44px; align-items: center; justify-content: center; width: 44px; height: 44px; border: 0; border-radius: 50%; background: transparent; color: var(--text-color-secondary); cursor: pointer; }
.mobile-search__clear:active { background: var(--surface-hover); }
.mobile-search__status { min-height: 1.5rem; margin: .5rem .25rem; color: var(--text-color-secondary); font-size: .9rem; }
.mobile-search__group + .mobile-search__group { margin-top: 1.5rem; }
.mobile-search__group h2 { margin: 0 .25rem .5rem; color: var(--text-color-secondary); font-size: .8rem; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
.mobile-search__group ul { margin: 0; padding: 0; list-style: none; border: 1px solid var(--surface-border); border-radius: 1rem; background: var(--surface-card); overflow: hidden; }
.mobile-search__group li + li { border-top: 1px solid var(--surface-border); }
.mobile-search__result { display: flex; align-items: center; gap: .85rem; min-height: 4rem; padding: .65rem .9rem; color: var(--text-color); -webkit-tap-highlight-color: transparent; }
.mobile-search__result:active { background: var(--surface-hover); }
.mobile-search__result:focus-visible { outline: 3px solid var(--primary-color); outline-offset: -3px; }
.mobile-search__icon { display: inline-flex; flex: 0 0 2.5rem; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; overflow: hidden; border-radius: .75rem; color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 12%, var(--surface-card)); }
.mobile-search__icon img { width: 100%; height: 100%; object-fit: cover; }
.mobile-search__copy { display: flex; flex: 1 1 auto; flex-direction: column; gap: .15rem; min-width: 0; }
.mobile-search__name { font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
.mobile-search__detail { display: -webkit-box; overflow: hidden; color: var(--text-color-secondary); font-size: .85rem; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }
.mobile-search__arrow { flex: 0 0 auto; color: var(--text-color-secondary); }
@media (hover: hover) {
  .mobile-search__result:hover, .mobile-search__clear:hover { background: var(--surface-hover); }
}
@media (forced-colors: active) {
  .mobile-search__result:focus-visible { outline-color: Highlight; }
}
</style>
