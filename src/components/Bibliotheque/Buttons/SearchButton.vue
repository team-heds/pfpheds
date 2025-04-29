<template>
  <button
    class="search-btn"
    @click="$emit('click')"
    :title="title"
    type="button"
  >
    <i class="pi pi-search" style="font-size: 1.3rem; color: var(--primary-color);"></i>
  </button>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: 'Rechercher'
  }
});
</script>

<style scoped>
.search-btn {
  background: var(--surface-overlay);
  border: none;
  border-radius: 25%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}
.search-btn:hover {
  background: var(--surface-hover);
}
</style>
