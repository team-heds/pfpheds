<template>
  <Card class="stats-card">
    <!-- Header -->
    <template #header>
      <div class="stats-header">
        <div class="stats-title-section">
          <i v-if="icon" :class="icon" class="stats-icon" :style="{ color }"></i>
          <div>
            <h3 class="stats-title">{{ title }}</h3>
            <p v-if="subtitle" class="stats-subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <div class="stats-actions">
          <Button
            v-if="showChartToggle"
            :icon="showChart ? 'pi pi-eye-slash' : 'pi pi-eye'"
            @click="showChart = !showChart"
            text
            rounded
            size="small"
            v-tooltip.top="showChart ? 'Masquer graphique' : 'Afficher graphique'"
          />
        </div>
      </div>
    </template>

    <!-- Content -->
    <template #content>
      <!-- Value Display -->
      <div class="stats-value-section" v-if="showValue">
        <div class="stats-main-value" :style="{ color }">
          {{ formattedValue }}
        </div>
        <div v-if="trend !== null && trend !== undefined" class="stats-trend" :class="trendClass">
          <i :class="trendIcon"></i>
          <span>{{ Math.abs(trend) }}%</span>
          <span class="trend-label">{{ trendLabel }}</span>
        </div>
      </div>

      <!-- Chart Display -->
      <div v-if="showChart && chartData && chartData.length > 0" class="stats-chart-section">
        <ChartSelector
          :data="chartData"
          :title="chartTitle || title"
          :default-type="defaultChartType"
          :height="chartHeight"
          :chart-color="color"
          :show-refresh="showRefresh"
          @refresh="$emit('refresh')"
        />
      </div>

      <!-- Additional Info -->
      <div v-if="additionalInfo" class="stats-additional-info">
        <div
          v-for="(info, index) in additionalInfo"
          :key="index"
          class="info-item"
        >
          <span class="info-label">{{ info.label }}</span>
          <span class="info-value">{{ info.value }}</span>
        </div>
      </div>
    </template>

    <!-- Footer -->
    <template #footer v-if="$slots.footer || footerText">
      <div class="stats-footer">
        <slot name="footer">
          <span class="footer-text">{{ footerText }}</span>
        </slot>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { ref, computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import ChartSelector from './ChartSelector.vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: String,
  value: [Number, String],
  icon: String,
  color: {
    type: String,
    default: '#3b82f6'
  },
  trend: Number,
  trendLabel: {
    type: String,
    default: 'vs période précédente'
  },
  chartData: Array,
  chartTitle: String,
  defaultChartType: {
    type: String,
    default: 'pie'
  },
  chartHeight: {
    type: Number,
    default: 300
  },
  showValue: {
    type: Boolean,
    default: true
  },
  showChartToggle: {
    type: Boolean,
    default: true
  },
  showRefresh: {
    type: Boolean,
    default: false
  },
  additionalInfo: Array,
  footerText: String
})

defineEmits(['refresh'])

const showChart = ref(true)

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value || '0'
})

const trendClass = computed(() => ({
  'trend-up': props.trend > 0,
  'trend-down': props.trend < 0,
  'trend-neutral': props.trend === 0
}))

const trendIcon = computed(() => {
  if (props.trend > 0) return 'pi pi-arrow-up'
  if (props.trend < 0) return 'pi pi-arrow-down'
  return 'pi pi-minus'
})
</script>

<style scoped>
.stats-card {
  height: 100%;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  padding-bottom: 0;
}

.stats-title-section {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.stats-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.stats-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.stats-subtitle {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0.25rem 0 0 0;
}

.stats-value-section {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-main-value {
  font-size: 2.5rem;
  font-weight: bold;
  line-height: 1;
}

.stats-trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

.trend-up {
  background: var(--green-50);
  color: var(--green-600);
}

.trend-down {
  background: var(--red-50);
  color: var(--red-600);
}

.trend-neutral {
  background: var(--gray-100);
  color: var(--gray-600);
}

.trend-label {
  font-size: 0.75rem;
  opacity: 0.8;
}

.stats-chart-section {
  padding: 0 1.5rem 1rem;
}

.stats-additional-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--surface-border);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.stats-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--surface-border);
}

.footer-text {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

@media (max-width: 768px) {
  .stats-main-value {
    font-size: 2rem;
  }
  
  .stats-additional-info {
    grid-template-columns: 1fr;
  }
}
</style>
