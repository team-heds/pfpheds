<template>
  <div class="table-toolbar" role="search" :aria-label="label">
    <div class="table-toolbar__primary"><slot name="primary" /></div>
    <label class="table-toolbar__search">
      <span class="sr-only">Rechercher</span>
      <i class="pi pi-search" aria-hidden="true"></i>
      <input :value="query" type="search" :placeholder="placeholder" @input="$emit('update:query', $event.target.value)" />
    </label>
    <div class="table-toolbar__meta" role="status">{{ resultCount }} résultat{{ resultCount === 1 ? '' : 's' }}</div>
    <div class="table-toolbar__tools"><slot name="tools" /></div>
  </div>
  <div v-if="activeFilters.length" class="active-filters" aria-label="Filtres actifs">
    <span>Filtres :</span>
    <button v-for="filter in activeFilters" :key="filter.key" type="button" @click="$emit('remove-filter', filter.key)">
      {{ filter.label }} <i class="pi pi-times" aria-hidden="true"></i>
    </button>
    <button type="button" class="active-filters__clear" @click="$emit('clear-filters')">Tout effacer</button>
  </div>
</template>

<script setup>
defineProps({
  activeFilters: { type: Array, default: () => [] },
  label: { type: String, default: 'Outils du tableau' },
  placeholder: { type: String, default: 'Rechercher…' },
  query: { type: String, default: '' },
  resultCount: { type: Number, default: 0 },
})
defineEmits(['update:query', 'remove-filter', 'clear-filters'])
</script>

<style scoped>
.table-toolbar{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;padding:.875rem;border:1px solid var(--surface-border);border-radius:1rem;background:var(--surface-card)}.table-toolbar__primary,.table-toolbar__tools{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}.table-toolbar__tools{margin-inline-start:auto}.table-toolbar__search{position:relative;display:flex;align-items:center;min-width:min(100%,18rem);flex:1}.table-toolbar__search i{position:absolute;inset-inline-start:.75rem;color:var(--text-color-secondary)}.table-toolbar__search input{width:100%;min-height:44px;padding:.625rem .75rem .625rem 2.25rem;border:1px solid var(--surface-border);border-radius:.75rem;background:var(--surface-ground);color:var(--text-color);font:inherit}.table-toolbar__search input:focus-visible{outline:2px solid var(--primary-color);outline-offset:1px}.table-toolbar__meta{color:var(--text-color-secondary);font-size:.875rem;white-space:nowrap}.active-filters{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-top:.75rem;color:var(--text-color-secondary);font-size:.875rem}.active-filters button{min-height:2rem;padding:.25rem .625rem;border:1px solid var(--surface-border);border-radius:999px;background:var(--surface-card);color:var(--text-color);font:inherit;cursor:pointer}.active-filters button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.active-filters .active-filters__clear{border-color:transparent;color:var(--primary-color);background:transparent}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:640px){.table-toolbar{padding:.75rem}.table-toolbar__primary,.table-toolbar__search,.table-toolbar__tools{width:100%}.table-toolbar__tools{margin:0}.table-toolbar__meta{order:4}.table-toolbar__primary :deep(.p-button),.table-toolbar__tools :deep(.p-button){flex:1 1 auto}.active-filters{align-items:flex-start}.active-filters>span{width:100%}}
</style>
