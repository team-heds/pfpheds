<template>
  <button
    class="search-btn"
    @click="$emit('click')"
    :title="title"
    :aria-label="title"
    type="button"
  >
    <i class="pi pi-search" aria-hidden="true"></i>
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
.search-btn:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 3px;
}
.search-btn:active {
  transform: scale(.96);
}
.search-btn i {
  color: var(--primary-color);
  font-size: 1.3rem;
}
@media (prefers-reduced-motion: reduce) {
  .search-btn { transition: none; }
}
</style>
