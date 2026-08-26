<template>
  <section class="dashboard-filters" aria-labelledby="dashboard-filters-title">
    <div class="dashboard-filters__summary">
      <div>
        <h2 id="dashboard-filters-title">Filtres d’analyse</h2>
        <p>{{ summary }}</p>
      </div>
      <div class="dashboard-filters__actions">
        <Button
          ref="triggerButton"
          type="button"
          icon="pi pi-filter"
          :label="filterButtonLabel"
          outlined
          :aria-expanded="dialogVisible"
          aria-controls="admin-dashboard-filter-panel"
          @click="openDialog"
        />
        <Button
          v-if="activeFilters.length"
          type="button"
          label="Réinitialiser"
          icon="pi pi-times"
          severity="secondary"
          text
          @click="$emit('reset')"
        />
      </div>
    </div>

    <div v-if="activeFilters.length" class="dashboard-filters__active" aria-label="Filtres actifs">
      <span>Actifs :</span>
      <button
        v-for="filter in activeFilters"
        :key="filter.id"
        type="button"
        :aria-label="`Supprimer le filtre ${filter.label}`"
        @click="$emit('remove', filter.key, filter.value)"
      >
        {{ filter.label }} <i class="pi pi-times" aria-hidden="true"></i>
      </button>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      header="Filtrer le dashboard"
      :draggable="false"
      :dismissable-mask="true"
      class="dashboard-filter-dialog"
      content-class="dashboard-filter-dialog__content"
      @hide="restoreTriggerFocus"
    >
      <div id="admin-dashboard-filter-panel">
        <Message v-if="error" severity="error" :closable="false">
          <div class="dashboard-filter-dialog__message">
            <span>Les options de filtres ne sont pas disponibles.</span>
            <Button type="button" label="Réessayer" size="small" @click="$emit('retry')" />
          </div>
        </Message>
        <div v-else class="dashboard-filter-grid" :aria-busy="loading">
          <div v-for="definition in visibleDefinitions" :key="definition.key" class="dashboard-filter-field">
            <label :for="`dashboard-filter-${definition.key}`">{{ definition.label }}</label>
            <MultiSelect
              :input-id="`dashboard-filter-${definition.key}`"
              v-model="draft[definition.key]"
              :options="definition.options"
              option-label="label"
              option-value="value"
              :placeholder="definition.placeholder"
              :disabled="loading"
              display="chip"
              filter
              class="w-full"
            />
            <small>{{ definition.hint }}</small>
          </div>
        </div>
      </div>

      <template #footer>
        <Button type="button" label="Annuler" severity="secondary" outlined @click="dialogVisible = false" />
        <Button
          type="button"
          label="Appliquer les filtres"
          icon="pi pi-check"
          :disabled="loading || Boolean(error)"
          @click="applyDraft"
        />
      </template>
    </Dialog>
  </section>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'

