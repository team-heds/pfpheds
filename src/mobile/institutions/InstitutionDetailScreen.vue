<template>
  <article class="m-fiche">
    <div v-if="failed" class="m-state" role="alert">
      <span class="m-state__icon" aria-hidden="true"><MIcon name="alert" /></span>
      <p class="m-state__title">Cette institution ne se charge pas</p>
      <p class="m-state__text">Vérifie ta connexion, puis réessaie.</p>
      <button type="button" class="m-ghost-button" @click="load">Réessayer</button>
    </div>

    <template v-else>
      <div class="m-fiche__hero">
        <img v-if="institution" :src="image" alt="" @error="showInstitutionPlaceholder" />
        <span v-else class="m-skeleton m-fiche__hero-skeleton" aria-hidden="true"></span>
      </div>

      <div class="m-fiche__body">
        <header class="m-fiche__head">
          <h1 class="m-fiche__name">
            <template v-if="institution">{{ institution.Name }}</template>
            <span v-else class="m-skeleton m-fiche__name-skeleton" aria-hidden="true"></span>
          </h1>
          <p v-if="institution" class="m-fiche__place">
            <MIcon name="pin" />
            <span>{{ addressLine || 'Adresse non précisée' }}</span>
          </p>
          <div v-if="institution && headTags.length" class="m-fiche__tags">
            <span v-for="tag in headTags" :key="tag">{{ tag }}</span>
          </div>
        </header>

        <div v-if="institution" class="m-fiche__actions">
          <a v-if="directions" :href="directions" target="_blank" rel="noopener noreferrer" class="m-cta m-fiche__action">
            <MIcon name="nav" />
            Itinéraire
          </a>
          <a v-if="website" :href="website" target="_blank" rel="noopener noreferrer" class="m-ghost-button m-fiche__action">
            <MIcon name="globe" />
            Site web
          </a>
        </div>
        <button v-if="institution && onMap" type="button" class="m-row-link" @click="showOnMap">
          <span class="m-row-link__icon" aria-hidden="true"><MIcon name="map" /></span>
          <span class="m-row-link__text"><span>Voir sur la carte</span></span>
          <MIcon name="next" />
        </button>

        <section v-if="hasOffer" class="m-fiche__card" aria-labelledby="m-fiche-offre">
          <h2 id="m-fiche-offre" class="m-fiche__title">Ce que propose l’institution</h2>
          <dl class="m-fiche__offer">
            <template v-if="offer.pfp.length">
              <dt>Stages</dt>
              <dd><span v-for="item in offer.pfp" :key="item" class="m-fiche__pill m-fiche__pill--accent">{{ item }}</span></dd>
            </template>
            <template v-if="offer.criteria.length">
              <dt>Domaines</dt>
              <dd>
                <span v-for="item in offer.criteria" :key="item" class="m-fiche__pill">
                  {{ item }}<small v-if="CRITERIA_LABELS[item]"> · {{ CRITERIA_LABELS[item] }}</small>
                </span>
              </dd>
            </template>
            <template v-if="offer.languages.length">
              <dt>Langues</dt>
              <dd><span v-for="item in offer.languages" :key="item" class="m-fiche__pill">{{ LANGUAGE_LABELS[item] || item }}</span></dd>
            </template>
          </dl>
        </section>

        <section v-if="institution?.Description" class="m-fiche__card" aria-labelledby="m-fiche-description">
          <h2 id="m-fiche-description" class="m-fiche__title">Description</h2>
          <p ref="descriptionRef" class="m-fiche__text" :class="{ 'is-clamped': !descriptionOpen }">{{ institution.Description }}</p>
          <button v-if="descriptionLong" type="button" class="m-fiche__more" :aria-expanded="descriptionOpen ? 'true' : 'false'" @click="descriptionOpen = !descriptionOpen">
            {{ descriptionOpen ? 'Voir moins' : 'Voir plus' }}
          </button>
        </section>

        <section v-if="hasContact" class="m-fiche__card" aria-labelledby="m-fiche-contact">
          <h2 id="m-fiche-contact" class="m-fiche__title">Responsable physio</h2>
          <p v-if="institution.NomChef" class="m-fiche__contact-name">{{ institution.NomChef }}</p>
          <div class="m-fiche__rows">
            <a v-if="institution.MailChef" :href="`mailto:${institution.MailChef}`" class="m-row-link">
              <span class="m-row-link__icon" aria-hidden="true"><MIcon name="mail" /></span>
              <span class="m-row-link__text"><span>Écrire un e-mail</span><small>{{ institution.MailChef }}</small></span>
              <MIcon name="next" />
            </a>
            <a v-if="institution.PhoneChef" :href="`tel:${institution.PhoneChef}`" class="m-row-link">
              <span class="m-row-link__icon" aria-hidden="true"><MIcon name="phone" /></span>
              <span class="m-row-link__text"><span>Appeler</span><small>{{ institution.PhoneChef }}</small></span>
              <MIcon name="next" />
            </a>
          </div>
        </section>

        <section v-if="institution" class="m-fiche__card" aria-labelledby="m-fiche-documents">
          <h2 id="m-fiche-documents" class="m-fiche__title">Documents</h2>
          <p v-if="loadingPlaces" class="m-fiche__muted" role="status">Chargement des documents…</p>
          <p v-else-if="!files.length" class="m-fiche__muted">Aucun document pour cette institution.</p>
          <div v-else class="m-fiche__rows">
            <button v-for="file in files" :key="file.url" type="button" class="m-row-link" :disabled="opening === file.url" @click="openFile(file)">
              <span class="m-row-link__icon" aria-hidden="true"><MIcon name="file" /></span>
              <span class="m-row-link__text">
                <span>{{ file.name }}</span>
                <small v-if="file.isGlobal">Document commun à l’institution</small>
              </span>
              <span v-if="opening === file.url" class="m-spinner" aria-hidden="true"></span>
              <MIcon v-else name="next" />
            </button>
          </div>
        </section>
      </div>
    </template>
  </article>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import MIcon from '@/mobile/ui/MIcon.vue'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePlacesStore } from '@/stores/placesStore'
