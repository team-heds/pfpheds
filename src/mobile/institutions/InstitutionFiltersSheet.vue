<template>
  <BottomSheet title="Filtres" tall @close="emit('close')">
    <section v-for="group in groups" :key="group.key" class="m-filters__group" role="group" :aria-labelledby="`m-filters-${group.key}`">
      <h3 :id="`m-filters-${group.key}`" class="m-filters__title">{{ group.label }}</h3>
      <div class="m-filters__options">
        <button
          v-for="option in group.options"
          :key="option.value"
          type="button"
          class="m-filters__option"
          :aria-pressed="isSelected(group.key, option.value) ? 'true' : 'false'"
          @click="state.toggle(group.key, option.value)"
        >
          <MIcon v-if="isSelected(group.key, option.value)" name="check" />
          <span>{{ option.label }}</span>
          <span v-if="option.hint" class="m-filters__hint">{{ option.hint }}</span>
        </button>
      </div>
    </section>

    <template #footer>
      <div class="m-filters__footer">
        <button type="button" class="m-ghost-button" :disabled="!count" @click="state.clearFilters()">Effacer</button>
        <button type="button" class="m-cta" @click="emit('close')">{{ resultLabel }}</button>
      </div>
    </template>
  </BottomSheet>
</template>

<script setup>
import { computed } from 'vue'
import BottomSheet from '@/mobile/ui/BottomSheet.vue'
import MIcon from '@/mobile/ui/MIcon.vue'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePlacesStore } from '@/stores/placesStore'
import { filterInstitutions, getAvailableCantons } from '@/service/institutionFiltersService'
import { useMobileInstitutionsStore } from '@/mobile/institutions/mobileInstitutionsStore'
import { buildFilterGroups, countActiveFilters } from '@/mobile/institutions/institutionHelpers'

const emit = defineEmits(['close'])

const state = useMobileInstitutionsStore()
const institutionsStore = useInstitutionsStore()
const placesStore = usePlacesStore()

const groups = computed(() => buildFilterGroups(getAvailableCantons(institutionsStore.institutions || []))
  .filter((group) => group.options.length))
const count = computed(() => countActiveFilters(state.filters))
const isSelected = (group, value) => (state.filters[group] || []).includes(value)

// Le bouton annonce le résultat avant même de fermer le panneau.
const resultLabel = computed(() => {
  const total = filterInstitutions({
    institutions: institutionsStore.institutions || [],
    places: placesStore.places || [],
    filters: state.filters,
    searchTerm: state.searchTerm,
  }).length
  if (!total) return 'Aucune institution'
  return `Voir ${total} institution${total > 1 ? 's' : ''}`
})
</script>

<style scoped>
.m-filters__group + .m-filters__group {
  margin-top: 18px;
}
.m-filters__title {
  margin: 0 0 10px;
  color: var(--m-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.m-filters__options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.m-filters__option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--m-line);
  border-radius: 99px;
  background: var(--m-raised);
  color: var(--m-fg);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  touch-action: manipulation;
}
.m-filters__option[aria-pressed='true'] {
  border-color: var(--m-accent);
  background: var(--m-accent);
  color: var(--m-on-accent);
  font-weight: 600;
}
.m-filters__option :deep(.m-icon) {
  width: 16px;
  height: 16px;
  stroke-width: 2.4;
}
.m-filters__hint {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.75;
}
.m-filters__option:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-filters__footer {
  display: flex;
  gap: 10px;
}
.m-filters__footer .m-ghost-button {
  flex-shrink: 0;
}
.m-filters__footer .m-ghost-button:disabled {
  opacity: 0.45;
}
</style>
