<template>
  <section class="m-map" aria-labelledby="m-map-title">
    <h1 id="m-map-title" class="m-sr-only">Carte des institutions</h1>
    <div ref="canvasRef" class="m-map__canvas" :class="{ 'm-map__canvas--dark': !lightTiles }"></div>

    <!-- Barre flottante : recherche, filtres rapides -->
    <div class="m-map__top">
      <div class="m-map__searchbar">
        <form class="m-map__search" role="search" @submit.prevent="pickFirst">
          <MIcon name="search" />
          <label for="m-map-search" class="m-sr-only">Rechercher une institution sur la carte</label>
          <input
            id="m-map-search"
            ref="inputRef"
            v-model="term"
            type="search"
            inputmode="search"
            enterkeyhint="search"
            autocomplete="off"
            autocapitalize="none"
            :placeholder="searchPlaceholder"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="m-map-suggestions"
            :aria-expanded="suggestions.length ? 'true' : 'false'"
            @focus="searching = true"
            @blur="onSearchBlur"
          />
          <button v-if="term" type="button" class="m-map__clear" aria-label="Effacer la recherche" @click="clearSearch">
            <MIcon name="x" />
          </button>
        </form>
        <button
          type="button"
          class="m-map__round"
          :class="{ 'is-active': filterCount > 0 }"
          :aria-label="filterCount ? `Filtres (${filterCount} actifs)` : 'Filtres'"
          @click="shell.open('filtres')"
        >
          <MIcon name="settings" />
          <span v-if="filterCount" class="m-map__badge" aria-hidden="true">{{ filterCount }}</span>
        </button>
      </div>

      <ul v-if="searching && term.trim().length >= 2" id="m-map-suggestions" class="m-map__suggestions" role="listbox" aria-label="Institutions trouvées">
        <li v-for="item in suggestions" :key="item.key" role="option" aria-selected="false">
          <button type="button" @pointerdown.prevent @click="select(item, { fly: true })">
            <MIcon name="pin" />
            <span>
              <strong>{{ item.institution.Name }}</strong>
              <small>{{ [item.institution.Locality, item.institution.Canton].filter(Boolean).join(', ') }}</small>
            </span>
          </button>
        </li>
        <li v-if="!suggestions.length" class="m-map__nothing">Aucune institution sur la carte ne correspond.</li>
      </ul>

      <div v-else class="m-map__chips" role="group" aria-label="Filtrer par stage">
        <button
          v-for="pfp in PFP_TYPES"
          :key="pfp"
          type="button"
          class="m-map__chip"
          :aria-pressed="filters.filters.pfp.includes(pfp) ? 'true' : 'false'"
          @click="filters.toggle('pfp', pfp)"
        >{{ pfp }}</button>
        <button v-if="filterCount" type="button" class="m-map__chip m-map__chip--reset" @click="filters.clearFilters()">Tout afficher</button>
      </div>
    </div>

    <p class="m-sr-only" role="status" aria-live="polite">{{ statusLabel }}</p>
    <p v-if="loadFailed" class="m-map__notice" role="alert">
      Les institutions ne se chargent pas.
      <button type="button" @click="load(true)">Réessayer</button>
    </p>
    <p v-else-if="ready && !items.length" class="m-map__notice" role="status">
      Aucune institution ne correspond à ces filtres.
      <button type="button" @click="filters.clearFilters()">Tout afficher</button>
    </p>

    <!-- Boutons flottants : ma position, vue d'ensemble -->
    <div class="m-map__side" :class="{ 'is-raised': selected }">
      <button type="button" class="m-map__round" aria-label="Voir toutes les institutions" @click="fitAll(true)">
        <MIcon name="grid" />
      </button>
      <button type="button" class="m-map__round" :class="{ 'is-active': position }" :aria-label="locating ? 'Recherche de ta position…' : 'Me situer sur la carte'" :disabled="locating" @click="locate">
        <span v-if="locating" class="m-spinner" aria-hidden="true"></span>
        <MIcon v-else name="nav" />
      </button>
    </div>

    <!-- Fiche qui monte du bas quand on touche un repère -->
    <Transition name="m-map-card">
      <article
        v-if="selected"
        :key="selected.key"
        class="m-map__card"
        aria-label="Institution sélectionnée"
        :style="dragStyle"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
      >
        <span class="m-map__grab" aria-hidden="true"></span>
        <div class="m-map__card-head">
          <img :src="imageOf(selected.institution)" alt="" class="m-map__thumb" @error="showInstitutionPlaceholder" />
          <div class="m-map__card-text">
            <h2 class="m-map__name">{{ selected.institution.Name }}</h2>
            <p class="m-map__place">{{ placeLine(selected) }}</p>
          </div>
          <button type="button" class="m-icon-button" aria-label="Fermer la fiche" @click="selectedKey = null">
            <MIcon name="x" />
          </button>
        </div>
        <div v-if="tagsOf(selected).length" class="m-map__tags">
          <span v-for="tag in tagsOf(selected)" :key="tag">{{ tag }}</span>
        </div>
        <div class="m-map__actions">
          <button type="button" class="m-cta" @click="openInstitution(selected)">Voir la fiche</button>
          <a :href="directionsUrl(selected.institution)" target="_blank" rel="noopener noreferrer" class="m-ghost-button">
            <MIcon name="nav" />
            Itinéraire
          </a>
        </div>
      </article>
    </Transition>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import MIcon from '@/mobile/ui/MIcon.vue'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePlacesStore } from '@/stores/placesStore'
