<template>
  <div>
    <a href="#admin-content" class="skip-link">Aller au contenu</a>
    <Navbar />
    <div class="admin-layout" :class="{ 'has-feed': hasFeed, 'no-sidebar': noSidebar, 'is-wide': wide }">
      <template v-if="hasFeed">
        <div class="feed-left">
          <slot name="left" />
        </div>
        <main id="admin-content" class="admin-content" role="main">
          <div class="admin-header">
            <slot name="header" />
          </div>
          <slot />
        </main>
        <div class="feed-right">
          <slot name="right" />
        </div>
      </template>
      <template v-else-if="noSidebar">
        <main id="admin-content" class="admin-content" role="main">
          <div class="admin-header">
            <slot name="header" />
          </div>
          <slot />
        </main>
      </template>
      <template v-else>
        <aside aria-label="Navigation admin">
          <AdminSidebar />
        </aside>
        <main id="admin-content" class="admin-content" role="main">
          <div class="admin-header">
            <slot name="header" />
          </div>
          <slot />
        </main>
      </template>
    </div>
  </div>
  </template>

<script setup>
import { computed, useSlots } from 'vue'
import Navbar from '@/components/common/utils/Navbar.vue';
import AdminSidebar from '../lists/AdminSidebar.vue';

const { noSidebar, wide } = defineProps({
  noSidebar: { type: Boolean, default: false },
  wide: { type: Boolean, default: false },
})
const slots = useSlots()
const hasFeed = computed(() => !!slots.left || !!slots.right)
</script>

<style scoped>
.skip-link {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.skip-link:focus {
  left: var(--space-4, 1rem);
  top: var(--space-4, 1rem);
  width: auto;
  height: auto;
  background: #fff;
  color: #111;
  padding: var(--space-2, .5rem) var(--space-3, .75rem);
  border-radius: var(--radius-sm, 8px);
  box-shadow: 0 0 0 2px #111;
  z-index: 1000;
}

.admin-layout {
  display: grid;
  grid-template-columns: minmax(16rem, 18.75rem) minmax(0, 1fr);
  gap: var(--space-6, 1.5rem);
  padding: var(--space-6, 1.5rem);
  height: calc(100dvh - var(--navbar-h, 64px) - (2 * var(--space-6, 1.5rem)));
  overflow: hidden;
}

.admin-layout.has-feed {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: var(--space-6, 1.5rem);
}

.admin-layout.no-sidebar {
  grid-template-columns: minmax(0, 1fr);
}

.admin-layout.is-wide:not(.has-feed):not(.no-sidebar) {
  grid-template-columns: minmax(14rem, 16rem) minmax(0, 1fr);
  gap: var(--space-4, 1rem);
  padding-inline: var(--space-4, 1rem);
}

@media (max-width: 1279px) {
  .admin-layout.has-feed {
    grid-template-columns: 280px 1fr;
  }
  .feed-right { display: none; }
}
@media (max-width: 959px) {
  .admin-layout.has-feed {
    display: block;
  }
  .feed-left, .feed-right { display: none; }
}

.admin-content {
  min-width: 0;
  /* Centralise le scroll pour toutes les pages admin */
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE et Edge */
}

@media (max-width: 1100px) {
  .admin-layout {
    gap: var(--space-4, 1rem);
    padding: var(--space-4, 1rem);
    height: calc(100dvh - var(--navbar-h, 64px) - (2 * var(--space-4, 1rem)));
  }
}

@media (max-width: 56rem) {
  .admin-layout:not(.has-feed):not(.no-sidebar) {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
    min-height: calc(100dvh - var(--navbar-h, 64px));
    overflow: visible;
  }

  .admin-layout:not(.has-feed):not(.no-sidebar) > aside {
    min-width: 0;
  }

  .admin-layout:not(.has-feed):not(.no-sidebar) > aside :deep(.admin-sidebar) {
    width: 100%;
    min-width: 0;
    max-width: none;
    height: auto;
    max-height: min(42dvh, 24rem);
  }

  .admin-content { height: auto; overflow: visible; }
  .admin-header { position: static; }
}

.admin-content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.admin-header {
  position: sticky;
  top: 0;
  z-index: 5;
  padding-bottom: var(--space-3, .75rem);
  margin-bottom: var(--space-3, .75rem);
}

.feed-left,
.feed-right {
  height: 100%;
  overflow-y: hidden;
}
</style>
