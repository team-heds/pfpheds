<template>
  <header class="admin-page-header">
    <div class="breadcrumbs" v-if="$slots.breadcrumbs">
      <slot name="breadcrumbs" />
    </div>
    <div class="header-main">
      <h1 class="page-title h1">{{ title }}</h1>
      <div class="header-actions" v-if="$slots.actions">
        <slot name="actions" />
      </div>
    </div>
    <p class="page-subtitle" v-if="subtitle">{{ subtitle }}</p>
  </header>
</template>

<script setup>
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<style scoped>
.admin-page-header {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3, .75rem);
}

.header-main {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-3, .75rem);
}

.page-title {
  margin: 0;
}

.page-subtitle {
  margin: 0;
  color: var(--text-600, #6b7280);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3, .75rem);
}

.breadcrumbs :deep(a) {
  text-decoration: none;
}
</style>
