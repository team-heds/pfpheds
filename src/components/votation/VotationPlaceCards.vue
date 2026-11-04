<template>
  <div class="place-card-list">
    <article
      v-for="place in places"
      :key="placeKey(place)"
      class="place-card"
    >
      <div class="place-heading">
        <span class="place-icon" aria-hidden="true"><i class="pi pi-building"></i></span>
        <div>
          <a v-if="place.url" :href="place.url" target="_blank" rel="noopener noreferrer">
            {{ place.InstitutionName || 'Institution non précisée' }}
            <span class="sr-only">(ouvre un nouvel onglet)</span>
          </a>
          <strong v-else>{{ place.InstitutionName || 'Institution non précisée' }}</strong>
          <h3>{{ place.NomPlace || 'Place sans intitulé' }}</h3>
          <p v-if="place.InstitutionCategory">{{ place.InstitutionCategory }}</p>
        </div>
      </div>

      <div v-if="criteriaFor(place).length" class="place-criteria" aria-label="Critères validés">
        <span
          v-for="criterion in criteriaFor(place)"
          :key="criterion"
          :class="{ 'criterion-missing': missingCriteria.includes(criterion) }"
        >{{ criterion }}</span>
      </div>

      <div class="rank-heading">
        <strong>Classer cette place</strong>
        <small v-if="voteTotal(place) > 0">{{ voteTotal(place) }} vote{{ voteTotal(place) > 1 ? 's' : '' }}</small>
      </div>
      <div class="rank-buttons" role="group" :aria-label="`Rang pour ${place.NomPlace || 'cette place'}`">
        <button
          v-for="rank in 5"
          :key="rank"
          type="button"
          :class="{ selected: isSelected(place, rank - 1) }"
          :disabled="adminPreview || isDisabled(place, rank - 1)"
          :aria-pressed="isSelected(place, rank - 1)"
          :aria-label="`Choix ${rank} pour ${place.NomPlace || 'cette place'}`"
          @click="$emit('select', { place, choiceIndex: rank - 1 })"
        >
          <span>{{ rank }}</span>
          <small>choix</small>
        </button>
      </div>
    </article>
  </div>
</template>

<script setup>
const props = defineProps({
  places: { type: Array, default: () => [] },
  selectedPlaces: { type: Array, default: () => [] },
  votesAggregation: { type: Object, default: () => ({}) },
  missingCriteria: { type: Array, default: () => [] },
  adminPreview: { type: Boolean, default: false }
})

defineEmits(['select'])

const criteriaKeys = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']
const normalize = (value) => String(value || '').trim().toLowerCase()
const samePlace = (left, right) => Boolean(left && right && (
  (left.PlaceId && right.PlaceId && left.PlaceId === right.PlaceId && left.seatIndex === right.seatIndex) ||
  (left.InstitutionId === right.InstitutionId && normalize(left.NomPlace) === normalize(right.NomPlace))
))

const placeKey = (place) => `${place.PlaceId || place.InstitutionId || place.NomPlace}-${place.seatIndex ?? 0}`
const criteriaFor = (place) => criteriaKeys.filter((criterion) => Boolean(place?.[criterion]))
const voteTotal = (place) => Number(props.votesAggregation?.[place.PlaceId]?.total || 0)
const isSelected = (place, choiceIndex) => samePlace(props.selectedPlaces[choiceIndex], place)
const isDisabled = (place, choiceIndex) => props.selectedPlaces.some((selected, index) => (
  index !== choiceIndex && selected && (
    (selected.PlaceId && place.PlaceId && selected.PlaceId === place.PlaceId) ||
    (selected.InstitutionId === place.InstitutionId && normalize(selected.NomPlace) === normalize(place.NomPlace))
  )
))
</script>

<style scoped>
.place-card-list { display: grid; gap: .85rem; }
.place-card { padding: 1rem; border-radius: 14px; background: var(--surface-card, #071426); box-shadow: 0 12px 30px rgba(0,0,0,.16); }
.place-heading { display: grid; grid-template-columns: 44px minmax(0,1fr); gap: .8rem; align-items: start; }
.place-icon { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 12px; color: #071426; background: #ffd400; }
.place-heading a, .place-heading strong { display: inline-flex; min-height: 44px; align-items: center; color: #ffd400; font-weight: 700; line-height: 1.3; }
.place-heading h3 { margin: -.25rem 0 .2rem; color: var(--text-color, #f8fafc); font-size: 1.05rem; line-height: 1.35; overflow-wrap: anywhere; }
.place-heading p { margin: 0; color: var(--text-color-secondary, #b7c2d4); font-size: .85rem; }
.place-criteria { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .9rem; }
.place-criteria span { padding: .3rem .5rem; border-radius: 7px; color: #ccebd8; background: rgba(34,197,94,.14); font-size: .76rem; font-weight: 800; }
.place-criteria .criterion-missing { color: #fff0c2; background: rgba(245,158,11,.2); outline: 1px solid rgba(245,158,11,.5); }
.rank-heading { display: flex; justify-content: space-between; gap: .8rem; margin: 1rem 0 .55rem; color: var(--text-color, #f8fafc); font-size: .85rem; }
.rank-heading small { color: var(--text-color-secondary, #b7c2d4); }
.rank-buttons { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: .4rem; }
.rank-buttons button { min-width: 0; min-height: 52px; padding: .35rem .15rem; border: 1px solid var(--surface-border, #334155); border-radius: 10px; color: var(--text-color, #f8fafc); background: color-mix(in srgb, var(--surface-card, #071426) 88%, white); font: inherit; cursor: pointer; }
.rank-buttons button span, .rank-buttons button small { display: block; }
.rank-buttons button span { font-size: 1rem; font-weight: 800; }
.rank-buttons button small { margin-top: .1rem; font-size: .65rem; }
.rank-buttons button.selected { border-color: #ffd400; color: #071426; background: #ffd400; }
.rank-buttons button:disabled:not(.selected) { cursor: not-allowed; opacity: .35; }
.rank-buttons button:focus-visible, .place-heading a:focus-visible { outline: 3px solid #ffd400; outline-offset: 2px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
</style>
