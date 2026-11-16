<template>
  <section class="iloc" :class="{ 'iloc--light': !dark }" :aria-label="`Localisation de ${name || 'l’institution'}`">
    <header class="iloc__head">
      <span class="iloc__title"><i class="pi pi-map-marker" aria-hidden="true"></i> Localisation</span>
      <span v-if="place" class="iloc__place">{{ place }}</span>
    </header>

    <div class="iloc__frame">
      <!-- Pas de :class ici : Vue écraserait les classes que Leaflet pose sur ce conteneur. -->
      <div v-show="latLng" ref="canvasRef" class="iloc__canvas"></div>
      <p v-if="!latLng" class="iloc__empty">
        <i class="pi pi-map" aria-hidden="true"></i>
        Cette institution n'est pas encore placée sur la carte.
      </p>

      <div v-if="latLng" class="iloc__zoom" role="group" aria-label="Zoom de la carte">
        <button type="button" aria-label="Zoomer" title="Zoomer" @click="map?.zoomIn()"><i class="pi pi-plus" aria-hidden="true"></i></button>
        <button type="button" aria-label="Dézoomer" title="Dézoomer" @click="map?.zoomOut()"><i class="pi pi-minus" aria-hidden="true"></i></button>
        <button type="button" aria-label="Recentrer sur l'institution" title="Recentrer" @click="recenter"><i class="pi pi-replay" aria-hidden="true"></i></button>
      </div>
    </div>

    <footer v-if="latLng || mapLink" class="iloc__actions">
      <a v-if="latLng" :href="directionsUrl(latLng)" target="_blank" rel="noopener noreferrer" class="iloc__btn iloc__btn--primary">
        <i class="pi pi-directions" aria-hidden="true"></i> Itinéraire
      </a>
      <RouterLink v-if="mapLink" :to="mapLink" class="iloc__btn">
        <i class="pi pi-map" aria-hidden="true"></i> Voir sur la carte
      </RouterLink>
    </footer>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { directionsUrl, institutionLatLng } from './institutionMapHelpers'
import { useMapTheme } from './useMapTheme'

const props = defineProps({
  institution: { type: Object, default: null },
  /** Lien vers la grande carte centrée sur l'institution (masqué si vide). */
  mapLink: { type: [String, Object], default: '' },
  zoom: { type: Number, default: 14 },
})

const { dark } = useMapTheme()
const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const canvasRef = ref(null)
const latLng = computed(() => institutionLatLng(props.institution))
const name = computed(() => props.institution?.Name || '')
const place = computed(() => [props.institution?.Locality, props.institution?.Canton].filter(Boolean).join(' · '))

let map = null
let marker = null
let resizeObserver = null

const pinIcon = () => L.divIcon({
  className: 'iloc-pin',
  html: '<span class="iloc-pin__halo"></span><span class="iloc-pin__dot"><i class="pi pi-building"></i></span>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
})

function draw() {
  if (!latLng.value || !canvasRef.value) {
    destroy()
    return
  }
  if (!map) {
    map = L.map(canvasRef.value, {
      center: latLng.value,
      zoom: props.zoom,
      zoomControl: false,
      scrollWheelZoom: false,
      zoomSnap: 0.5,
      fadeAnimation: !reducedMotion,
      zoomAnimation: !reducedMotion,
    })
    map.attributionControl.setPrefix(false)
    // Fond OpenStreetMap (gratuit, sans clé, attribution obligatoire), assombri en CSS en mode sombre.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    // La molette ne zoome qu'après un clic sur la carte : la page défile normalement.
    map.on('click', () => map.scrollWheelZoom.enable())
    map.on('mouseout', () => map.scrollWheelZoom.disable())
  } else {
    map.setView(latLng.value, props.zoom, { animate: false })
  }
  marker?.remove()
  marker = L.marker(latLng.value, { icon: pinIcon(), title: name.value, alt: name.value, keyboard: false }).addTo(map)
  // La carte peut être créée avant que la page ait fini sa mise en page (colonne encore à 0 px) :
  // on recalcule sa taille, et on la recentre, dès que son cadre change de dimensions.
  if (!resizeObserver && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (!map || !latLng.value) return
      map.invalidateSize({ animate: false })
      map.setView(latLng.value, map.getZoom(), { animate: false })
    })
    resizeObserver.observe(canvasRef.value)
  }
  nextTick(() => map?.invalidateSize())
}

function recenter() {
  if (map && latLng.value) map.flyTo(latLng.value, props.zoom, { animate: !reducedMotion, duration: 0.6 })
}

function destroy() {
  resizeObserver?.disconnect()
  resizeObserver = null
  marker = null
  map?.remove()
  map = null
}

watch(latLng, (next, previous) => {
  if (String(next) !== String(previous)) nextTick(draw)
})

onMounted(() => nextTick(draw))
onBeforeUnmount(destroy)
</script>

