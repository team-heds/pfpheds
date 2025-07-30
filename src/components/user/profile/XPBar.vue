<template>
  <div class="xp-bar-container mb-3">
    <div class="flex align-items-center justify-content-between mb-1">
      <span class="font-medium text-white">XP : {{ xp }} / {{ xpToNext }}</span>
      <span class="text-sm text-white">Niveau {{ niveau }}</span>
    </div>
    <div class="xp-bar-outer">
      <div
        class="xp-bar-inner"
        :style="{
          width: percent + '%',
          background: color,
        }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  xp: { type: Number, required: true },
  xpToNext: { type: Number, required: true },
  niveau: { type: Number, required: true },
  maison: { type: String, default: '' }
});

const percent = computed(() => {
  if (!props.xpToNext) return 0;
  return Math.round((props.xp / props.xpToNext) * 100);
});

const color = computed(() => {
  switch ((props.maison || '').toLowerCase()) {
    case 'harmonis': return 'linear-gradient(90deg, #608E62 60%, #3E5A48 100%)';
    case 'elaris': return 'linear-gradient(90deg, #B15E56 60%, #8E3F35 100%)';
    case 'doloris': return 'linear-gradient(90deg, #D4B25B 60%, #A38945 100%)';
    case 'solencia': return 'linear-gradient(90deg, #668DA3 60%, #4B6E7E 100%)';
    default: return 'linear-gradient(90deg, #6366F1 60%, #4B6E7E 100%)';
  }
});
</script>

<style scoped>
.xp-bar-container {
  width: 100%;
}
.xp-bar-outer {
  width: 100%;
  height: 18px;
  border-radius: 1rem;
  background: #23272f;
  overflow: hidden;
  position: relative;
}
.xp-bar-inner {
  height: 100%;
  border-radius: 1rem;
  transition: width 0.6s cubic-bezier(.4,1.4,.6,1), background 0.3s;
}
</style>