import { INSTITUTION_PFP_TYPES, filterInstitutions } from '@/service/institutionFiltersService'
import { institutionImageOf, showInstitutionPlaceholder } from '@/utils/institutionImage'
import { useMobileShell } from '@/mobile/shell/useMobileShell'
import { useMobileInstitutionsStore } from '@/mobile/institutions/mobileInstitutionsStore'
import { countActiveFilters, directionsUrl, indexOffers, languageLabel } from '@/mobile/institutions/institutionHelpers'
import { useMobileMapStore } from '@/mobile/map/mobileMapStore'
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  boundsFor,
  distanceKm,
  formatDistance,
  mappableInstitutions,
  searchOnMap,
} from '@/mobile/map/mapHelpers'

const PFP_TYPES = INSTITUTION_PFP_TYPES
const DISMISS_DISTANCE = 70

const props = defineProps({
  /** L'onglet reste en mémoire quand on en change : vrai quand il est affiché. */
  active: { type: Boolean, default: true },
})

const router = useRouter()
const shell = useMobileShell()
const toast = useToast()
const institutionsStore = useInstitutionsStore()
const placesStore = usePlacesStore()
// Les filtres sont les mêmes que dans l'onglet Institutions : on retrouve sa sélection.
const filters = useMobileInstitutionsStore()
const mapStore = useMobileMapStore()

const canvasRef = ref(null)
const inputRef = ref(null)
const ready = ref(false)
const loadFailed = ref(false)
const term = ref('')
const searching = ref(false)
const selectedKey = ref(null)
const position = ref(null)
const locating = ref(false)
const lightTiles = ref(false)

let map = null
let markerLayer = null
let positionMarker = null
const markers = new Map()

const offers = computed(() => indexOffers(placesStore.places || []))
const items = computed(() => mappableInstitutions(filterInstitutions({
  institutions: institutionsStore.institutions || [],
  places: placesStore.places || [],
  filters: filters.filters,
  searchTerm: '',
})))
const allItems = computed(() => mappableInstitutions((institutionsStore.institutions || []).filter((item) => item?.is_hidden !== true)))
const selected = computed(() => allItems.value.find((item) => item.key === selectedKey.value) || null)
const suggestions = computed(() => searchOnMap(allItems.value, term.value))
const filterCount = computed(() => countActiveFilters(filters.filters))
const searchPlaceholder = computed(() => (items.value.length ? `Rechercher parmi ${items.value.length} institutions` : 'Rechercher une institution'))
const statusLabel = computed(() => {
  if (!ready.value) return 'Chargement de la carte…'
  return `${items.value.length} institution${items.value.length > 1 ? 's' : ''} sur la carte`
})

