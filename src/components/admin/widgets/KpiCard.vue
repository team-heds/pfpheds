<template>
  <div 
    class="kpi-card" 
    :class="[
      `kpi-${variant}`, 
      `kpi-size-${size}`,
      { 'kpi-loading': loading, 'kpi-clickable': clickable }
    ]"
    :style="{ borderLeftColor: color }"
    @click="clickable && $emit('action')"
  >
    <Skeleton v-if="loading" height="140px" borderRadius="12px" />
    
    <template v-else>
      <!-- Header avec icône et label -->
      <div class="kpi-header">
        <div class="kpi-icon" :style="{ background: `${color}15`, color }">
          <i :class="icon" class="text-xl"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">{{ label }}</span>
          <span v-if="subtitle" class="kpi-subtitle">{{ subtitle }}</span>
        </div>
      </div>

      <!-- Valeur principale avec animation -->
      <div class="kpi-value-section">
        <div class="kpi-value" :class="{ 'animate-value': animated }">
          {{ formattedValue }}
        </div>
        
        <!-- Tendance optionnelle -->
        <div v-if="trend !== null && trend !== undefined" class="kpi-trend" :class="trendClass">
          <i :class="trendIcon"></i>
          <span>{{ Math.abs(trend) }}%</span>
        </div>
      </div>

      <!-- Mini chart optionnel -->
      <MiniChart 
        v-if="showChart && chartData && chartData.length" 
        :data="chartData" 
        :color="color"
        :height="40"
      />

      <!-- Footer avec comparaison -->
      <div v-if="comparison || clickable" class="kpi-footer">
        <span v-if="comparison" class="kpi-compare">{{ comparison }}</span>
        <Button 
          v-if="clickable && actionLabel" 
          :label="actionLabel" 
          text 
          size="small"
          @click.stop="$emit('action')"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Skeleton from 'primevue/skeleton'
import Button from 'primevue/button'
import MiniChart from './MiniChart.vue'

const props = defineProps({
  label: { type: String, required: true },
  subtitle: String,
  value: [Number, String],
  icon: { type: String, required: true },
  color: { type: String, default: '#3b82f6' },
  trend: Number, // +12 ou -5
  comparison: String,
  chartData: Array,
  showChart: { type: Boolean, default: false },
  animated: { type: Boolean, default: true },
  clickable: { type: Boolean, default: false },
  actionLabel: String,
  variant: { type: String, default: 'default' }, // default, compact, large
  size: { type: String, default: 'medium' }, // compact, small, medium, large, xlarge
  loading: { type: Boolean, default: false }
})

defineEmits(['action'])

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
.kpi-card {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.25rem;
  border-left: 4px solid var(--primary-color);
  transition: all 0.3s ease;
  height: 100%;
  min-height: 100%; /* S'assurer de prendre toute la hauteur */
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.kpi-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-2px) scale(1.01);
}

.kpi-clickable {
  cursor: pointer;
}

.kpi-clickable:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}

.kpi-clickable:active {
  transform: translateY(-2px) scale(0.99);
  transition: transform 0.1s ease;
}

.kpi-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.kpi-card:hover .kpi-icon {
  transform: scale(1.05);
}

.kpi-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.kpi-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-color);
  line-height: 1.3;
}

.kpi-subtitle {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  line-height: 1.2;
}

.kpi-value-section {
  display: flex;
  align-items: center; /* Centrer verticalement */
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.25rem;
  flex: 1; /* Prendre l'espace disponible pour centrer le contenu */
}

.kpi-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
  letter-spacing: -0.02em;
}

.animate-value {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.trend-up {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.trend-down {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.trend-neutral {
  background: rgba(156, 163, 175, 0.1);
  color: #9ca3af;
}

.kpi-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--surface-border);
}

.kpi-compare {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

/* Variants */
.kpi-compact {
  padding: 0.75rem;
}

.kpi-compact .kpi-value {
  font-size: 1.5rem;
}

.kpi-compact .kpi-icon {
  width: 36px;
  height: 36px;
}

.kpi-large {
  padding: 2rem;
}

.kpi-large .kpi-value {
  font-size: 3rem;
}

.kpi-large .kpi-icon {
  width: 64px;
  height: 64px;
}

/* Sizes - Adaptation selon taille du conteneur */
.kpi-size-compact .kpi-value {
  font-size: 1.25rem;
}

.kpi-size-compact .kpi-icon {
  width: 32px;
  height: 32px;
}

.kpi-size-compact .kpi-header {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.kpi-size-compact .kpi-label {
  font-size: 0.75rem;
}

.kpi-size-small .kpi-value {
  font-size: 1.5rem;
}

.kpi-size-small .kpi-icon {
  width: 40px;
  height: 40px;
}

.kpi-size-medium .kpi-value {
  font-size: 2rem;
}

.kpi-size-large .kpi-value {
  font-size: 2.5rem;
}

.kpi-size-large .kpi-icon {
  width: 56px;
  height: 56px;
}

.kpi-size-xlarge {
  padding: 2rem;
}

.kpi-size-xlarge .kpi-value {
  font-size: 3.5rem;
  font-weight: 800;
}

.kpi-size-xlarge .kpi-icon {
  width: 72px;
  height: 72px;
}

.kpi-size-xlarge .kpi-header {
  margin-bottom: 1.5rem;
}

.kpi-size-xlarge .kpi-label {
  font-size: 1.1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .kpi-card {
    padding: 1rem;
  }
  
  .kpi-value {
    font-size: 1.75rem;
  }
  
  .kpi-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
