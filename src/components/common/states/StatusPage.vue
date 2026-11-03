<template>
  <main class="status-page">
    <section class="status-card" :aria-labelledby="headingId">
      <span class="status-icon" :class="`status-icon--${tone}`" aria-hidden="true">
        <i :class="icon"></i>
      </span>
      <h1 :id="headingId" class="status-title">{{ title }}</h1>
      <p class="status-description">{{ description }}</p>
      <p v-if="hint" class="status-hint">{{ hint }}</p>
      <div class="status-actions">
        <Button :label="primaryLabel" :icon="primaryIcon" @click="goPrimary" />
        <Button
          v-if="showBack"
          label="Page précédente"
          icon="pi pi-arrow-left"
          outlined
          severity="secondary"
          @click="goBack"
        />
      </div>
    </section>
  </main>
</template>

<script setup>
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  hint: { type: String, default: '' },
  icon: { type: String, default: 'pi pi-lock' },
  tone: { type: String, default: 'neutral', validator: (value) => ['neutral', 'warning', 'danger'].includes(value) },
  primaryLabel: { type: String, default: 'Retour au fil' },
  primaryIcon: { type: String, default: 'pi pi-home' },
  primaryTo: { type: [String, Object], default: '/feed' },
  showBack: { type: Boolean, default: true },
  headingId: { type: String, default: 'status-page-title' },
})

const router = useRouter()

function goPrimary() {
  router.push(props.primaryTo)
}

function goBack() {
  if (window.history.state?.back) router.back()
  else router.push(props.primaryTo)
}
</script>

<style scoped>
.status-page {
  min-height: min(70vh, 40rem);
  display: grid;
  place-items: center;
  padding: clamp(1.5rem, 5vw, 3rem) 1rem;
}

.status-card {
  position: relative;
  width: min(100%, 36rem);
  padding: clamp(1.5rem, 5vw, 2.5rem);
  text-align: center;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 1rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
}

.status-icon {
  display: inline-grid;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  margin-bottom: 1.25rem;
  border-radius: 50%;
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  color: var(--primary-color);
  font-size: 1.5rem;
}

.status-icon--warning {
  background: color-mix(in srgb, #f59e0b 16%, transparent);
  color: #b45309;
}

.status-icon--danger {
  background: color-mix(in srgb, #ef4444 14%, transparent);
  color: #dc2626;
}

.status-title {
  margin: 0 0 0.75rem;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  text-wrap: balance;
  color: var(--text-color);
}

.status-description {
  margin: 0 auto;
  max-width: 60ch;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--text-color-secondary);
}

.status-hint {
  margin: 0.75rem auto 0;
  max-width: 60ch;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-color-secondary);
}

.status-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2rem;
}

@media (max-width: 480px) {
  .status-actions :deep(.p-button) {
    width: 100%;
    justify-content: center;
  }
}
</style>
