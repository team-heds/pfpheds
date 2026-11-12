<template>
  <section class="imap" :class="{ 'imap--light': !dark }" aria-labelledby="imap-title">
    <!-- Pas de :class ici : Vue écraserait les classes que Leaflet pose sur ce conteneur. -->
    <div ref="canvasRef" class="imap__canvas"></div>

    <!-- Panneau : recherche, filtres, liste synchronisée avec la carte -->
    <aside ref="panelRef" class="imap__panel" aria-label="Recherche et liste des institutions">
      <header class="imap__head">
        <h1 id="imap-title" class="imap__title">Carte des lieux de stage</h1>
        <p class="imap__subtitle">
          <template v-if="ready">
            {{ pluralize(entries.length, 'institution') }} · {{ pluralize(totalPlaces, 'place') }} de formation
          </template>
          <template v-else>Chargement des institutions…</template>
        </p>
      </header>

      <form class="imap__search" role="search" @submit.prevent="selectFirstResult">
        <i class="pi pi-search" aria-hidden="true"></i>
        <label for="imap-search" class="sr-only">Rechercher une institution, une ville ou un canton</label>
        <input
          id="imap-search"
          v-model="searchTerm"
          type="search"
          autocomplete="off"
          placeholder="Rechercher une institution, une ville…"
        />
        <button v-if="searchTerm" type="button" class="imap__icon-btn" aria-label="Effacer la recherche" @click="searchTerm = ''">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </form>

      <div class="imap__chips" role="group" aria-label="Filtrer par stage">
        <button type="button" class="imap__chip" :aria-pressed="filters.pfp.length === 0" @click="filters.pfp = []">Tous</button>
        <button
          v-for="pfp in PFP_TYPES"
          :key="pfp"
          type="button"
          class="imap__chip"
          :aria-pressed="filters.pfp.includes(pfp)"
          @click="toggle('pfp', pfp)"
        >{{ pfp }}</button>
      </div>

      <div class="imap__chips">
        <button
          type="button"
          class="imap__chip imap__chip--ghost"
          :aria-expanded="moreFilters"
          aria-controls="imap-more-filters"
          @click="moreFilters = !moreFilters"
        >
          <i class="pi pi-sliders-h" aria-hidden="true"></i>
          Domaine, langue, canton
          <span v-if="secondaryFilterCount" class="imap__count-dot">{{ secondaryFilterCount }}</span>
          <i class="pi" :class="moreFilters ? 'pi-chevron-up' : 'pi-chevron-down'" aria-hidden="true"></i>
        </button>
        <button v-if="abroadCount" type="button" class="imap__chip imap__chip--ghost" @click="fitAll({ includeAbroad: true })">
          <i class="pi pi-globe" aria-hidden="true"></i> Hors de Suisse ({{ abroadCount }})
        </button>
        <button v-if="activeFilterCount || searchTerm" type="button" class="imap__chip imap__chip--reset" @click="clearFilters">
          Tout afficher
        </button>
      </div>

      <Transition name="imap-fold">
        <div v-if="moreFilters" id="imap-more-filters" class="imap__groups">
          <div v-for="group in secondaryGroups" :key="group.key" class="imap__group" role="group" :aria-labelledby="`imap-group-${group.key}`">
            <p :id="`imap-group-${group.key}`" class="imap__group-label">{{ group.label }}</p>
            <div class="imap__chips imap__chips--small">
              <button
                v-for="option in group.options"
                :key="option.value"
                type="button"
                class="imap__chip"
                :aria-pressed="filters[group.key].includes(option.value)"
                @click="toggle(group.key, option.value)"
              >{{ option.label }}</button>
            </div>
          </div>
        </div>
      </Transition>

      <div class="imap__list-head">
        <span role="status" aria-live="polite">{{ ready ? pluralize(results.length, 'résultat') : '' }}</span>
        <label class="imap__sort">
          <span>Trier</span>
          <select v-model="sortBy">
            <option value="name">par nom</option>
            <option value="places">par places</option>
            <option v-if="position" value="distance">par distance</option>
          </select>
        </label>
      </div>

      <ul ref="listRef" class="imap__list" aria-label="Institutions">
        <template v-if="!ready && !loadError">
          <li v-for="n in 6" :key="`skeleton-${n}`" class="imap__item imap__item--skeleton" aria-hidden="true">
            <span class="imap__thumb"></span><span class="imap__lines"><span></span><span></span></span>
          </li>
        </template>
        <li v-else-if="loadError" class="imap__empty" role="alert">
          La liste des institutions n'a pas pu être chargée.
          <button type="button" class="imap__link" @click="load(true)">Réessayer</button>
        </li>
        <li v-else-if="!results.length" class="imap__empty">
          Aucune institution ne correspond.
          <button type="button" class="imap__link" @click="clearFilters">Tout afficher</button>
        </li>
        <template v-else>
        <li v-for="entry in results" :key="entry.key">
          <button
            type="button"
            class="imap__item"
            :class="{ 'is-selected': entry.key === selectedKey, 'is-hover': entry.key === hoverKey }"
            :data-key="entry.key"
            :aria-current="entry.key === selectedKey ? 'true' : undefined"
            @click="select(entry.key, { fly: true })"
            @mouseenter="hoverKey = entry.key"
            @mouseleave="hoverKey = null"
            @focus="hoverKey = entry.key"
            @blur="hoverKey = null"
          >
            <img :src="entry.image" alt="" class="imap__thumb" loading="lazy" @error="showInstitutionPlaceholder" />
            <span class="imap__lines">
              <span class="imap__name">{{ entry.institution.Name }}</span>
              <span class="imap__meta">{{ entryMeta(entry) }}</span>
            </span>
            <span v-if="entry.places" class="imap__badge">{{ pluralize(entry.places, 'place') }}</span>
          </button>
        </li>
        </template>
      </ul>
    </aside>

    <!-- Commandes de la carte -->
    <div class="imap__controls" role="group" aria-label="Commandes de la carte">
      <button type="button" class="imap__ctrl" aria-label="Zoomer" title="Zoomer" @click="map?.zoomIn()"><i class="pi pi-plus" aria-hidden="true"></i></button>
      <button type="button" class="imap__ctrl" aria-label="Dézoomer" title="Dézoomer" @click="map?.zoomOut()"><i class="pi pi-minus" aria-hidden="true"></i></button>
      <button type="button" class="imap__ctrl" aria-label="Voir toutes les institutions" title="Voir toutes les institutions" @click="fitAll()"><i class="pi pi-arrows-alt" aria-hidden="true"></i></button>
      <button
        type="button"
        class="imap__ctrl"
        :class="{ 'is-active': position }"
        :aria-label="locating ? 'Recherche de ta position…' : 'Me situer sur la carte'"
        :title="locating ? 'Recherche de ta position…' : 'Me situer sur la carte'"
        :disabled="locating"
        @click="locate"
      ><i class="pi" :class="locating ? 'pi-spin pi-spinner' : 'pi-compass'" aria-hidden="true"></i></button>
    </div>

    <p v-if="locateError" class="imap__toast" role="alert">{{ locateError }}</p>

    <!-- Fiche de l'institution choisie -->
    <Transition name="imap-card">
      <article v-if="selected" :key="selected.key" class="imap__card" aria-labelledby="imap-card-title">
        <div class="imap__photo">
          <img :src="selected.image" alt="" @error="showInstitutionPlaceholder" />
          <button type="button" class="imap__close" aria-label="Fermer la fiche" @click="select(null)">
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>
        <div class="imap__card-body">
          <h2 id="imap-card-title" class="imap__card-title">{{ selected.institution.Name }}</h2>
          <p class="imap__card-meta">{{ cardMeta(selected) }}</p>
          <p v-if="selected.places" class="imap__card-places">
            <i class="pi pi-users" aria-hidden="true"></i>
            {{ pluralize(selected.places, 'place') }} de formation{{ activeFilterCount ? ' pour tes filtres' : '' }}
          </p>
          <div v-if="selected.pfp.length || selected.criteria.length" class="imap__tags">
            <span v-for="pfp in selected.pfp" :key="pfp" class="imap__tag imap__tag--brand">{{ pfp }}</span>
            <span v-for="key in selected.criteria" :key="key" class="imap__tag">{{ CRITERIA_LABELS[key] || key }}</span>
          </div>
          <div class="imap__actions">
            <button type="button" class="imap__btn imap__btn--primary" @click="openInstitution(selected)">Voir la fiche</button>
            <a v-if="selected.latLng" :href="directionsUrl(selected.latLng)" target="_blank" rel="noopener noreferrer" class="imap__btn">
              <i class="pi pi-directions" aria-hidden="true"></i> Itinéraire
            </a>
            <a v-if="selected.website" :href="selected.website" target="_blank" rel="noopener noreferrer" class="imap__btn" aria-label="Site web de l'institution">
              <i class="pi pi-external-link" aria-hidden="true"></i> Site
            </a>
          </div>
        </div>
      </article>
    </Transition>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePlacesStore } from '@/stores/placesStore'