import { openPfpDocument } from '@/service/pfpDocumentMediaService'
import { institutionImageOf, showInstitutionPlaceholder } from '@/utils/institutionImage'
import { useMobileMapStore } from '@/mobile/map/mobileMapStore'
import { institutionKey, institutionLatLng } from '@/mobile/map/mapHelpers'
import {
  CRITERIA_LABELS,
  LANGUAGE_LABELS,
  buildInstitutionFiles,
  directionsUrl,
  formatWebsiteUrl,
  languageLabel,
  summarizeOffer,
} from '@/mobile/institutions/institutionHelpers'

const route = useRoute()
const router = useRouter()
const mapStore = useMobileMapStore()
const toast = useToast()
const institutionsStore = useInstitutionsStore()
const placesStore = usePlacesStore()

// L'écran reste en mémoire : il garde l'institution de l'adresse où il a été ouvert.
const institutionId = route.params.id
const institution = ref(null)
const places = ref([])
const failed = ref(false)
const loadingPlaces = ref(true)
const opening = ref(null)

const image = computed(() => institutionImageOf(institution.value))
const addressLine = computed(() => [institution.value?.Address, institution.value?.Locality].filter(Boolean).join(', '))
const headTags = computed(() => [institution.value?.Canton, languageLabel(institution.value?.Language)].filter(Boolean))
const website = computed(() => formatWebsiteUrl(institution.value?.URL))
const directions = computed(() => directionsUrl(institution.value))
const offer = computed(() => summarizeOffer(places.value))
const hasOffer = computed(() => offer.value.pfp.length || offer.value.criteria.length || offer.value.languages.length)
const hasContact = computed(() => Boolean(institution.value?.NomChef || institution.value?.MailChef || institution.value?.PhoneChef))
const files = computed(() => buildInstitutionFiles(institution.value, places.value))
const onMap = computed(() => Boolean(institutionLatLng(institution.value)))

function showOnMap() {
  mapStore.focus(institutionKey(institution.value))
  router.push('/map')
}

