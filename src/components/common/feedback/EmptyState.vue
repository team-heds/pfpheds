<template>
  <section class="empty-state" role="status" aria-live="polite">
    <div class="empty-inner">
      <i v-if="icon" :class="['pi', icon, 'empty-icon']" aria-hidden="true" />
      <h2 class="empty-title">{{ title }}</h2>
      <p v-if="description" class="empty-desc">{{ description }}</p>
      <div class="empty-actions">
        <Button v-if="actionLabel" :label="actionLabel" class="p-button-raised" @click="$emit('action')" />
        <slot name="actions" />
      </div>
    </div>
  </section>
</template>

<script setup>
import Button from 'primevue/button'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  actionLabel: { type: String, default: '' }
})
</script>

<style scoped>
.empty-state {
  display: grid;
  place-items: center;
  padding: calc(var(--space-6, 1.5rem) * 2);
  color: var(--text-color-secondary, #9ca3af);
}

.empty-inner {
  text-align: center;
  max-width: 640px;
}

.empty-icon {
  font-size: 2rem;
  color: var(--primary-color, #f3c300);
  margin-bottom: var(--space-3, .75rem);
}

.empty-title {
  margin: 0 0 var(--space-2, .5rem) 0;
  color: var(--text-color, #f3f4f6);
  font-weight: var(--font-weight-bold, 700);
}

.empty-desc {
  margin: 0 0 var(--space-4, 1rem) 0;
}

.empty-actions { display: inline-flex; gap: var(--space-3, .75rem); }
</style>