import { useLayout } from '@/layout/composables/layout'
import {
  filterInstitutions,
  getAvailableCantons,
  INSTITUTION_CRITERIA,
  INSTITUTION_LANGUAGES,
  INSTITUTION_PFP_TYPES,
} from '@/service/institutionFiltersService'
import { institutionImageOf, showInstitutionPlaceholder } from '@/utils/institutionImage'
import {
  boundsFor,
  clusterPoints,
  countActiveFilters,
  CRITERIA_LABELS,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  directionsUrl,
  institutionKey,
  institutionLatLng,
  isInSwitzerland,
  LANGUAGE_LABELS,
  languageLabel,
  pluralize,
  spreadOffsets,
  summarizeOffers,
  websiteUrl,
} from './institutionMapHelpers'

const PFP_TYPES = INSTITUTION_PFP_TYPES
// À partir de ce zoom on ne regroupe plus : on écarte seulement les repères superposés.
const UNCLUSTER_ZOOM = 15
const CLUSTER_RADIUS = 52

const router = useRouter()
const institutionsStore = useInstitutionsStore()
const placesStore = usePlacesStore()
const { layoutConfig } = useLayout()

const dark = computed(() => layoutConfig.colorScheme.value !== 'light')
const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const canvasRef = ref(null)
const panelRef = ref(null)
const listRef = ref(null)
const ready = ref(false)
const loadError = ref(false)
const searchTerm = ref('')
const moreFilters = ref(false)
const sortBy = ref('name')
const selectedKey = ref(null)
const hoverKey = ref(null)
const position = ref(null)
const locating = ref(false)
const locateError = ref('')
const filters = reactive({ cantons: [], criter: [], languages: [], pfp: [] })

