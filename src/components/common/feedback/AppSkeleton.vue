<template>
  <div class="app-skeleton" role="status" aria-live="polite" :style="{ '--cols': cols }">
    <template v-if="variant === 'table'">
      <div class="table-skeleton">
        <div class="thead">
          <Skeleton v-for="i in cols" :key="'h' + i" height="1.25rem" width="100%" class="th" />
        </div>
        <div class="tbody">
          <div class="tr" v-for="r in rows" :key="'r' + r">
            <Skeleton v-for="c in cols" :key="'c' + r + '-' + c" height="1rem" width="100%" class="td" />
          </div>
        </div>
      </div>
    </template>
    <template v-else-if="variant === 'list'">
      <div class="list-skeleton">
        <div class="li" v-for="r in rows" :key="'li' + r">
          <Skeleton height="1rem" width="60%" />
        </div>
      </div>
    </template>
    <template v-else>
      <Skeleton height="2rem" width="100%" />
    </template>
  </div>
</template>

<script setup>
import Skeleton from 'primevue/skeleton'

const props = defineProps({
  variant: { type: String, default: 'table' },
  rows: { type: Number, default: 8 },
  cols: { type: Number, default: 6 }
})
</script>

<style scoped>
.app-skeleton {
  display: block;
}

.table-skeleton {
  display: grid;
  gap: var(--space-3, .75rem);
}

.thead {
  display: grid;
  grid-template-columns: repeat(var(--cols, 6), minmax(0, 1fr));
  gap: var(--space-3, .75rem);
}

.tbody {
  display: grid;
  gap: var(--space-2, .5rem);
}

.tr {
  display: grid;
  grid-template-columns: repeat(var(--cols, 6), minmax(0, 1fr));
  gap: var(--space-3, .75rem);
}

.th, .td { border-radius: var(--radius-sm, 8px); }

.list-skeleton {
  display: grid;
  gap: var(--space-2, .5rem);
}
</style>
