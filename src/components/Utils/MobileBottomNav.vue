<template>
  <nav class="mobile-bottom-nav" v-if="isMobile" :class="{ hide: !isVisible }">
    <router-link v-for="item in navItems" :key="item.to" :to="item.to" class="nav-item" :class="{ active: isActive(item.to) }">
      <i :class="item.icon"></i>
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { ref, computed, onMounted, onUnmounted, defineProps, watch, nextTick } from 'vue';

const props = defineProps({ scrollTarget: Object });

const navItems = [
  { label: 'Accueil', to: '/feed', icon: 'pi pi-home' },
  { label: 'Institution', to: '/institution', icon: 'pi pi-bookmark' },
  { label: 'Autre', to: '/map', icon: 'pi pi-th-large' },
  { label: 'Messages', to: '/chat', icon: 'pi pi-inbox' },
  { label: 'Profil', to: '/profil', icon: 'pi pi-user' },
];

const route = useRoute();
const isActive = (to) => route.path.startsWith(to);

const isMobile = ref(window.innerWidth <= 768);
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
};
onMounted(() => window.addEventListener('resize', handleResize));
onUnmounted(() => window.removeEventListener('resize', handleResize));

// --- Scroll hide/show logic ---
const isVisible = ref(true);
let lastScrollY = 0;
const handleScroll = () => {
  if (!props.scrollTarget) return;
  const currentY = props.scrollTarget.scrollTop;
  if (currentY > lastScrollY + 10) {
    isVisible.value = false; // Scroll down: hide
  } else if (currentY < lastScrollY - 10) {
    isVisible.value = true; // Scroll up: show
  }
  lastScrollY = currentY;
};

function attachScrollListener() {
  if (props.scrollTarget) {
    lastScrollY = props.scrollTarget.scrollTop;
    props.scrollTarget.addEventListener('scroll', handleScroll);
  }
}
function detachScrollListener() {
  if (props.scrollTarget) {
    props.scrollTarget.removeEventListener('scroll', handleScroll);
  }
}

onMounted(async () => {
  await nextTick();
  attachScrollListener();
});
onUnmounted(() => {
  detachScrollListener();
});

watch(() => props.scrollTarget, (newVal, oldVal) => {
  if (oldVal) oldVal.removeEventListener('scroll', handleScroll);
  if (newVal) {
    lastScrollY = newVal.scrollTop;
    newVal.addEventListener('scroll', handleScroll);
  }
});
</script>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 56px;
  background: var(--surface-overlay, #fff);
  border-top: 1px solid var(--surface-border, #ddd);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
  transition: transform 0.32s cubic-bezier(.4,0,.2,1);
  will-change: transform;
}
.mobile-bottom-nav.hide {
  transform: translateY(100%);
  pointer-events: none;
}
.nav-item {
  flex: 1 1 0;
  text-align: center;
  color: var(--text-color, #555);
  font-size: 1.3rem;
  text-decoration: none;
  padding-top: 5px;
  transition: color 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.nav-item.active,
.nav-item.router-link-exact-active {
  color: var(--primary-color, #1976d2);
}
.nav-item i {
  font-size: 1.6rem;
  margin-bottom: 2px;
}
.nav-item span {
  font-size: 0.7rem;
}
@media (min-width: 769px) {
  .mobile-bottom-nav {
    display: none;
  }
}
</style>