// Description longue : repliée, avec « Voir plus ».
const descriptionRef = ref(null)
const descriptionOpen = ref(false)
const descriptionLong = ref(false)
watch(institution, async () => {
  await nextTick()
  const el = descriptionRef.value
  descriptionLong.value = Boolean(el && el.scrollHeight > el.clientHeight + 2)
})

async function load() {
  failed.value = false
  loadingPlaces.value = true
  try {
    // Affichage immédiat si la liste est déjà chargée, puis données à jour.
    institution.value = institutionsStore.getInstitutionById(institutionId) || institution.value
    const fresh = await institutionsStore.fetchInstitutionById(institutionId)
    if (!fresh && !institution.value) throw new Error('Institution introuvable')
    if (fresh) institution.value = fresh
  } catch (error) {
    console.error('[Institution] Chargement impossible:', error)
    if (!institution.value) failed.value = true
  }
  try {
    const id = institution.value?.InstitutionId ?? institution.value?.id ?? institutionId
    places.value = (await placesStore.fetchPlacesByInstitution(id)) || []
  } catch (error) {
    console.warn('[Institution] Places indisponibles:', error)
  } finally {
    loadingPlaces.value = false
  }
}

async function openFile(file) {
  opening.value = file.url
  try {
    await openPfpDocument(file.url)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Document indisponible', detail: error?.message || 'Le document n’a pas pu être ouvert.', life: 4000 })
  } finally {
    opening.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.m-fiche {
  min-height: 100%;
  background: var(--m-bg);
  color: var(--m-fg);
}
.m-fiche__hero {
  height: 200px;
  background: var(--m-raised);
}
.m-fiche__hero img,
.m-fiche__hero-skeleton {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.m-fiche__body {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: -20px;
  padding: 18px 16px calc(28px + env(safe-area-inset-bottom, 0px));
  border-radius: 22px 22px 0 0;
  background: var(--m-bg);
}
.m-fiche__head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.m-fiche__name {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.25;
  outline: none;
}
.m-fiche__name-skeleton {
  display: block;
  width: 70%;
  height: 24px;
  border-radius: 8px;
}
.m-fiche__place {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  color: var(--m-muted);
  font-size: 0.875rem;
  line-height: 1.4;
}
.m-fiche__place :deep(.m-icon) {
  width: 16px;
  height: 16px;
  margin-top: 2px;
}
.m-fiche__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.m-fiche__tags span {
  padding: 3px 10px;
  border-radius: 99px;
  background: var(--m-surface);
  color: var(--m-muted);
  font-size: 0.75rem;
  font-weight: 500;
}
.m-fiche__actions {
  display: flex;
  gap: 10px;
}
.m-fiche__action {
  flex: 1;
  width: auto;
  text-decoration: none;
}
.m-fiche__action :deep(.m-icon) {
  width: 18px;
  height: 18px;
}
.m-fiche__card {
  padding: 14px;
  border-radius: 18px;
  background: var(--m-surface);
}
.m-fiche__title {
  margin: 0 0 10px;
  font-size: 0.9375rem;
  font-weight: 600;
}
.m-fiche__offer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
}
.m-fiche__offer dt {
  margin-top: 4px;
  color: var(--m-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.m-fiche__offer dd {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
}
.m-fiche__pill {
  padding: 4px 11px;
  border-radius: 99px;
  background: var(--m-raised);
  font-size: 0.8125rem;
  font-weight: 500;
}
.m-fiche__pill small {
  color: var(--m-muted);
  font-size: 0.75rem;
  font-weight: 400;
}
.m-fiche__pill--accent {
  background: var(--m-accent);
  color: var(--m-on-accent);
  font-weight: 600;
}
.m-fiche__text {
  margin: 0;
  color: var(--m-fg);
  font-size: 0.9375rem;
  line-height: 1.55;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.m-fiche__text.is-clamped {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
  line-clamp: 6;
}
.m-fiche__more {
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--m-muted);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
}
.m-fiche__contact-name {
  margin: 0 0 8px;
  font-size: 0.9375rem;
}
.m-fiche__rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.m-fiche__rows .m-row-link {
  background: var(--m-raised);
}
.m-fiche__muted {
  margin: 0;
  color: var(--m-muted);
  font-size: 0.875rem;
}
</style>
