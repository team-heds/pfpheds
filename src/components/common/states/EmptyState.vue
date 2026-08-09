<template>
  <section class="system-state" role="status">
    <span class="system-state__icon" aria-hidden="true"><i :class="icon"></i></span>
    <h2 class="system-state__title">{{ title }}</h2>
    <p v-if="description" class="system-state__description">{{ description }}</p>
    <button v-if="actionLabel" type="button" class="system-state__action" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  icon: { type: String, default: 'pi pi-inbox' },
})
defineEmits(['action'])
</script>

<style scoped>
.system-state { display:grid; justify-items:center; gap:.5rem; padding:2.5rem 1.5rem; text-align:center; color:var(--text-color-secondary); }
.system-state__icon { display:grid; place-items:center; width:3rem; height:3rem; border-radius:50%; background:var(--surface-ground); color:var(--primary-color); font-size:1.25rem; }
.system-state__title { margin:.25rem 0 0; color:var(--text-color); font-size:1rem; }
.system-state__description { max-width:34rem; margin:0; line-height:1.55; }
.system-state__action { min-height:2.75rem; margin-top:.5rem; padding:.625rem 1rem; border:0; border-radius:.75rem; background:var(--primary-color); color:#fff; font:inherit; font-weight:600; cursor:pointer; }
.system-state__action:focus-visible { outline:2px solid var(--primary-color); outline-offset:3px; }
</style>
