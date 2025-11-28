<template>
  <div class="mini-chart-wrapper">
    <Line v-if="chartData" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  height: {
    type: [Number, String],
    default: 40
  }
})

const chartData = computed(() => {
  if (!props.data || props.data.length === 0) return null

  return {
    labels: props.data.map((_, i) => ''),
    datasets: [
      {
        data: props.data,
        borderColor: props.color,
        backgroundColor: `${props.color}20`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: props.color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: 8,
      cornerRadius: 4,
      displayColors: false,
      callbacks: {
        title: () => '',
        label: (context) => context.parsed.y.toLocaleString()
      }
    }
  },
  scales: {
    x: {
      display: false
    },
    y: {
      display: false
    }
  },
  interaction: {
    mode: 'index',
    intersect: false
  }
}))
</script>

<style scoped>
.mini-chart-wrapper {
  width: 100%;
  height: v-bind('height + "px"');
  margin-top: 0.5rem;
}
</style>