const imageOf = (institution) => institutionImageOf(institution)
const tagsOf = (item) => {
  const offer = offers.value.get(item.key)
  return [...(offer?.pfp || []), ...(offer?.criteria || [])].slice(0, 5)
}
const placeLine = (item) => {
  const parts = [item.institution.Locality, languageLabel(item.institution.Language)]
  if (position.value) parts.push(`à ${formatDistance(distanceKm(position.value, item.latLng))}`)
  return parts.filter(Boolean).join(' · ')
}

// --- Carte -----------------------------------------------------------------
const pinIcon = (isSelected) => L.divIcon({
  className: `m-pin${isSelected ? ' m-pin--selected' : ''}`,
  html: '<span class="m-pin__dot"></span>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
})

function createMap() {
  if (map || !canvasRef.value) return
  map = L.map(canvasRef.value, {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: false,
    attributionControl: true,
    minZoom: 4,
    maxZoom: 18,
    zoomSnap: 0.5,
    tapTolerance: 20,
  })
  map.attributionControl.setPrefix(false)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  // Toucher la carte hors d'un repère referme la fiche et la recherche.
  map.on('click', () => {
    selectedKey.value = null
    inputRef.value?.blur()
  })
}

function drawMarkers() {
  if (!map) return
  markerLayer.clearLayers()
  markers.clear()
  items.value.forEach((item) => {
    const marker = L.marker(item.latLng, {
      icon: pinIcon(item.key === selectedKey.value),
      title: item.institution.Name,
      alt: item.institution.Name,
      keyboard: true,
      riseOnHover: true,
    })
    marker.on('click', (event) => {
      L.DomEvent.stopPropagation(event)
      select(item)
    })
    marker.addTo(markerLayer)
    markers.set(item.key, marker)
  })
  // L'institution sélectionnée reste visible même si un filtre l'écarte.
  if (selected.value && !markers.has(selected.value.key)) {
    const marker = L.marker(selected.value.latLng, { icon: pinIcon(true), title: selected.value.institution.Name, alt: selected.value.institution.Name })
    marker.addTo(markerLayer)
    markers.set(selected.value.key, marker)
  }
}

function fitAll(animate = false) {
  if (!map) return
  const bounds = boundsFor(items.value.map((item) => item.latLng))
  if (bounds) map.fitBounds(bounds, { paddingTopLeft: [28, 150], paddingBottomRight: [28, 40], maxZoom: 13, animate })
  else map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate })
}

function select(item, { fly = false } = {}) {
  selectedKey.value = item.key
  searching.value = false
  term.value = ''
  inputRef.value?.blur()
  if (!map) return
  // Le repère choisi reste visible au-dessus de la fiche du bas.
  const zoom = fly ? Math.max(map.getZoom(), 14) : map.getZoom()
  const point = map.project(item.latLng, zoom).add([0, 110])
  map.flyTo(map.unproject(point, zoom), zoom, { duration: fly ? 0.8 : 0.35 })
}

function pickFirst() {
  if (suggestions.value.length) select(suggestions.value[0], { fly: true })
}

function clearSearch() {
  term.value = ''
  inputRef.value?.focus()
}

function onSearchBlur() {
  // Laisse le temps à l'appui sur une suggestion d'être pris en compte.
  setTimeout(() => {
    searching.value = false
  }, 120)
}

function openInstitution(item) {
  const id = item.institution.InstitutionId ?? item.institution.id
  router.push({ name: 'InstitutionView', params: { id } })
}

