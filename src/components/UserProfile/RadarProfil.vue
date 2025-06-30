<template>
  <div class="radar-profil-root">

    <Radar :data="chartData" :options="chartOptions" :height="radarHeight" class="marge" />
    <div class="radar-stats-info">
      <span class="radar-total">Nombre de stages effectués : <b>{{ props.totalStages }}</b></span>
    </div>
    <div class="radar-valid-criteria">
      <span v-for="crit in validatedCriteria" :key="crit.label" class="radar-crit-valid" :class="{'radar-crit-zero': crit.value === 0}">
        <i v-if="crit.value > 0" class="pi pi-check-circle text-green-500 mr-1" />
        <i v-else class="pi pi-times-circle text-red-400 mr-1" />
        {{ crit.label }} ({{ crit.value }} / {{ props.totalStages }})
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Radar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler);

const props = defineProps({
  scores: {
    type: Object,
    required: true
  },
  totalStages: {
    type: Number,
    default: 5 // fallback
  }
});

const criteriaLabels = [
  "NEUROGER",
  "SYSINT",
  "MSQ",
  "AIGU",
  "REHAB",
  "AMBU",
  "DE",
  "FR"
];

const chartData = computed(() => ({
  labels: criteriaLabels,
  datasets: [
    {
      label: "Nombre de validations",
      data: criteriaLabels.map(k => props.scores[k] ?? 0),
      backgroundColor: 'rgba(243, 195, 0, 0.25)',
      borderColor: '#f3c300',
      borderWidth: 3,
      pointBackgroundColor: '#f3c300',
      pointBorderColor: '#fff',
      pointRadius: 7,
      pointHoverRadius: 11,
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#f3c300',
      fill: true
    }
  ]
}));

const NB_GRID_LINES = 5; // Nombre de lignes voulues
const chartOptions = computed(() => {
  // On force le max à NB_GRID_LINES - 1 pour avoir toujours 5 lignes (0 à 4)
  const maxVal = NB_GRID_LINES - 1;
  return {
    responsive: true,
    plugins: {
      legend: { display: true, labels: { color: '#fff', font: { weight: 'bold', size: 16 } } },
      title: {
        display: true,
        text: 'Profil de validation par critère',
        font: { size: 20, weight: 'bold', family: 'inherit' },
        color: '#fff',
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: ctx => `${ctx.label}: ${ctx.parsed.r} / ${props.totalStages} (${Math.round(100 * ctx.parsed.r / (props.totalStages||1))}%)`
        },
        backgroundColor: '#222',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#f3c300',
        borderWidth: 1
      }
    },
    scales: {
      r: {
        min: -1,
        max: maxVal,
        beginAtZero: false,
        grid: {
          color: ctx => ctx.index === 0 ? '#fff' : '#fff8',
          lineWidth: ctx => ctx.index === 0 ? 3 : 1.5,
          circular: false
        },
        angleLines: {
          color: '#f3eb84',
          lineWidth: 2
        },
        ticks: {
          stepSize: 1,
          color: '#fff',
          font: { size: 16, weight: 'bold', family: 'inherit' },
          z: 10,
          callback: function(value) {
            // Cache le tick -1 (centre) ET le tick 0 (ligne du milieu)
            if (value === -1 || value === 0) return '';
            return value;
          },
          count: NB_GRID_LINES // force le nombre de ticks
        },
        pointLabels: {
          font: { size: 18, weight: 'bold', family: 'inherit' },
          color: '#fff',
          padding: 8
        }
      }
    },
    animation: {
      duration: 900,
      easing: 'easeOutQuart'
    },
    maintainAspectRatio: false
  };
});

const validatedCriteria = computed(() =>
  criteriaLabels.map(k => ({
    label: k,
    value: props.scores[k] ?? 0
  }))
);

// Responsive height (encore plus grand : 440px desktop, 300px mobile)
const radarHeight = ref(window.innerWidth < 600 ? 300 : 440);
window.addEventListener('resize', () => {
  radarHeight.value = window.innerWidth < 600 ? 300 : 440;
});
</script>

<style scoped>
.radar-profil-root {
  background: var(--surface-card, #fff);
  border-radius: 2rem;
  box-shadow: 0 2px 14px rgba(60,60,60,0.16);
  padding: 1.1rem 0.7rem 14rem 0.7rem;
  margin: 1.2rem 0 1.2rem 0;
  width: 100%;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  max-height: 680px;
  min-height: unset;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* Permettre le scroll jusqu'au fond sur mobile/dans petits conteneurs */
:global(body),
:global(.main-scroll-area),
:global(.profile-main-scroll) {
  overscroll-behavior: contain;
  scroll-padding-bottom: 320px;
}

/* Si la page parent n'a pas déjà overflow-y:auto, à ajouter dans le layout principal */

.radar-stats-info {
  text-align: center;
  color: #fff;
  margin: 0.3rem 0 0.5rem 0;
  font-size: 1.08em;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.radar-title {
  font-size: 1.19em;
  font-weight: 900;
  color: #fff;
  text-align: center;
  margin-bottom: 0.8rem;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 8px #222b;
}
.radar-valid-criteria {
  display: flex;
  flex-wrap: wrap;
  gap: 1.1rem 1.7rem; /* espace vertical et horizontal entre les badges */
  justify-content: center;
  margin-top: 1.2rem;
  margin-bottom: 0.7rem;
}
.radar-crit-valid {
  font-size: 1.08rem;
  font-weight: 500;
  background: rgba(255,255,255,0.09);
  border-radius: 1.1rem;
  padding: 0.32rem 1.1rem 0.32rem 0.7rem;
  margin: 0.2rem 0;
  box-shadow: 0 1px 5px #0001;
  display: flex;
  align-items: center;
  min-width: 110px;
  justify-content: center;
}
.radar-crit-zero {
  opacity: 0.7;
  background: rgba(255,0,0,0.08);
}
.marge {
  margin: 0.8rem;
  }

</style>
