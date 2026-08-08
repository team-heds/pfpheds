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
.system-state { display:grid; justify-items:center; gap:var(--app-space-2); padding:var(--app-space-10) var(--app-space-6); text-align:center; color:var(--app-color-text-muted); }
.system-state__icon { display:grid; place-items:center; width:var(--app-space-12); height:var(--app-space-12); border-radius:var(--app-radius-pill); background:var(--app-color-section); color:var(--app-color-brand); font-size:var(--app-font-size-xl); }
.system-state__title { margin:var(--app-space-1) 0 0; color:var(--app-color-text); font-size:var(--app-font-size-md); }
.system-state__description { max-width:var(--app-reading-max); margin:0; line-height:var(--app-line-height-body); text-wrap:pretty; }
.system-state__action { min-height:var(--app-touch-target); margin-block-start:var(--app-space-2); padding:var(--app-control-padding-block) var(--app-space-4); border:0; border-radius:var(--app-control-radius); background:var(--app-color-brand); color:var(--app-color-on-brand); font:inherit; font-weight:var(--app-font-weight-semibold); cursor:pointer; }
.system-state__action:hover { background:var(--app-color-brand-hover); }
.system-state__action:focus-visible { outline:max(2px, .1875rem) solid var(--app-color-focus); outline-offset:var(--app-space-1); }
@media(max-width:40rem){.system-state{padding:var(--app-space-8) var(--app-space-4)}.system-state__action{width:100%}}
</style>
