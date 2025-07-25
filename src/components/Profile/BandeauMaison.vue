<template>
  <div
    class="bandeau-maison flex align-items-center p-4 border-round-lg shadow-2 mb-4"
    :style="bandeauStyle"
  >
    <div class="flex flex-column justify-content-center" style="z-index:2;">
      <div class="text-4xl font-bold mb-2" :style="{ color: maisonColor }">{{ maisonName }}</div>
      <div class="text-lg font-medium text-white opacity-90">Niveau {{ niveau }}</div>
    </div>
    <div class="flex-1"></div>

  </div>
</template>

<script setup>
import { computed } from 'vue';

// Props attendues du parent : maison, niveau
const props = defineProps({
  maison: { type: String, required: true },
  niveau: { type: Number, required: true }
});

const maisons = {
  harmonis: {
    name: 'Harmonis',
    color: '#608E62',
    pattern: new URL('@/assets/maisons/FondHarmonis.png', import.meta.url).href,
    blason: new URL('@/assets/maisons/Harmonis.png', import.meta.url).href
  },
  elaris: {
    name: 'Elaris',
    color: '#B15E56',
    pattern: new URL('@/assets/maisons/FondElaris.png', import.meta.url).href,
    blason: new URL('@/assets/maisons/Elaris.png', import.meta.url).href
  },
  doloris: {
    name: 'Doloris',
    color: '#D4B25B',
    pattern: new URL('@/assets/maisons/FondDoloris.png', import.meta.url).href,
    blason: new URL('@/assets/maisons/Doloris.png', import.meta.url).href
  },
  solencia: {
    name: 'Solencia',
    color: '#668DA3',
    pattern: new URL('@/assets/maisons/FondSolencia.png', import.meta.url).href,
    blason: new URL('@/assets/maisons/Solencia.png', import.meta.url).href
  }
};

const maisonData = computed(() => maisons[props.maison?.toLowerCase()] ?? maisons.harmonis);
const maisonName = computed(() => maisonData.value.name);
const maisonColor = computed(() => maisonData.value.color);
const bandeauStyle = computed(() => ({
  background: `url('${maisonData.value.pattern}') center/cover, linear-gradient(90deg, ${maisonData.value.color} 80%, #222 100%)`,
  position: 'relative',
  minHeight: '220px',
  borderRadius: '1.3rem',
  overflow: 'hidden',
  boxShadow: '0 2px 12px 0 #0008',
  marginBottom: '2rem'
}));

</script>

<style scoped>
.bandeau-maison {
  position: relative;
  min-height: 120px;
  overflow: hidden;
}

@media (max-width: 600px) {
  .bandeau-maison {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.2rem;
  }
}
</style>