// --- Ma position (demandée seulement à l'appui sur le bouton) ---------------
function locate() {
  if (!navigator.geolocation) {
    toast.add({ severity: 'warn', summary: 'Position indisponible', detail: 'Cet appareil ne donne pas sa position.', life: 3500 })
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      locating.value = false
      position.value = [coords.latitude, coords.longitude]
      if (!map) return
      if (!positionMarker) {
        positionMarker = L.marker(position.value, {
          icon: L.divIcon({ className: 'm-me', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] }),
          interactive: false,
          keyboard: false,
        }).addTo(map)
      } else {
        positionMarker.setLatLng(position.value)
      }
      map.flyTo(position.value, Math.max(map.getZoom(), 12), { duration: 0.8 })
    },
    (error) => {
      locating.value = false
      const denied = error?.code === 1
      toast.add({
        severity: 'warn',
        summary: denied ? 'Position non autorisée' : 'Position introuvable',
        detail: denied ? 'Autorise la localisation pour ce site dans les réglages du téléphone.' : 'Réessaie dans un instant, de préférence à l’extérieur.',
        life: 4500,
      })
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  )
}

// --- Fiche du bas : la tirer vers le bas la referme --------------------------
const dragOffset = ref(0)
let dragStartY = null
const dragStyle = computed(() => (dragOffset.value > 0 ? { transform: `translateY(${dragOffset.value}px)`, transition: 'none' } : null))
function onDragStart(event) {
  if (event.target.closest('button, a')) return
  dragStartY = event.clientY
}
function onDragMove(event) {
  if (dragStartY !== null) dragOffset.value = Math.max(0, event.clientY - dragStartY)
}
function onDragEnd() {
  if (dragStartY === null) return
  const close = dragOffset.value > DISMISS_DISTANCE
  dragStartY = null
  dragOffset.value = 0
  if (close) selectedKey.value = null
}

// --- Thème -----------------------------------------------------------------
const detectTheme = () => {
  const light = document.querySelector('link[data-theme-link="heds"][data-theme-scheme="light"]')
  lightTiles.value = Boolean(light && !light.disabled && light.media !== 'not all')
}

// --- Chargement --------------------------------------------------------------
async function load(force = false) {
  loadFailed.value = false
  try {
    await Promise.all([
      institutionsStore.fetchInstitutions({ force }),
      Promise.resolve(placesStore.fetchPlaces()).catch((error) => console.warn('[Carte] Places indisponibles:', error)),
    ])
  } catch (error) {
    console.error('[Carte] Chargement impossible:', error)
    loadFailed.value = true
  }
  ready.value = true
}

function applyFocus() {
  if (!mapStore.focusKey || !map) return
  const item = allItems.value.find((entry) => entry.key === mapStore.focusKey)
  mapStore.focusKey = null
  if (item) {
    drawMarkers()
    select(item, { fly: true })
    drawMarkers()
  }
}

watch(items, () => {
  drawMarkers()
  if (!selectedKey.value && !mapStore.focusKey) fitAll(true)
})
watch(selectedKey, (key, previous) => {
  markers.get(previous)?.setIcon(pinIcon(false))
  markers.get(key)?.setIcon(pinIcon(true))
  markers.get(key)?.setZIndexOffset(1000)
  markers.get(previous)?.setZIndexOffset(0)
  if (key && !markers.has(key)) drawMarkers()
})
// Une carte masquée ne connaît pas sa taille : on la recalcule à l'affichage.
watch(() => props.active, async (active) => {
  if (!active) return
  detectTheme()
  await nextTick()
  map?.invalidateSize()
  applyFocus()
})
watch(() => mapStore.focusRequest, () => {
  if (props.active) applyFocus()
})

onMounted(async () => {
  detectTheme()
  createMap()
  await load()
  await nextTick()
  map?.invalidateSize()
  drawMarkers()
  if (mapStore.focusKey) applyFocus()
  else fitAll(false)
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  markers.clear()
})
</script>

