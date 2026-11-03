<template>
  <header class="gamification-admin-header">
    <nav class="gamification-admin-header__breadcrumb" aria-label="Fil d’Ariane">
      <RouterLink to="/admin/dashboard-gamification">
        <i class="pi pi-chart-line" aria-hidden="true"></i>
        Gamification
      </RouterLink>
      <i class="pi pi-angle-right" aria-hidden="true"></i>
      <span aria-current="page">{{ title }}</span>
    </nav>

    <div class="gamification-admin-header__content">
      <span class="gamification-admin-header__icon" aria-hidden="true">
        <i :class="icon"></i>
      </span>
      <div>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
    </div>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
})
</script>

<style scoped>
.gamification-admin-header {
  padding: 1.5rem;
  color: #f8fafc;
  background: #071426;
  border: 1px solid #263a55;
  border-radius: 16px;
  box-shadow: 0 14px 34px rgba(3, 12, 28, 0.2);
}

.gamification-admin-header__breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  color: #9fb0c5;
  font-size: 0.82rem;
}

.gamification-admin-header__breadcrumb a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 0.45rem;
  color: #c8d3e1;
  text-decoration: none;
}

.gamification-admin-header__breadcrumb a:hover { color: #f3c300; }
.gamification-admin-header__breadcrumb a:focus-visible {
  outline: 3px solid rgba(243, 195, 0, 0.5);
  outline-offset: 3px;
  border-radius: 8px;
}

.gamification-admin-header__content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.gamification-admin-header__icon {
  display: grid;
  flex: 0 0 3.25rem;
  width: 3.25rem;
  height: 3.25rem;
  place-items: center;
  color: #071426;
  background: #f3c300;
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(243, 195, 0, 0.2);
}

.gamification-admin-header__icon i { font-size: 1.3rem; }
h1 {
  margin: 0;
  color: #f8fafc;
  font-size: clamp(1.65rem, 4vw, 2.35rem);
  line-height: 1.1;
  letter-spacing: -0.025em;
}

p {
  max-width: 68ch;
  margin: 0.55rem 0 0;
  color: #b8c3d1;
  line-height: 1.55;
}

@media (max-width: 560px) {
  .gamification-admin-header { padding: 1.1rem; }
  .gamification-admin-header__breadcrumb { margin-bottom: 1rem; }
  .gamification-admin-header__content { align-items: flex-start; gap: 0.75rem; }
  .gamification-admin-header__icon {
    flex-basis: 2.75rem;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 12px;
  }
  h1 { font-size: 1.4rem; }
  p { font-size: 0.94rem; }
}
</style>
