<template>
  <header class="page-header">
    <div class="title-row">
      <div class="title-wrap">
        <i v-if="icon" :class="icon" class="title-icon" />
        <div>
          <h1 class="title" tabindex="-1">{{ title }}</h1>
          <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="actions">
        <slot name="actions" />
      </div>
    </div>
    <div v-if="$slots.default" class="header-extra">
      <slot />
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' }
});
</script>

<style scoped>
.page-header {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}
.title-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.title-wrap { display: flex; align-items: center; gap: .75rem; }
.title-icon { color: var(--primary-color); font-size: 1.5rem; }
.title { margin: 0; font-size: 1.5rem; color: var(--text-color); }
.subtitle { margin: .25rem 0 0; color: var(--text-color-secondary); font-size: .95rem; }
.actions :deep(> *) { margin-left: .5rem; }
.header-extra { margin-top: .75rem; }

@media (max-width: 640px) {
  .page-header {
    padding: .9rem 1rem;
    margin-bottom: .75rem;
  }

  .title-row,
  .actions {
    width: 100%;
  }

  .title-wrap {
    align-items: flex-start;
    min-width: 0;
  }

  .title {
    font-size: 1.25rem;
    line-height: 1.2;
  }

  .subtitle {
    font-size: .875rem;
    line-height: 1.45;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: .5rem;
  }

  .actions :deep(> *) {
    width: 100%;
    min-height: 44px;
    margin-left: 0;
  }
}
</style>
