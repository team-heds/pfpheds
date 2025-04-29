<template>
  <ul class="sidebar-items-list">
    <li v-for="item in items" :key="item.label" class="sidebar-item">
      <template v-if="item.items">
        <div
          class="sidebar-subsection-label submenu-toggle sidebar-btn"
          @click="toggle(item)"
        >
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
          <i class="pi" :class="openItems.has(item) ? 'pi-chevron-down' : 'pi-chevron-right'" style="margin-left:auto;" />
        </div>
        <SidebarMenuItems v-if="openItems.has(item)" :items="item.items" />
      </template>
      <template v-else>
        <router-link v-if="item.to" :to="item.to" class="sidebar-link sidebar-btn">
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
        </router-link>
      </template>
    </li>
  </ul>
</template>

<script setup>
import { ref } from 'vue';
defineProps(['items']);
import SidebarMenuItems from './SidebarMenuItems.vue'; // récursif

// State for open/close
const openItems = ref(new Set());

function toggle(item) {
  if (openItems.value.has(item)) {
    openItems.value.delete(item);
  } else {
    openItems.value.add(item);
  }
  // trigger reactivity
  openItems.value = new Set(openItems.value);
}
</script>

<style scoped>
.sidebar-items-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sidebar-item {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sidebar-btn {
  background: transparent;
  color: var(--text-color, #e0e6ed);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  margin-bottom: 0.3rem;
  font-weight: 500;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  border: 1px solid transparent;
  box-shadow: none;
  cursor: pointer;
  transition: background 0.14s, color 0.14s, border 0.14s;
}
.sidebar-btn:hover, .sidebar-link.router-link-active {
  background: #232c3d18;
  color: var(--primary-color, #3b82f6);
  border: 1px solid var(--primary-color, #3b82f6);
}
.sidebar-subsection-label {
  font-weight: 500;
  font-size: 1rem;
  margin: 0.2rem 0 0.1rem 0;
  user-select: none;
  border-radius: 8px;
  width: 100%;
}
.sidebar-link {
  text-decoration: none;
  width: 100%;
}
</style>
