<template>
  <section class="status-page" aria-labelledby="status-page-title">
    <div class="status-page__content">
      <span class="status-page__icon" aria-hidden="true"><i :class="['pi', icon]"></i></span>
      <h1 id="status-page-title">{{ title }}</h1>
      <p>{{ description }}</p>
      <div class="status-page__actions"><slot /></div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: 'pi-info-circle' },
})
</script>

<style scoped>
.status-page {
  display: grid;
  place-items: center;
  min-height: min(70dvh, 40rem);
  padding: var(--app-space-6);
  color: var(--app-color-text);
}

.status-page__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100%, 28rem);
  padding: var(--app-space-8) var(--app-space-6);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-md);
  background: var(--app-color-surface);
  text-align: center;
}

.status-page__icon {
  display: grid;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  margin-block-end: var(--app-space-4);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-pill);
  color: var(--app-color-text-muted);
}

.status-page__icon .pi {
  font-size: 1.375rem;
}

h1 {
  margin: 0;
  font-size: var(--app-font-size-xl);
  font-weight: var(--app-font-weight-semibold);
  line-height: 1.25;
}

p {
  margin: var(--app-space-2) 0 0;
  color: var(--app-color-text-muted);
  font-size: 0.9375rem;
  line-height: var(--app-line-height-body);
}

.status-page__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--app-space-3);
  margin-block-start: var(--app-space-6);
}
</style>