let map = null
let markerLayer = null
let positionMarker = null
let toastTimer = null
// Repère affiché pour chaque institution (le même objet pour toutes celles d'un groupe).
const markerByKey = new Map()

// --- Données ---------------------------------------------------------------
const offers = computed(() => summarizeOffers(placesStore.places || [], filters))

const toEntry = (institution) => {
  const key = institutionKey(institution)
  const offer = offers.value.get(key)
  return {
    key,
    institution,
    latLng: institutionLatLng(institution),
    image: institutionImageOf(institution),
    website: websiteUrl(institution.URL),
    places: offer?.places || 0,
    pfp: offer?.pfp || [],
    criteria: offer?.criteria || [],
  }
}

/** Toutes les institutions visibles (pour retrouver la fiche choisie même filtrée). */
const entries = computed(() => (institutionsStore.institutions || [])
  .filter((institution) => institution?.is_hidden !== true)
  .map(toEntry)
  .filter((entry) => entry.key))

const results = computed(() => {
  const kept = new Set(filterInstitutions({
    institutions: institutionsStore.institutions || [],
    places: placesStore.places || [],
    filters,
    searchTerm: searchTerm.value,
  }).map(institutionKey))
  const list = entries.value.filter((entry) => kept.has(entry.key))
  const byName = (a, b) => String(a.institution.Name || '').localeCompare(String(b.institution.Name || ''), 'fr-CH')
  if (sortBy.value === 'places') return list.sort((a, b) => b.places - a.places || byName(a, b))
  if (sortBy.value === 'distance' && position.value) {
    const dist = (entry) => (entry.latLng ? map?.distance(position.value, entry.latLng) ?? Infinity : Infinity)
    return list.sort((a, b) => dist(a) - dist(b))
  }
  return list.sort(byName)
})

const mappable = computed(() => results.value.filter((entry) => entry.latLng))
const abroadCount = computed(() => mappable.value.filter((entry) => !isInSwitzerland(entry.latLng)).length)
const totalPlaces = computed(() => entries.value.reduce((sum, entry) => sum + entry.places, 0))
const selected = computed(() => entries.value.find((entry) => entry.key === selectedKey.value) || null)
const activeFilterCount = computed(() => countActiveFilters(filters))
const secondaryFilterCount = computed(() => filters.criter.length + filters.languages.length + filters.cantons.length)

const secondaryGroups = computed(() => [
  { key: 'criter', label: 'Domaine', options: INSTITUTION_CRITERIA.map((value) => ({ value, label: CRITERIA_LABELS[value] || value })) },
  { key: 'languages', label: 'Langue', options: INSTITUTION_LANGUAGES.map((value) => ({ value, label: LANGUAGE_LABELS[value] || value })) },
  { key: 'cantons', label: 'Canton', options: getAvailableCantons(institutionsStore.institutions || []).map((value) => ({ value, label: value })) },
])

const entryMeta = (entry) => {
  const parts = [entry.institution.Locality || entry.institution.Canton, languageLabel(entry.institution.Language)]
  if (!entry.latLng) parts.push('pas encore sur la carte')
  else if (position.value && map) parts.push(formatKm(map.distance(position.value, entry.latLng)))
  return parts.filter(Boolean).join(' · ')
}

const cardMeta = (entry) => {
  const { Address, Locality, Canton, Language } = entry.institution
  const address = [Address, Address && String(Address).includes(Locality || '') ? '' : Locality].filter(Boolean).join(', ')
  return [address, Canton, languageLabel(Language)].filter(Boolean).join(' · ')
}

const formatKm = (meters) => {
  const km = meters / 1000
  return km < 10 ? `${km.toFixed(1).replace('.', ',')} km` : `${Math.round(km)} km`
}

