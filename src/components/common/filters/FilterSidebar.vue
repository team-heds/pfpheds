<template>
  <section class="filter-sidebar" :aria-labelledby="`${idPrefix}-title`">
    <div class="filter-heading">
      <div>
        <h2 :id="`${idPrefix}-title`">Filtres</h2>
        <p class="result-count" role="status" aria-live="polite">
          {{ resultCount }} institution{{ resultCount === 1 ? '' : 's' }}
        </p>
      </div>
      <button type="button" class="clear-button" :disabled="!hasActiveFilters" @click="$emit('clear')">
        Réinitialiser
      </button>
    </div>

    <div class="search-field">
      <label :for="`${idPrefix}-search`">Rechercher</label>
      <span class="p-input-icon-left">
        <i class="pi pi-search" aria-hidden="true" />
        <InputText
          :id="`${idPrefix}-search`"
          :model-value="searchTerm"
          type="search"
          autocomplete="off"
          placeholder="Nom, ville, canton ou identifiant"
          @update:model-value="$emit('update:searchTerm', $event)"
        />
      </span>
    </div>

    <div v-if="activeFilterChips.length" class="active-filters" aria-label="Filtres actifs">
      <button
        v-for="chip in activeFilterChips"
        :key="`${chip.group}-${chip.value}`"
        type="button"
        class="filter-chip"
        :aria-label="`Retirer le filtre ${chip.value}`"
        @click="removeFilter(chip.group, chip.value)"
      >
        {{ chip.value }} <i class="pi pi-times" aria-hidden="true" />
      </button>
    </div>

    <div class="filter-groups">
      <fieldset class="filter-section">
        <legend>Canton</legend>
        <ul class="filter-list">
          <li v-for="canton in cantons" :key="canton" class="filter-item">
            <Checkbox :input-id="`${idPrefix}-canton-${canton}`" :value="canton" :model-value="normalizedFilters.cantons" @update:model-value="updateGroup('cantons', $event)" />
            <label :for="`${idPrefix}-canton-${canton}`">{{ canton }}</label>
          </li>
          <li v-if="cantons.length === 0" class="empty-option">Aucun canton disponible</li>
        </ul>
      </fieldset>

      <fieldset class="filter-section">
        <legend>Critères</legend>
        <ul class="filter-list">
          <li v-for="criterion in criteriaOptions" :key="criterion" class="filter-item">
            <Checkbox :input-id="`${idPrefix}-criterion-${criterion}`" :value="criterion" :model-value="normalizedFilters.criter" @update:model-value="updateGroup('criter', $event)" />
            <label :for="`${idPrefix}-criterion-${criterion}`">{{ criterion }}</label>
          </li>
        </ul>
      </fieldset>

      <fieldset class="filter-section">
        <legend>PFP</legend>
        <ul class="filter-list">
          <li v-for="pfp in pfpOptions" :key="pfp" class="filter-item">
            <Checkbox :input-id="`${idPrefix}-pfp-${pfp}`" :value="pfp" :model-value="normalizedFilters.pfp" @update:model-value="updateGroup('pfp', $event)" />
            <label :for="`${idPrefix}-pfp-${pfp}`">{{ pfp }}</label>
          </li>
        </ul>
      </fieldset>

      <fieldset class="filter-section">
        <legend>Langue</legend>
        <ul class="filter-list">
          <li v-for="language in languageOptions" :key="language" class="filter-item">
            <Checkbox :input-id="`${idPrefix}-language-${language}`" :value="language" :model-value="normalizedFilters.languages" @update:model-value="updateGroup('languages', $event)" />
            <label :for="`${idPrefix}-language-${language}`">{{ language }}</label>
          </li>
        </ul>
      </fieldset>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import { INSTITUTION_CRITERIA, INSTITUTION_LANGUAGES, INSTITUTION_PFP_TYPES, normalizeInstitutionFilters } from '@/service/institutionFiltersService'

const props = defineProps({
  cantons: { type: Array, default: () => [] },
  filters: { type: Object, default: () => ({}) },
  searchTerm: { type: String, default: '' },
  resultCount: { type: Number, default: 0 },
  idPrefix: { type: String, default: 'institution-filters' },
})

const emit = defineEmits(['update:filters', 'update:searchTerm', 'clear'])
const criteriaOptions = INSTITUTION_CRITERIA
const languageOptions = INSTITUTION_LANGUAGES
const pfpOptions = INSTITUTION_PFP_TYPES
const normalizedFilters = computed(() => normalizeInstitutionFilters(props.filters))
const activeFilterChips = computed(() => Object.entries(normalizedFilters.value).flatMap(([group, values]) => values.map((value) => ({ group, value }))))
const hasActiveFilters = computed(() => props.searchTerm.trim().length > 0 || activeFilterChips.value.length > 0)

function updateGroup(group, values) {
  emit('update:filters', { ...normalizedFilters.value, [group]: Array.isArray(values) ? values : [] })
}

function removeFilter(group, value) {
  updateGroup(group, normalizedFilters.value[group].filter((item) => item !== value))
}
</script>

<style scoped>
.filter-sidebar { display:flex; flex-direction:column; gap:1rem; min-width:0; margin-inline-end:var(--social-side-inset, 0); }
.filter-heading, .search-field, .active-filters, .filter-section { border-radius:1.2rem; background:var(--surface-card); }
.filter-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:1.25rem; }
.filter-heading h2, .filter-heading p { margin:0; }
.filter-heading h2 { color:var(--text-color); font-size:1.25rem; }
.result-count { margin-top:.25rem !important; color:var(--text-color-secondary); font-size:.875rem; }
.clear-button, .filter-chip { min-height:2.5rem; border:1px solid var(--surface-border); border-radius:999px; background:transparent; color:var(--primary-color); font:inherit; cursor:pointer; }
.clear-button { padding-inline:.875rem; }
.clear-button:disabled { cursor:default; opacity:.45; }
.clear-button:focus-visible, .filter-chip:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
.search-field { padding:1.25rem; }
.search-field label { display:block; margin-bottom:.5rem; color:var(--text-color); font-weight:600; }
.search-field .p-input-icon-left, .search-field :deep(.p-inputtext) { width:100%; }
.active-filters { display:flex; flex-wrap:wrap; gap:.5rem; padding:1rem; }
.filter-chip { min-height:2rem; padding-inline:.75rem; background:var(--surface-hover); color:var(--text-color); }
.filter-groups { display:grid; gap:1rem; }
.filter-section { min-width:0; margin:0; padding:1.25rem; border:0; }
.filter-section legend { width:100%; padding:0 0 .75rem; color:var(--text-color); font-size:1rem; font-weight:600; }
.filter-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.25rem .75rem; margin:0; padding:0; list-style:none; }
.filter-item { display:flex; align-items:center; gap:.5rem; min-height:2.5rem; }
.filter-item label { color:var(--text-color); cursor:pointer; }
.empty-option { grid-column:1/-1; color:var(--text-color-secondary); font-style:italic; }
@media (max-width:63.99rem) { .filter-sidebar { margin-inline:0; } .filter-groups { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width:38rem) { .filter-heading { align-items:stretch; flex-direction:column; } .clear-button { width:100%; } .filter-groups { grid-template-columns:1fr; } }
</style>