<style scoped>
.m-map {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--m-bg);
  /* La carte a ses propres niveaux d'empilement : ils restent sous les panneaux de la coque. */
  isolation: isolate;
}
.m-map__canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--m-surface);
  font-family: inherit;
}
/* Thème sombre : le fond de carte est assombri pour s'accorder à l'application. */
.m-map__canvas--dark :deep(.leaflet-tile-pane) {
  filter: invert(1) hue-rotate(180deg) saturate(0.4) brightness(0.95) contrast(0.9);
}
.m-map__canvas :deep(.leaflet-control-attribution) {
  margin: 0 0 4px 6px;
  padding: 1px 6px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--m-surface) 82%, transparent);
  color: var(--m-muted);
  font-size: 10px;
}
.m-map__canvas :deep(.leaflet-control-attribution a) {
  color: inherit;
}
.m-map__canvas :deep(.leaflet-bottom.leaflet-right) {
  right: auto;
  left: 0;
}

/* Repères */
.m-map__canvas :deep(.m-pin) {
  display: grid;
  place-items: center;
  border: 0;
  background: none;
}
.m-map__canvas :deep(.m-pin__dot) {
  display: block;
  width: 18px;
  height: 18px;
  border: 3px solid #f3c300;
  border-radius: 50%;
  background: #071426;
  box-shadow: 0 2px 8px rgba(2, 8, 18, 0.55);
  transition: transform 160ms ease, background-color 160ms ease;
}
.m-map__canvas :deep(.m-pin--selected .m-pin__dot) {
  background: #f3c300;
  border-color: #071426;
  transform: scale(1.7);
}
.m-map__canvas :deep(.m-pin:focus-visible) {
  outline: none;
}
.m-map__canvas :deep(.m-pin:focus-visible .m-pin__dot) {
  outline: 3px solid #fff;
  outline-offset: 2px;
}
.m-map__canvas :deep(.m-me span) {
  display: block;
  width: 16px;
  height: 16px;
  margin: 3px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.25);
}