function toggle(group, value) {
  const list = filters[group]
  filters[group] = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function clearFilters() {
  searchTerm.value = ''
  Object.keys(filters).forEach((key) => { filters[key] = [] })
}

// --- Carte -----------------------------------------------------------------
function createMap() {
  if (map || !canvasRef.value) return
  map = L.map(canvasRef.value, {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: false,
    minZoom: 3,
    maxZoom: 18,
    zoomSnap: 0.25,
    zoomDelta: 0.75,
    wheelPxPerZoomLevel: 90,
    fadeAnimation: !reducedMotion,
    zoomAnimation: !reducedMotion,
  })
  map.attributionControl.setPrefix(false)
  map.attributionControl.setPosition('bottomleft')
  // Fond OpenStreetMap (gratuit, sans clé, attribution obligatoire), assombri en CSS en mode sombre.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  map.on('zoomend', drawMarkers)
}

/** Marge à garder libre autour des repères : le panneau à gauche, la fiche à droite. */
function viewPadding() {
  const panelRight = panelRef.value ? panelRef.value.getBoundingClientRect().right - canvasRef.value.getBoundingClientRect().left : 0
  const cardWidth = selected.value ? Math.min(400, map.getSize().x * 0.3) : 0
  return { left: panelRight + 32, right: cardWidth + 48, top: 48, bottom: 48 }
}

function fitAll({ includeAbroad = false, animate = true } = {}) {
  if (!map) return
  const bounds = boundsFor(mappable.value.map((entry) => entry.latLng), { includeAbroad })
  if (!bounds) {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
    return
  }
  const pad = viewPadding()
  map.flyToBounds(bounds, {
    paddingTopLeft: [pad.left, pad.top],
    paddingBottomRight: [pad.right, pad.bottom],
    maxZoom: 13,
    animate: animate && !reducedMotion,
    duration: 0.8,
  })
}

/** Centre un point dans la partie de la carte qui n'est pas cachée par le panneau ou la fiche. */
function flyToVisible(latLng, zoom) {
  const pad = viewPadding()
  const shiftX = (pad.left - pad.right) / 2
  const target = map.unproject(map.project(latLng, zoom).subtract([shiftX, 0]), zoom)
  map.flyTo(target, zoom, { animate: !reducedMotion, duration: 0.7 })
}

const pinHtml = (entry) => `<span class="imap-pin__dot">${entry.places || ''}</span>`

function markerClasses(keys) {
  const classes = []
  if (keys.includes(selectedKey.value)) classes.push('is-selected')
  if (keys.includes(hoverKey.value)) classes.push('is-hover')
  return classes
}

function drawMarkers() {
  if (!map) return
  markerLayer.clearLayers()
  markerByKey.clear()
  const zoom = map.getZoom()
  const byKey = new Map(mappable.value.map((entry) => [entry.key, entry]))
  const points = mappable.value.map((entry) => {
    const { x, y } = map.project(entry.latLng, zoom)
    return { key: entry.key, x, y }
  })
  const clustered = zoom < UNCLUSTER_ZOOM
  clusterPoints(points, clustered ? CLUSTER_RADIUS : 3).forEach((cluster) => {
    if (clustered && cluster.keys.length > 1) {
      addCluster(cluster, byKey, zoom)
      return
    }
    // Repères seuls (ou superposés au même endroit, écartés en cercle).
    const offsets = spreadOffsets(cluster.keys.length)
    cluster.keys.forEach((key, index) => {
      const entry = byKey.get(key)
      const [dx, dy] = offsets[index]
      const latLng = dx || dy ? map.unproject(map.project(entry.latLng, zoom).add([dx, dy]), zoom) : entry.latLng
      const marker = L.marker(latLng, {
        icon: L.divIcon({
          className: ['imap-pin', entry.places ? '' : 'imap-pin--empty', ...markerClasses([key])].filter(Boolean).join(' '),
          html: pinHtml(entry),
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
        title: entry.institution.Name,
        alt: entry.institution.Name,
        keyboard: true,
        riseOnHover: true,
      })
      marker.on('click', () => select(key, { fly: false, scrollList: true }))
      marker.on('mouseover', () => { hoverKey.value = key })
      marker.on('mouseout', () => { if (hoverKey.value === key) hoverKey.value = null })
      marker.addTo(markerLayer)
      markerByKey.set(key, { marker, keys: [key] })
    })
  })
}

function addCluster(cluster, byKey, zoom) {
  const count = cluster.keys.length
  const places = cluster.keys.reduce((sum, key) => sum + (byKey.get(key)?.places || 0), 0)
  const size = count < 5 ? 40 : count < 15 ? 48 : 56
  const latLng = map.unproject([cluster.x, cluster.y], zoom)
  const names = cluster.keys.map((key) => byKey.get(key)?.institution.Name).filter(Boolean)
  const marker = L.marker(latLng, {
    icon: L.divIcon({
      className: ['imap-cluster', ...markerClasses(cluster.keys)].join(' '),
      html: `<span class="imap-cluster__dot">${places || count}</span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    }),
    title: `${pluralize(count, 'institution')}, ${pluralize(places, 'place')} : ${names.slice(0, 4).join(', ')}${names.length > 4 ? '…' : ''}`,
    alt: `${pluralize(count, 'institution')}, ${pluralize(places, 'place')}`,
    keyboard: true,
    riseOnHover: true,
  })
  marker.on('click', () => {
    const bounds = L.latLngBounds(cluster.keys.map((key) => byKey.get(key).latLng))
    const pad = viewPadding()
    map.flyToBounds(bounds, {
      paddingTopLeft: [pad.left, pad.top + 40],
      paddingBottomRight: [pad.right, pad.bottom + 40],
      maxZoom: UNCLUSTER_ZOOM,
      animate: !reducedMotion,
      duration: 0.7,
    })
  })
  marker.addTo(markerLayer)
  cluster.keys.forEach((key) => markerByKey.set(key, { marker, keys: cluster.keys }))
}

/** Met à jour l'état visuel des repères sans tout redessiner. */
function refreshMarkerStates() {
  const done = new Set()
  markerByKey.forEach(({ marker, keys }) => {
    if (done.has(marker)) return
    done.add(marker)
    const element = marker.getElement()
    if (!element) return
    element.classList.toggle('is-selected', keys.includes(selectedKey.value))
    element.classList.toggle('is-hover', keys.includes(hoverKey.value))
    marker.setZIndexOffset(keys.includes(selectedKey.value) ? 1000 : keys.includes(hoverKey.value) ? 500 : 0)
  })
}

function select(key, { fly = false, scrollList = false } = {}) {
  selectedKey.value = key
  if (!key) return
  const entry = entries.value.find((item) => item.key === key)
  if (fly && entry?.latLng && map) {
    nextTick(() => flyToVisible(entry.latLng, zoomToShow(entry)))
  }
  if (scrollList) {
    nextTick(() => {
      listRef.value?.querySelector(`[data-key="${CSS.escape(key)}"]`)?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' })
    })
  }
}

/** Zoom auquel l'institution apparaît seule, et pas dans un groupe avec ses voisines. */
function zoomToShow(entry) {
  const zoom = Math.max(map.getZoom(), 13)
  if (zoom >= UNCLUSTER_ZOOM) return zoom
  const here = map.project(entry.latLng, zoom)
  const crowded = mappable.value.some((other) => other.key !== entry.key
    && here.distanceTo(map.project(other.latLng, zoom)) <= CLUSTER_RADIUS)
  return crowded ? UNCLUSTER_ZOOM : zoom
}

function selectFirstResult() {
  const first = results.value[0]
  if (first) select(first.key, { fly: true, scrollList: true })
}

function openInstitution(entry) {
  router.push({ name: 'InstitutionView', params: { id: entry.institution.InstitutionId ?? entry.key } })
}

function showLocateError(message) {
  locateError.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { locateError.value = '' }, 5000)
}

function locate() {
  if (!navigator.geolocation) {
    showLocateError('Ton navigateur ne permet pas de te situer.')
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      locating.value = false
      position.value = [coords.latitude, coords.longitude]
      positionMarker?.remove()
      positionMarker = L.marker(position.value, {
        icon: L.divIcon({ className: 'imap-me', html: '<span></span>', iconSize: [20, 20], iconAnchor: [10, 10] }),
        interactive: false,
        keyboard: false,
      }).addTo(map)
      sortBy.value = 'distance'
      flyToVisible(position.value, Math.max(map.getZoom(), 11))
    },
    () => {
      locating.value = false
      showLocateError("Position introuvable : vérifie l'autorisation de localisation du navigateur.")
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  )
}

function onKeydown(event) {
  if (event.key === 'Escape' && selectedKey.value) select(null)
}

async function load(force = false) {
  loadError.value = false
  try {
    await Promise.all([
      institutionsStore.fetchInstitutions?.(force ? { force: true } : undefined),
      placesStore.fetchPlaces?.(force ? { force: true } : undefined),
    ])
    ready.value = true
    await nextTick()
    map?.invalidateSize()
    drawMarkers()
    fitAll({ animate: false })
  } catch (error) {
    console.error('Erreur lors du chargement de la carte des institutions:', error)
    loadError.value = true
  }
}

// Les filtres changent les repères ; on recadre seulement si le choix ne laisse plus rien de visible.
watch(mappable, () => {
  drawMarkers()
  if (!map || !mappable.value.length) return
  const view = map.getBounds()
  if (!mappable.value.some((entry) => view.contains(entry.latLng))) fitAll()
})
watch([selectedKey, hoverKey], refreshMarkerStates)

onMounted(() => {
  createMap()
  window.addEventListener('keydown', onKeydown)
  load()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(toastTimer)
  map?.remove()
  map = null
})
</script>

<style scoped>
.imap {
  --imap-panel: rgb(9 22 40 / 0.9);
  --imap-panel-border: rgb(255 255 255 / 0.08);
  --imap-field: rgb(255 255 255 / 0.06);
  --imap-field-border: rgb(255 255 255 / 0.1);
  --imap-text: #e8eef7;
  --imap-muted: #93a4bb;
  --imap-hover: rgb(255 255 255 / 0.06);
  --imap-selected: rgb(243 195 0 / 0.12);
  --imap-shadow: 0 18px 48px rgb(0 0 0 / 0.38);
  --imap-brand: var(--app-color-brand, #f3c300);
  --imap-on-brand: #071426;
  --imap-ease: cubic-bezier(0.2, 0, 0, 1);
  position: relative;
  height: calc(100dvh - var(--navbar-h, 80px) - (2 * var(--content-pad, 1rem)));
  min-height: 32rem;
  margin: 0 clamp(0rem, 1vw, 1rem);
  overflow: hidden;
  border-radius: 1.5rem;
  background: #0e1c2f;
  color: var(--imap-text);
  font-family: var(--app-font-family, 'Poppins', sans-serif);
  isolation: isolate;
}

.imap--light {
  --imap-panel: rgb(255 255 255 / 0.92);
  --imap-panel-border: rgb(15 23 42 / 0.08);
  --imap-field: rgb(15 23 42 / 0.04);
  --imap-field-border: rgb(15 23 42 / 0.12);
  --imap-text: #172033;
  --imap-muted: #586475;
  --imap-hover: rgb(15 23 42 / 0.05);
  --imap-selected: rgb(243 195 0 / 0.18);
  --imap-shadow: 0 18px 44px rgb(15 23 42 / 0.16);
  background: #e9ece8;
}

.imap__canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: inherit;
  font-family: inherit;
}

/* Fond de carte : OSM assombri en mode sombre, adouci en mode clair. */
.imap__canvas :deep(.leaflet-tile-pane) {
  filter: saturate(0.55) contrast(0.95) brightness(1.02);
}
.imap:not(.imap--light) .imap__canvas :deep(.leaflet-tile-pane) {
  filter: invert(1) hue-rotate(195deg) saturate(0.18) brightness(0.82) contrast(0.95);
}
.imap__canvas :deep(.leaflet-control-attribution) {
  margin: 0 0 0.5rem calc(clamp(19rem, 27vw, 23.5rem) + 2rem);
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background: var(--imap-panel);
  color: var(--imap-muted);
  font-size: 0.6875rem;
}
.imap__canvas :deep(.leaflet-control-attribution a) {
  color: inherit;
}

/* Repères */
.imap__canvas :deep(.imap-pin),
.imap__canvas :deep(.imap-cluster) {
  display: grid;
  place-items: center;
  border: 0;
  background: none;
  cursor: pointer;
}
.imap__canvas :deep(.imap-pin__dot),
.imap__canvas :deep(.imap-cluster__dot) {
  display: grid;
  place-items: center;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  transition: transform 180ms var(--imap-ease), background-color 180ms ease, box-shadow 180ms ease;
  animation: imap-pop 260ms var(--imap-ease) both;
}
.imap__canvas :deep(.imap-pin__dot) {
  width: 26px;
  height: 26px;
  border: 2.5px solid var(--imap-brand);
  border-radius: 50%;
  background: #071426;
  color: var(--imap-brand);
  font-size: 0.75rem;
  box-shadow: 0 3px 10px rgb(0 0 0 / 0.35);
}
.imap__canvas :deep(.imap-pin--empty .imap-pin__dot) {
  width: 16px;
  height: 16px;
}
.imap__canvas :deep(.imap-cluster__dot) {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--imap-brand);
  color: var(--imap-on-brand);
  font-size: 0.875rem;
  box-shadow: 0 0 0 7px rgb(243 195 0 / 0.22), 0 6px 16px rgb(0 0 0 / 0.3);
}
.imap__canvas :deep(.imap-pin.is-hover .imap-pin__dot),
.imap__canvas :deep(.imap-cluster.is-hover .imap-cluster__dot) {
  transform: scale(1.18);
}
.imap__canvas :deep(.imap-pin.is-selected .imap-pin__dot) {
  background: var(--imap-brand);
  border-color: #071426;
  color: var(--imap-on-brand);
  transform: scale(1.35);
  box-shadow: 0 0 0 8px rgb(243 195 0 / 0.25), 0 6px 16px rgb(0 0 0 / 0.35);
}
.imap__canvas :deep(.imap-cluster.is-selected .imap-cluster__dot) {
  box-shadow: 0 0 0 4px #071426, 0 0 0 9px var(--imap-brand);
}
.imap__canvas :deep(.imap-pin:focus-visible),
.imap__canvas :deep(.imap-cluster:focus-visible) {
  outline: none;
}
.imap__canvas :deep(.imap-pin:focus-visible .imap-pin__dot),
.imap__canvas :deep(.imap-cluster:focus-visible .imap-cluster__dot) {
  outline: 3px solid #fff;
  outline-offset: 3px;
}
.imap__canvas :deep(.imap-me span) {
  display: block;
  width: 20px;
  height: 20px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 0 8px rgb(59 130 246 / 0.25);
}

@keyframes imap-pop {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: scale(1); }
}

/* Panneau */
.imap__panel {
  overflow: hidden;
  position: absolute;
  z-index: 2;
  top: 1rem;
  bottom: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: clamp(19rem, 27vw, 23.5rem);
  padding: 1.25rem 1rem 0.5rem;
  border: 1px solid var(--imap-panel-border);
  border-radius: 1.25rem;
  background: var(--imap-panel);
  box-shadow: var(--imap-shadow);
  backdrop-filter: blur(16px) saturate(1.2);
}
.imap__panel > * {
  flex-shrink: 0;
}
.imap__head {
  padding: 0 0.25rem;
}
.imap__title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--imap-text);
}
.imap__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--imap-muted);
}

.imap__search {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  height: 2.75rem;
  padding: 0 0.5rem 0 0.875rem;
  border: 1px solid var(--imap-field-border);
  border-radius: 0.875rem;
  background: var(--imap-field);
  color: var(--imap-muted);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.imap__search:focus-within {
  border-color: var(--imap-brand);
  box-shadow: 0 0 0 3px rgb(243 195 0 / 0.2);
}
.imap__search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: none;
  color: var(--imap-text);
  font: inherit;
  font-size: 0.875rem;
}
.imap__search input::placeholder {
  color: var(--imap-muted);
}
.imap__search input::-webkit-search-cancel-button {
  display: none;
}

.imap__icon-btn {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--imap-muted);
  cursor: pointer;
}
.imap__icon-btn:hover {
  background: var(--imap-hover);
  color: var(--imap-text);
}

.imap__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.imap__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--imap-field-border);
  border-radius: 999px;
  background: var(--imap-field);
  color: var(--imap-text);
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 120ms ease;
}
.imap__chip:hover {
  border-color: rgb(243 195 0 / 0.5);
}
.imap__chip:active {
  transform: scale(0.97);
}
.imap__chip[aria-pressed='true'] {
  border-color: var(--imap-brand);
  background: var(--imap-brand);
  color: var(--imap-on-brand);
  font-weight: 600;
}
.imap__chip--ghost {
  background: transparent;
}
.imap__chip--ghost .pi {
  font-size: 0.75rem;
}
.imap__chip--reset {
  border-color: transparent;
  background: transparent;
  color: var(--imap-brand);
  font-weight: 500;
}
.imap--light .imap__chip--reset {
  color: #775f00;
}
.imap__chip:focus-visible,
.imap__item:focus-visible,
.imap__ctrl:focus-visible,
.imap__btn:focus-visible,
.imap__close:focus-visible,
.imap__icon-btn:focus-visible,
.imap__sort select:focus-visible,
.imap__link:focus-visible {
  outline: 2px solid var(--imap-brand);
  outline-offset: 2px;
}
.imap__chips--small .imap__chip {
  min-height: 1.75rem;
  font-size: 0.75rem;
}
.imap__count-dot {
  display: inline-grid;
  place-items: center;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: var(--imap-brand);
  color: var(--imap-on-brand);
  font-size: 0.6875rem;
  font-weight: 700;
}

.imap__panel > .imap__groups {
  flex: 0 1 auto;
}
.imap__groups {
  min-height: 4rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  display: grid;
  gap: 0.625rem;
  padding: 0.75rem;
  border-radius: 0.875rem;
  background: var(--imap-field);
}
.imap__group-label {
  margin: 0 0 0.375rem;
  color: var(--imap-muted);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.imap__list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0.25rem 0;
  color: var(--imap-muted);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.imap__sort {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.imap__sort select {
  padding: 0.125rem 0.25rem;
  border: 0;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--imap-text);
  font: inherit;
  text-transform: none;
  letter-spacing: 0;
  cursor: pointer;
}
.imap__sort option {
  color: #172033;
}

.imap__panel > .imap__list {
  flex: 1 1 0;
}
.imap__list {
  min-height: 7rem;
  margin: 0 -0.5rem;
  padding: 0 0.5rem 0.5rem;
  overflow-y: auto;
  list-style: none;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgb(127 127 127 / 0.35) transparent;
}
.imap__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem;
  border: 1px solid transparent;
  border-radius: 0.875rem;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease;
}
.imap__item:hover,
.imap__item.is-hover {
  background: var(--imap-hover);
}
.imap__item.is-selected {
  border-color: rgb(243 195 0 / 0.45);
  background: var(--imap-selected);
}
.imap__thumb {
  flex: none;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.625rem;
  background: var(--imap-field);
  object-fit: cover;
}
.imap__lines {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 0.125rem;
}
.imap__name {
  overflow: hidden;
  color: var(--imap-text);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.imap__meta {
  overflow: hidden;
  color: var(--imap-muted);
  font-size: 0.75rem;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.imap__badge {
  flex: none;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: rgb(243 195 0 / 0.14);
  color: var(--imap-brand);
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
}
.imap--light .imap__badge {
  color: #6b5500;
}
.imap__item--skeleton {
  cursor: default;
}
.imap__item--skeleton .imap__lines span {
  display: block;
  height: 0.625rem;
  border-radius: 999px;
  background: var(--imap-field);
}
.imap__item--skeleton .imap__lines span:first-child {
  width: 75%;
  height: 0.75rem;
}
.imap__item--skeleton .imap__lines span:last-child {
  width: 45%;
}
.imap__item--skeleton > span {
  animation: imap-pulse 1.4s ease-in-out infinite;
}
@keyframes imap-pulse {
  50% { opacity: 0.45; }
}
.imap__empty {
  padding: 1.5rem 0.5rem;
  color: var(--imap-muted);
  font-size: 0.875rem;
  text-align: center;
}
.imap__link {
  display: block;
  margin: 0.5rem auto 0;
  border: 0;
  background: none;
  color: var(--imap-brand);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}
.imap--light .imap__link {
  color: #775f00;
}

/* Commandes */
.imap__controls {
  position: absolute;
  z-index: 2;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.imap__ctrl {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--imap-panel-border);
  border-radius: 0.875rem;
  background: var(--imap-panel);
  color: var(--imap-text);
  box-shadow: var(--imap-shadow);
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition: background-color 150ms ease, color 150ms ease, transform 120ms ease;
}
.imap__ctrl:hover {
  color: var(--imap-brand);
}
.imap__ctrl:active {
  transform: scale(0.94);
}
.imap__ctrl.is-active {
  background: var(--imap-brand);
  color: var(--imap-on-brand);
}
.imap__ctrl:disabled {
  cursor: progress;
}

.imap__toast {
  position: absolute;
  z-index: 3;
  top: 1rem;
  left: 50%;
  margin: 0;
  padding: 0.625rem 1rem;
  border-radius: 999px;
  background: var(--imap-panel);
  box-shadow: var(--imap-shadow);
  color: var(--imap-text);
  font-size: 0.8125rem;
  transform: translateX(-50%);
}

/* Fiche */
.imap__card {
  position: absolute;
  z-index: 2;
  right: 1rem;
  bottom: 1rem;
  width: min(25rem, 30vw);
  min-width: 18.5rem;
  overflow: hidden;
  border: 1px solid var(--imap-panel-border);
  border-radius: 1.25rem;
  background: var(--imap-panel);
  box-shadow: var(--imap-shadow);
  backdrop-filter: blur(16px) saturate(1.2);
}
.imap__photo {
  position: relative;
  height: 8.5rem;
  background: var(--imap-field);
}
.imap__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.imap__close {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 50%;
  background: rgb(7 20 38 / 0.6);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(8px);
}
.imap__close:hover {
  background: rgb(7 20 38 / 0.85);
}
.imap__card-body {
  padding: 1rem 1.125rem 1.125rem;
}
.imap__card-title {
  margin: 0;
  color: var(--imap-text);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
}
.imap__card-meta {
  margin: 0.25rem 0 0;
  color: var(--imap-muted);
  font-size: 0.8125rem;
  line-height: 1.45;
}
.imap__card-places {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.625rem 0 0;
  color: var(--imap-text);
  font-size: 0.8125rem;
  font-weight: 500;
}
.imap__card-places .pi {
  color: var(--imap-brand);
  font-size: 0.8125rem;
}
.imap__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.75rem;
}
.imap__tag {
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: var(--imap-field);
  color: var(--imap-text);
  font-size: 0.6875rem;
}
.imap__tag--brand {
  background: rgb(243 195 0 / 0.16);
  color: var(--imap-brand);
  font-weight: 600;
}
.imap--light .imap__tag--brand {
  color: #6b5500;
}
.imap__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}
.imap__btn {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  min-height: 2.5rem;
  padding: 0 0.75rem;
  border: 1px solid var(--imap-field-border);
  border-radius: 0.75rem;
  background: transparent;
  color: var(--imap-text);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 150ms ease, transform 120ms ease;
}
.imap__btn:hover {
  background: var(--imap-hover);
}
.imap__btn:active {
  transform: scale(0.97);
}
.imap__btn--primary {
  flex: 1.4;
  border-color: var(--imap-brand);
  background: var(--imap-brand);
  color: var(--imap-on-brand);
}
.imap__btn--primary:hover {
  background: var(--app-color-brand-hover, #d9ad00);
}

/* Animations */
.imap-card-enter-active,
.imap-card-leave-active {
  transition: opacity 220ms var(--imap-ease), transform 260ms var(--imap-ease);
}
.imap-card-enter-from,
.imap-card-leave-to {
  opacity: 0;
  transform: translateY(1rem) scale(0.98);
}
.imap-fold-enter-active,
.imap-fold-leave-active {
  transition: opacity 180ms ease, transform 200ms var(--imap-ease);
}
.imap-fold-enter-from,
.imap-fold-leave-to {
  opacity: 0;
  transform: translateY(-0.375rem);
}

@media (max-width: 1100px) {
  .imap__card {
    width: 18.5rem;
  }
  .imap__btn--primary {
    flex-basis: 100%;
  }
  .imap__photo {
    height: 6.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .imap *,
  .imap :deep(*) {
    animation: none !important;
    transition: none !important;
  }
}
</style>