const props = defineProps({
  activeFilters: { type: Array, default: () => [] },
  catalog: { type: Object, default: null },
  error: { type: [Error, Object], default: null },
  loading: Boolean,
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['apply', 'remove', 'reset', 'retry'])
const dialogVisible = ref(false)
const triggerButton = ref(null)
const draft = reactive({})

const definitions = Object.freeze([
  { key: 'track', optionKey: 'tracks', label: 'Filière', placeholder: 'Toutes les filières', hint: 'Limite les profils aux filières sélectionnées.' },
  { key: 'role', optionKey: 'roles', label: 'Rôle ou fonction', placeholder: 'Tous les rôles', hint: 'S’applique aux indicateurs de personnes.' },
  { key: 'class', optionKey: 'classes', label: 'Classe', placeholder: 'Toutes les classes', hint: 'S’applique aux étudiants et utilisateurs.' },
  { key: 'cohort', optionKey: 'cohorts', label: 'Cohorte PFP', placeholder: 'Toutes les cohortes', hint: 'S’applique aux étudiants et utilisateurs.' },
  { key: 'pfp', optionKey: 'pfpTypes', label: 'PFP', placeholder: 'Tous les PFP', hint: 'S’applique aux places et PFP en cours.' },
  { key: 'institution', optionKey: 'institutions', label: 'Institution', placeholder: 'Toutes les institutions', hint: 'S’applique aux indicateurs PFP concernés.' },
  { key: 'status', optionKey: 'statuses', label: 'Statut PFP', placeholder: 'Tous les statuts', hint: 'S’applique aux PFP en cours.' },
])

const visibleDefinitions = computed(() => definitions
  .map((definition) => ({
    ...definition,
    options: props.catalog?.options?.[definition.optionKey] || [],
  }))
  .filter((definition) => definition.options.length))
const filterButtonLabel = computed(() => props.activeFilters.length
  ? `Filtres (${props.activeFilters.length})`
  : 'Filtres')
const summary = computed(() => props.activeFilters.length
  ? `${props.activeFilters.length} filtre${props.activeFilters.length === 1 ? '' : 's'} appliqué${props.activeFilters.length === 1 ? '' : 's'}`
  : 'Affichage global, sans filtre métier.')

function copyModelToDraft() {
  for (const definition of definitions) draft[definition.key] = [...(props.modelValue[definition.key] || [])]
}

function openDialog() {
  copyModelToDraft()
  dialogVisible.value = true
}

function applyDraft() {
  emit('apply', Object.fromEntries(
    definitions.map(({ key }) => [key, draft[key] || []]).filter(([, values]) => values.length),
  ))
  dialogVisible.value = false
}

function restoreTriggerFocus() {
  nextTick(() => triggerButton.value?.$el?.focus())
}

watch(() => props.modelValue, copyModelToDraft, { deep: true, immediate: true })
</script>

<style scoped>
.dashboard-filters{display:grid;gap:.75rem;margin-block-end:1rem;padding:1rem;border:1px solid var(--surface-border);border-radius:1rem;background:var(--surface-card)}
.dashboard-filters__summary{display:flex;align-items:center;justify-content:space-between;gap:1rem}.dashboard-filters h2{margin:0;color:var(--text-color);font-size:1rem}.dashboard-filters p{margin:.25rem 0 0;color:var(--text-color-secondary);font-size:.875rem}.dashboard-filters__actions,.dashboard-filters__active{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}.dashboard-filters__active{color:var(--text-color-secondary);font-size:.875rem}.dashboard-filters__active button{min-height:2.25rem;padding:.375rem .75rem;border:1px solid var(--surface-border);border-radius:999px;background:var(--surface-ground);color:var(--text-color);font:inherit;cursor:pointer}.dashboard-filters__active button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.dashboard-filter-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.dashboard-filter-field{display:grid;align-content:start;gap:.45rem;min-width:0}.dashboard-filter-field label{color:var(--text-color);font-weight:650}.dashboard-filter-field small{color:var(--text-color-secondary);line-height:1.4}.dashboard-filter-dialog__message{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
@media(max-width:48rem){.dashboard-filters__summary{align-items:stretch;flex-direction:column}.dashboard-filters__actions{width:100%}.dashboard-filters__actions :deep(.p-button){flex:1 1 auto}.dashboard-filter-grid{grid-template-columns:1fr}}
@media(max-width:30rem){.dashboard-filters{padding:.75rem}.dashboard-filters__actions{display:grid;grid-template-columns:1fr}.dashboard-filters__actions :deep(.p-button){width:100%}}
</style>

<style>
.dashboard-filter-dialog{width:min(52rem,calc(100vw - 2rem))}.dashboard-filter-dialog .p-dialog-content{overflow:auto}.dashboard-filter-dialog .p-dialog-footer{display:flex;justify-content:flex-end;gap:.5rem}@media(max-width:40rem){.dashboard-filter-dialog{width:100vw!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;border-radius:0!important}.dashboard-filter-dialog .p-dialog-content{flex:1}.dashboard-filter-dialog .p-dialog-footer{padding-bottom:max(1rem,env(safe-area-inset-bottom));flex-wrap:wrap}.dashboard-filter-dialog .p-dialog-footer .p-button{flex:1 1 auto}}
</style>
