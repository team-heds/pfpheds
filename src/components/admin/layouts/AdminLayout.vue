<template>
  <div>
    <Navbar />
    <div class="admin-layout" :class="{ 'has-feed': hasFeed }">
      <template v-if="hasFeed">
        <div class="feed-left">
          <slot name="left" />
        </div>
        <div class="admin-content">
          <slot name="header" />
          <slot />
        </div>
        <div class="feed-right">
          <slot name="right" />
        </div>
      </template>
      <template v-else-if="noSidebar">
        <div class="admin-content">
          <slot name="header" />
          <slot />
        </div>
      </template>
      <template v-else>
        <AdminSidebar />
        <div class="admin-content">
          <slot name="header" />
          <slot />
        </div>
      </template>
    </div>
  </div>
  </template>

<script setup>
import { computed, useSlots } from 'vue'
import Navbar from '@/components/common/utils/Navbar.vue';
import AdminSidebar from '../lists/AdminSidebar.vue';

const { noSidebar } = defineProps({ noSidebar: { type: Boolean, default: false } })
const slots = useSlots()
const hasFeed = computed(() => !!slots.left || !!slots.right)
</script>

<style scoped>
.admin-layout {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)));
  overflow: hidden;
}

.admin-layout.has-feed {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
}

.admin-content {
  flex: 1;
  min-width: 0;
  /* Centralise le scroll pour toutes les pages admin */
  height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)) - (2 * var(--layout-pad)));
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE et Edge */
}

.admin-content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.feed-left,
.feed-right {
  height: 100%;
  overflow-y: hidden;
}
</style>
