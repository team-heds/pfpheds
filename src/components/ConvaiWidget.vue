<!-- src/components/ConvaiWidget.vue -->
<template>
  <div v-if="!isMobile" class="convai-widget-container">
    <elevenlabs-convai agent-id="mz6MO6cxxKQYHSghIs10"></elevenlabs-convai>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
const isMobile = ref(window.innerWidth <= 768);
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
};
onMounted(() => window.addEventListener('resize', handleResize));
onUnmounted(() => window.removeEventListener('resize', handleResize));
</script>

<style scoped>
.convai-widget-container {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 999;
}
</style>
