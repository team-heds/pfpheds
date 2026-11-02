<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-icon">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" stroke="#e74c3c" stroke-width="4" fill="none"/>
          <text x="100" y="120" text-anchor="middle" font-size="48" font-weight="bold" fill="#e74c3c">404</text>
        </svg>
      </div>
      <h1 class="error-title">{{ title }}</h1>
      <p class="error-description">
        {{ description }}
      </p>
      <div class="error-actions">
        <Button :label="homeLabel" icon="pi pi-home" @click="goHome" />
        <Button :label="backLabel" icon="pi pi-arrow-left" outlined severity="secondary" @click="goBack" />
      </div>
    </div>
  </div>
</template>

<script>
import Button from 'primevue/button'

export default {
  name: 'Error404',
  components: { Button },
  props: {
    title: { type: String, default: 'Page introuvable' },
    description: { type: String, default: 'La page demandée n’existe pas ou a été déplacée.' },
    homeLabel: { type: String, default: 'Retour à l’accueil' },
    backLabel: { type: String, default: 'Page précédente' },
  },
  methods: {
    goHome() {
      this.$router.push('/');
    },
    goBack() {
      if (window.history.length > 1) {
        this.$router.go(-1);
      } else {
        this.$router.push('/');
      }
    }
  }
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
  padding: 2rem;
}

.error-content {
  text-align: center;
  max-width: 500px;
  padding: clamp(1.5rem, 5vw, 3rem);
}

.error-icon {
  margin-bottom: 2rem;
}

.error-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 1rem;
  letter-spacing: -.03em;
}

.error-description {
  font-size: 1.1rem;
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 768px) {
  .error-content {
    padding: 2rem;
  }
  
  .error-title {
    font-size: 2rem;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-actions :deep(.p-button) {
    width: 100%;
    justify-content: center;
  }
}
</style>
