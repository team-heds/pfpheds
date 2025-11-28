<template>
  <div class="period-selector">
    <div class="period-buttons">
      <Button
        v-for="option in periodOptions"
        :key="option.value"
        :label="option.label"
        :icon="option.icon"
        :class="{ 'p-button-primary': modelValue === option.value }"
        :severity="modelValue === option.value ? 'primary' : 'secondary'"
        size="small"
        outlined
        @click="selectPeriod(option.value)"
      />
    </div>

    <!-- Sélecteur personnalisé -->
    <div v-if="showCustom" class="custom-period">
      <Calendar
        v-model="customDates"
        selectionMode="range"
        :showIcon="true"
        :showButtonBar="true"
        dateFormat="dd/mm/yy"
        placeholder="Période personnalisée"
        @date-select="applyCustomPeriod"
      />
    </div>

    <!-- Info période sélectionnée -->
    <div v-if="showInfo" class="period-info">
      <i class="pi pi-info-circle"></i>
      <span>{{ periodInfo }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'month'
  },
  showCustom: {
    type: Boolean,
    default: true
  },
  showInfo: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const customDates = ref(null)

const periodOptions = [
  {
    value: 'day',
    label: 'Jour',
    icon: 'pi pi-calendar',
    description: 'Depuis hier'
  },
  {
    value: 'week',
    label: 'Semaine',
    icon: 'pi pi-calendar',
    description: 'Depuis la semaine dernière'
  },
  {
    value: 'month',
    label: 'Mois',
    icon: 'pi pi-calendar',
    description: 'Depuis le mois dernier'
  },
  {
    value: 'quarter',
    label: 'Trimestre',
    icon: 'pi pi-chart-bar',
    description: 'Depuis le trimestre dernier'
  },
  {
    value: 'year',
    label: 'Année',
    icon: 'pi pi-chart-line',
    description: 'Depuis l\'année dernière'
  }
]

const periodInfo = computed(() => {
  const option = periodOptions.find(o => o.value === props.modelValue)
  return option ? option.description : 'Période personnalisée'
})

function selectPeriod(period) {
  emit('update:modelValue', period)
  emit('change', period)
}

function applyCustomPeriod() {
  if (customDates.value && customDates.value.length === 2) {
    emit('update:modelValue', 'custom')
    emit('change', {
      type: 'custom',
      start: customDates.value[0],
      end: customDates.value[1]
    })
  }
}
</script>

<style scoped>
.period-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.period-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.period-buttons :deep(.p-button) {
  transition: all 0.3s ease;
}

.period-buttons :deep(.p-button:hover) {
  transform: translateY(-2px);
}

.period-buttons :deep(.p-button-primary) {
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(var(--primary-color-rgb), 0.2);
}

.custom-period {
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.period-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--blue-50);
  border-left: 4px solid var(--blue-500);
  border-radius: 6px;
  font-size: 0.9rem;
  color: var(--blue-700);
}

.period-info i {
  font-size: 1.2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .period-buttons {
    flex-direction: column;
  }

  .period-buttons :deep(.p-button) {
    width: 100%;
    justify-content: center;
  }
}
</style>
