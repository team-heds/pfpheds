<template>
  <!-- Insertion du composant Navbar -->
  <Navbar />
  <PushControls />

 
</template>

<script setup>
  import PushControls from '@/components/push/PushControls.vue';

</script>

<style scoped>
.admin-panel {
  text-align: right;
  margin-bottom: 1rem;
}
.add-file-button {
  margin-top: 1rem;
  text-align: center;
}

.scrollable-container {
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 12rem;
}
.scrollable-container::-webkit-scrollbar {
  display: none;
}
</style>
