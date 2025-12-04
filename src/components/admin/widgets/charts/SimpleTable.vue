<template>
  <div class="simple-table-wrapper" :style="{ height: height + 'px' }">
    <div class="simple-table-scroll">
      <table class="simple-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in data" :key="idx">
            <td v-for="col in columns" :key="col">
              {{ row[col.toLowerCase()] || row[col] || '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  height: {
    type: Number,
    default: 200
  },
  color: {
    type: String,
    default: '#3b82f6'
  }
})

// Extraire les colonnes des données
const columns = computed(() => {
  if (!props.data || props.data.length === 0) return []
  
  const firstItem = props.data[0]
  return Object.keys(firstItem)
    .map(key => key.charAt(0).toUpperCase() + key.slice(1))
})
</script>

<style scoped>
.simple-table-wrapper {
  overflow: hidden;
  border-radius: 8px;
  background: var(--surface-ground);
}

.simple-table-scroll {
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.simple-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.simple-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--surface-100);
}

.simple-table th {
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--text-color);
  border-bottom: 2px solid var(--surface-border);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.simple-table td {
  padding: 8px 12px;
  color: var(--text-color-secondary);
  border-bottom: 1px solid var(--surface-border);
}

.simple-table tbody tr {
  transition: background-color 0.2s;
}

.simple-table tbody tr:hover {
  background: var(--surface-hover);
}

.simple-table tbody tr:last-child td {
  border-bottom: none;
}

/* Scrollbar styling */
.simple-table-scroll::-webkit-scrollbar {
  width: 6px;
}

.simple-table-scroll::-webkit-scrollbar-track {
  background: var(--surface-ground);
}

.simple-table-scroll::-webkit-scrollbar-thumb {
  background: var(--surface-400);
  border-radius: 3px;
}

.simple-table-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--surface-500);
}
</style>
