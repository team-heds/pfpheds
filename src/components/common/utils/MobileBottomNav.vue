<template>
  <nav v-if="isMobile" class="mobile-bottom-nav" aria-label="Navigation principale">
    <router-link
      v-for="item in navItems"
      :key="item.key"
      :to="item.to"
      class="nav-item"
      :class="{ active: isActive(item) }"
      :aria-current="isActive(item) ? 'page' : undefined"
    >
      <i :class="item.icon" aria-hidden="true"></i>
      <span class="nav-item__label">{{ item.label }}</span>
      <span class="nav-item__label nav-item__label--compact">{{ item.shortLabel }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
const userId = computed(() => authStore.user?.id || authStore.user?.uid || '');
const navItems = computed(() => [
  { key: 'feed', to: '/feed', match: '/feed', icon: 'pi pi-home', label: 'Accueil', shortLabel: 'Accueil' },
  { key: 'search', to: '/mobile-search', match: '/mobile-search', icon: 'pi pi-search', label: 'Recherche', shortLabel: 'Chercher' },
  { key: 'tools', to: '/mobile-outils', match: '/mobile-outils', icon: 'pi pi-th-large', label: 'Outils', shortLabel: 'Outils' },
  { key: 'communities', to: '/communities', match: '/communities', icon: 'pi pi-comments', label: 'Communautés', shortLabel: 'Groupes' },
  { key: 'profile', to: userId.value ? `/profile/${userId.value}` : '/profile', match: '/profile', icon: 'pi pi-user', label: 'Profil', shortLabel: 'Profil' },
]);

const route = useRoute();
const isActive = (item) => route.path === item.match || route.path.startsWith(`${item.match}/`);

const mediaQuery = window.matchMedia('(max-width: 768px)');
const isMobile = ref(mediaQuery.matches);
const handleMediaChange = (event) => {
  isMobile.value = event.matches;
};
const subscribeToMediaQuery = () => {
  if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', handleMediaChange);
  else mediaQuery.addListener(handleMediaChange);
};
const unsubscribeFromMediaQuery = () => {
  if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', handleMediaChange);
  else mediaQuery.removeListener(handleMediaChange);
};
onMounted(subscribeToMediaQuery);
onUnmounted(unsubscribeFromMediaQuery);
</script>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--surface-overlay, #fff);
  box-shadow: 0 -2px 16px rgba(0,0,0,0.08);
  border-radius: 18px 18px 0 0;
  max-width: 37.5rem;
  margin: 0 auto;
  padding: 0.4rem max(0.25rem, env(safe-area-inset-right, 0px)) max(0.5rem, env(safe-area-inset-bottom, 0px)) max(0.25rem, env(safe-area-inset-left, 0px));
}
.nav-item {
  flex: 1 1 0;
  min-width: 0;
  min-height: 48px;
  text-align: center;
  color: var(--text-color, #555);
  text-decoration: none;
  border-radius: 0.75rem;
  transition: color 150ms ease, background-color 150ms ease, transform 150ms ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
}
.nav-item.active,
.nav-item.router-link-exact-active {
  color: var(--primary-color, #1976d2);
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
}
.nav-item:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: -2px;
}
.nav-item:active {
  transform: scale(0.96);
}
.nav-item i {
  font-size: 1.35rem;
  line-height: 1;
}
.nav-item__label {
  max-width: 100%;
  overflow: hidden;
  font-size: 0.68rem;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nav-item__label--compact {
  display: none;
}
@media (max-width: 360px) {
  .nav-item__label:not(.nav-item__label--compact) {
    display: none;
  }
  .nav-item__label--compact {
    display: block;
  }
}
@media (min-width: 769px) {
  .mobile-bottom-nav {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .nav-item {
    transition: none;
  }
}
@media (forced-colors: active) {
  .nav-item.active {
    border: 1px solid CanvasText;
  }
}
</style>
