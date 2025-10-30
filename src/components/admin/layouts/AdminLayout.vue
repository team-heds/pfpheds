<template>
  <div>
    <Navbar />
    <div class="admin-layout">
      <AdminSidebar />
      <div class="admin-content">
        <slot name="header" />
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import Navbar from '@/components/common/utils/Navbar.vue';
import AdminSidebar from '../lists/AdminSidebar.vue';
</script>

<style scoped>
.admin-layout {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--surface-ground);
  min-height: calc(100vh - 80px);
}

.admin-content {
  flex: 1;
  min-width: 0;
}
</style>