<style scoped>
.iloc {
  --iloc-surface: var(--surface-card, #0b1d33);
  --iloc-border: var(--surface-border, rgb(255 255 255 / 0.08));
  --iloc-text: var(--text-color, #e8eef7);
  --iloc-muted: var(--text-color-secondary, #93a4bb);
  --iloc-brand: var(--app-color-brand, #f3c300);
  --iloc-on-brand: #071426;
  --iloc-control: rgb(9 22 40 / 0.88);
  --iloc-control-text: #e8eef7;
  overflow: hidden;
  border: 1px solid var(--iloc-border);
  border-radius: var(--radius, 1rem);
  background: var(--iloc-surface);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.06), 0 4px 16px rgb(0 0 0 / 0.04);
  font-family: var(--app-font-family, 'Poppins', sans-serif);
}
.iloc--light {
  --iloc-control: rgb(255 255 255 / 0.94);
  --iloc-control-text: #172033;
}

.iloc__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.8rem 1.1rem;
}
.iloc__title {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--iloc-text);
  font-size: 0.88rem;
  font-weight: 700;
}
.iloc__title .pi {
  color: var(--iloc-brand);
  font-size: 0.9rem;
}
.iloc__place {
  overflow: hidden;
  color: var(--iloc-muted);
  font-size: 0.78rem;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.iloc__frame {
  position: relative;
  height: 20rem;
  margin: 0 0.625rem;
  overflow: hidden;
  border-radius: 0.875rem;
  background: #0e1c2f;
  isolation: isolate;
}
.iloc--light .iloc__frame {
  background: #e9ece8;
}
.iloc__canvas {
  position: absolute;
  inset: 0;
  background: inherit;
  font-family: inherit;
}
.iloc__canvas :deep(.leaflet-tile-pane) {
  filter: saturate(0.55) contrast(0.95) brightness(1.02);
}
.iloc:not(.iloc--light) .iloc__canvas :deep(.leaflet-tile-pane) {
  filter: invert(1) hue-rotate(195deg) saturate(0.18) brightness(0.82) contrast(0.95);
}
.iloc__canvas :deep(.leaflet-control-attribution) {
  margin: 0 0.5rem 0.5rem 0;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: var(--iloc-control);
  color: var(--iloc-muted);
  font-size: 0.625rem;
}
.iloc__canvas :deep(.leaflet-control-attribution a) {
  color: inherit;
}

.iloc__canvas :deep(.iloc-pin) {
  border: 0;
  background: none;
}
.iloc__canvas :deep(.iloc-pin__halo) {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgb(243 195 0 / 0.28);
  animation: iloc-pulse 2.4s ease-out infinite;
}
.iloc__canvas :deep(.iloc-pin__dot) {
  position: absolute;
  inset: 8px;
  display: grid;
  place-items: center;
  border: 3px solid #071426;
  border-radius: 50%;
  background: var(--iloc-brand);
  color: var(--iloc-on-brand);
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.35);
}
.iloc__canvas :deep(.iloc-pin__dot .pi) {
  font-size: 0.75rem;
}
@keyframes iloc-pulse {
  0% { transform: scale(0.7); opacity: 0.9; }
  100% { transform: scale(1.5); opacity: 0; }
}

.iloc__zoom {
  position: absolute;
  z-index: 1000;
  top: 0.625rem;
  right: 0.625rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.iloc__zoom button {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid rgb(127 127 127 / 0.18);
  border-radius: 0.75rem;
  background: var(--iloc-control);
  color: var(--iloc-control-text);
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.2);
  cursor: pointer;
  transition: color 150ms ease, transform 120ms ease;
}
.iloc__zoom button:hover {
  color: var(--iloc-brand);
}
.iloc--light .iloc__zoom button:hover {
  color: #775f00;
}
.iloc__zoom button:active {
  transform: scale(0.94);
}
.iloc__zoom .pi {
  font-size: 0.8rem;
}

.iloc__empty {
  display: grid;
  place-items: center;
  gap: 0.5rem;
  height: 100%;
  margin: 0;
  padding: 1.5rem;
  color: var(--iloc-muted);
  font-size: 0.85rem;
  text-align: center;
}
.iloc__empty .pi {
  color: var(--iloc-brand);
  font-size: 1.5rem;
}

.iloc__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 0.625rem 0.75rem;
}
.iloc__btn {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.5rem;
  padding: 0 0.875rem;
  border: 1px solid var(--iloc-border);
  border-radius: 0.75rem;
  color: var(--iloc-text);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 150ms ease, transform 120ms ease;
}
.iloc__btn:hover {
  background: rgb(127 127 127 / 0.1);
}
.iloc__btn:active {
  transform: scale(0.97);
}
.iloc__btn--primary {
  border-color: var(--iloc-brand);
  background: var(--iloc-brand);
  color: var(--iloc-on-brand);
}
.iloc__btn--primary:hover {
  background: var(--app-color-brand-hover, #d9ad00);
}
.iloc__btn:focus-visible,
.iloc__zoom button:focus-visible {
  outline: 2px solid var(--iloc-brand);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .iloc__frame {
    height: min(55dvh, 18rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .iloc__canvas :deep(.iloc-pin__halo) {
    animation: none;
  }
  .iloc__btn,
  .iloc__zoom button {
    transition: none;
  }
}
</style>