/* Barre flottante du haut */
.m-map__top {
  position: absolute;
  top: 8px;
  right: 0;
  left: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.m-map__top > * {
  pointer-events: auto;
}
.m-map__searchbar {
  display: flex;
  gap: 8px;
  padding: 0 12px;
}
.m-map__search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 48px;
  padding: 0 4px 0 14px;
  border-radius: 99px;
  background: var(--m-surface);
  color: var(--m-muted);
  box-shadow: 0 4px 16px rgba(2, 8, 18, 0.35);
}
.m-map__search:focus-within {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 1px;
}
.m-map__search input {
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
  text-overflow: ellipsis;
  -webkit-appearance: none;
  appearance: none;
}
.m-map__search input::placeholder {
  color: var(--m-muted);
}
.m-map__search input::-webkit-search-cancel-button {
  display: none;
}
.m-map__clear {
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
.m-map__clear :deep(.m-icon) {
  width: 18px;
  height: 18px;
}
.m-map__round {
  position: relative;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--m-surface);
  color: var(--m-fg);
  box-shadow: 0 4px 16px rgba(2, 8, 18, 0.35);
  cursor: pointer;
  touch-action: manipulation;
}
.m-map__round.is-active {
  background: var(--m-accent);
  color: var(--m-on-accent);
}
.m-map__round:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-map__badge {
  position: absolute;
  top: -3px;
  right: -3px;
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 99px;
  background: var(--m-fg);
  color: var(--m-bg);
  font-size: 0.6875rem;
  font-weight: 700;
}
.m-map__chips {
  display: flex;
  gap: 8px;
  padding: 2px 12px 6px;
  overflow-x: auto;
  scrollbar-width: none;
}
.m-map__chips::-webkit-scrollbar {
  display: none;
}
.m-map__chip {
  position: relative;
  flex: 0 0 auto;
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 99px;
  background: var(--m-surface);
  color: var(--m-fg);
  box-shadow: 0 3px 10px rgba(2, 8, 18, 0.3);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  touch-action: manipulation;
}
.m-map__chip::after {
  content: '';
  position: absolute;
  inset: -4px 0;
}
.m-map__chip[aria-pressed='true'] {
  background: var(--m-accent);
  color: var(--m-on-accent);
  font-weight: 600;
}
.m-map__chip--reset {
  color: var(--m-muted);
}
.m-map__chip:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-map__suggestions {
  margin: 0 12px;
  padding: 6px;
  max-height: 46vh;
  overflow-y: auto;
  border-radius: 18px;
  background: var(--m-surface);
  box-shadow: 0 8px 24px rgba(2, 8, 18, 0.4);
  list-style: none;
}
.m-map__suggestions button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  padding: 6px 8px;
  border: 0;
  border-radius: 12px;
  background: none;
  color: var(--m-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.m-map__suggestions button:active {
  background: var(--m-raised);
}
.m-map__suggestions :deep(.m-icon) {
  width: 18px;
  height: 18px;
  color: var(--m-accent-text);
}
.m-map__suggestions span {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.m-map__suggestions strong {
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-map__suggestions small {
  color: var(--m-muted);
  font-size: 0.75rem;
}
.m-map__nothing {
  padding: 14px 10px;
  color: var(--m-muted);
  font-size: 0.875rem;
}
.m-map__notice {
  position: absolute;
  top: 116px;
  right: 12px;
  left: 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--m-surface);
  box-shadow: 0 4px 16px rgba(2, 8, 18, 0.35);
  font-size: 0.8125rem;
}
.m-map__notice button {
  flex-shrink: 0;
  min-height: 44px;
  padding: 0 6px;
  border: 0;
  background: none;
  color: var(--m-accent-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

/* Boutons flottants du bas */
.m-map__side {
  position: absolute;
  right: 12px;
  bottom: 18px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 160ms ease;
}
/* La fiche du bas prend la place : les boutons s'effacent. */
.m-map__side.is-raised {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-12px);
}

/* Fiche du bas */
.m-map__card {
  position: absolute;
  right: 10px;
  bottom: 10px;
  left: 10px;
  z-index: 3;
  padding: 8px 14px 14px;
  border: 1px solid var(--m-line);
  border-radius: 22px;
  background: var(--m-surface);
  color: var(--m-fg);
  box-shadow: 0 10px 32px rgba(2, 8, 18, 0.5);
  touch-action: none;
  transition: transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms ease;
}
.m-map__grab {
  display: block;
  width: 40px;
  height: 4px;
  margin: 0 auto 8px;
  border-radius: 2px;
  background: var(--m-line);
}
.m-map__card-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.m-map__thumb {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  object-fit: cover;
  background: var(--m-raised);
}
.m-map__card-text {
  flex: 1;
  min-width: 0;
}
.m-map__name {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.3;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
.m-map__place {
  margin: 2px 0 0;
  color: var(--m-muted);
  font-size: 0.8125rem;
}
.m-map__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.m-map__tags span {
  padding: 2px 9px;
  border-radius: 99px;
  background: var(--m-raised);
  color: var(--m-muted);
  font-size: 0.6875rem;
  font-weight: 500;
}
.m-map__actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.m-map__actions .m-cta {
  flex: 1;
  width: auto;
}
.m-map__actions .m-ghost-button {
  flex-shrink: 0;
  text-decoration: none;
}
.m-map__actions :deep(.m-icon) {
  width: 18px;
  height: 18px;
}
.m-map-card-enter-from,
.m-map-card-leave-to {
  opacity: 0;
  transform: translateY(110%);
}
.m-map-card-leave-active {
  position: absolute;
}
@media (prefers-reduced-motion: reduce) {
  .m-map__card,
  .m-map__side {
    transition: none;
  }
}
</style>
