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
defineProps({
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
  flex-wrap: wrap;
  justify-content: flex-end;
}

.breadcrumbs :deep(a) {
  text-decoration: none;
}

@media (max-width: 48rem) {
  .header-main { grid-template-columns: minmax(0, 1fr); }
  .header-actions { justify-content: flex-start; }
  .header-actions :deep(.p-button) { flex: 1 1 auto; }
}

@media (max-width: 40rem) {
  .header-actions { display: grid; grid-template-columns: 1fr; width: 100%; }
  .header-actions :deep(.p-button) { width: 100%; }
}
</style>
