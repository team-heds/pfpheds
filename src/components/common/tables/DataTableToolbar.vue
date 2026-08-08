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
.table-toolbar{display:flex;align-items:center;gap:var(--app-space-3);flex-wrap:wrap;padding:var(--app-space-3);border:1px solid var(--app-color-border);border-radius:var(--app-radius-xl);background:var(--app-color-surface)}.table-toolbar__primary,.table-toolbar__tools{display:flex;align-items:center;gap:var(--app-space-2);flex-wrap:wrap}.table-toolbar__tools{margin-inline-start:auto}.table-toolbar__search{position:relative;display:flex;align-items:center;min-width:min(100%,18rem);flex:1}.table-toolbar__search i{position:absolute;inset-inline-start:var(--app-space-3);color:var(--app-color-text-muted)}.table-toolbar__search input{width:100%;min-height:var(--app-touch-target);padding:var(--app-control-padding-block) var(--app-space-3) var(--app-control-padding-block) 2.25rem;border:1px solid var(--app-color-border);border-radius:var(--app-control-radius);background:var(--app-color-page);color:var(--app-color-text);font:inherit}.table-toolbar__search input:focus-visible{outline:max(2px,.1875rem) solid var(--app-color-focus);outline-offset:var(--app-space-1)}.table-toolbar__meta{color:var(--app-color-text-muted);font-size:var(--app-font-size-sm);white-space:nowrap}.active-filters{display:flex;align-items:center;gap:var(--app-space-2);flex-wrap:wrap;margin-block-start:var(--app-space-3);color:var(--app-color-text-muted);font-size:var(--app-font-size-sm)}.active-filters button{min-height:var(--app-control-height-sm);padding:var(--app-space-1) var(--app-space-3);border:1px solid var(--app-color-border);border-radius:var(--app-radius-pill);background:var(--app-color-surface);color:var(--app-color-text);font:inherit;cursor:pointer}.active-filters button:hover{background:var(--app-color-hover)}.active-filters button:focus-visible{outline:max(2px,.1875rem) solid var(--app-color-focus);outline-offset:var(--app-space-1)}.active-filters .active-filters__clear{border-color:transparent;color:var(--app-color-text);background:transparent;text-decoration:underline;text-underline-offset:.2em}@media(max-width:64rem){.table-toolbar__tools{width:100%;margin:0}}@media(max-width:40rem){.table-toolbar{align-items:stretch;padding:var(--app-space-3)}.table-toolbar__primary,.table-toolbar__search,.table-toolbar__tools{width:100%}.table-toolbar__meta{order:4}.table-toolbar__primary :deep(.p-button),.table-toolbar__tools :deep(.p-button){flex:1 1 auto;min-height:var(--app-touch-target)}.active-filters{align-items:flex-start}.active-filters>span{width:100%}.active-filters button{min-height:var(--app-touch-target)}}
</style>
