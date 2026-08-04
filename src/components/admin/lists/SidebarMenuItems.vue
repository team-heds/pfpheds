<template>
  <ul class="sidebar-items-list">
    <li v-for="item in items" :key="item.label" class="sidebar-item">
      <template v-if="item.items">
        <button
          type="button"
          class="sidebar-subsection-label submenu-toggle sidebar-btn"
          @click="toggle(item)"
          :aria-expanded="isOpen(item)"
          :style="{ paddingLeft: (12 + level * 12) + 'px' }"
        >
          <i :class="item.icon" />
          <span v-html="renderLabel(item.label)"></span>
          <i class="pi" :class="isOpen(item) ? 'pi-chevron-down' : 'pi-chevron-right'" style="margin-left:auto;" />
        </button>
        <SidebarMenuItems v-if="isOpen(item)" :items="item.items" :level="level + 1" :highlight="highlight" :counts="counts" />
      </template>
      <template v-else>
        <router-link v-if="item.to" :to="item.to" class="sidebar-link sidebar-btn" :style="{ paddingLeft: (12 + level * 12) + 'px' }">
          <i :class="item.icon" />
          <span class="sidebar-item-label" v-html="renderLabel(item.label)"></span>
          <span v-if="counts && counts[item.to] > 0" class="menu-badge">{{ counts[item.to] }}</span>
        </router-link>
      </template>
    </li>
  </ul>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  },
  level: {
    type: Number,
    default: 0
  },
  highlight: {
    type: String,
    default: ''
  },
  counts: {
    type: Object,
    default: () => ({})
  }
});
import SidebarMenuItems from './SidebarMenuItems.vue'; // récursif

// State for open/close: use labels as keys instead of object references
const openItems = ref(new Set());
const route = useRoute();

function isOpen(item) {
  return openItems.value.has(item.label);
}

function toggle(item) {
  if (openItems.value.has(item.label)) {
    openItems.value.delete(item.label);
  } else {
    openItems.value.add(item.label);
  }
  // trigger reactivity
  openItems.value = new Set(openItems.value);
}

// Helper: est-ce que un groupe contient la route active ?
function groupContainsActive(item, path) {
  if (!item || !item.items) return false;
  for (const sub of item.items) {
    if (sub.to && typeof sub.to === 'string' && path.startsWith(sub.to)) return true;
    if (sub.items && groupContainsActive(sub, path)) return true;
  }
  return false;
}

function expandGroupsForPath(path, items) {
  let changed = false;
  for (const it of items) {
    if (it.items && groupContainsActive(it, path)) {
      if (!openItems.value.has(it.label)) {
        openItems.value.add(it.label);
        changed = true;
      }
      // continuer à descendre
      expandGroupsForPath(path, it.items);
    }
  }
  if (changed) openItems.value = new Set(openItems.value);
}

onMounted(() => {
  expandGroupsForPath(route.path, Array.isArray(props.items) ? props.items : []);
});

watch(() => route.path, (p) => {
  expandGroupsForPath(p, Array.isArray(props.items) ? props.items : []);
});

function escapeRegExp(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function renderLabel(text) {
  if (!props.highlight) return String(text ?? '');
  try {
    const re = new RegExp('(' + escapeRegExp(props.highlight) + ')', 'ig');
    return String(text ?? '').replace(re, '<mark>$1</mark>');
  } catch (e) {
    return String(text ?? '');
  }
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
  min-height: 2.75rem;
  padding: 0.55rem 0.625rem;
  margin-bottom: 0.125rem;
  font-weight: 500;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  border: 1px solid transparent;
  box-shadow: none;
  cursor: pointer;
  transition: background 0.14s, color 0.14s, border 0.14s;
}
.sidebar-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sidebar-item-label {
  flex: 1;
  min-width: 0;
  line-height: 1.25;
}
.menu-badge {
  background: var(--primary-color, #3b82f6);
  color: white;
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  font-size: 0.75rem;
  line-height: 1;
}
.sidebar-btn:hover,
.sidebar-link.router-link-active,
.sidebar-link.router-link-exact-active {
  background: #232c3d18;
  color: var(--primary-color, #3b82f6);
  border: 1px solid var(--primary-color, #3b82f6);
}
.sidebar-subsection-label {
  font-weight: 600;
  font-size: 0.925rem;
  margin: 0.125rem 0;
  user-select: none;
  border-radius: 8px;
  width: 100%;
  text-align: left;
  font-family: inherit;
}
.sidebar-btn:focus-visible {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}
.sidebar-link {
  text-decoration: none;
  width: 100%;
}
</style>
