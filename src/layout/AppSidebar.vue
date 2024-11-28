<script setup>
import AppMenu from './AppMenu.vue';
import { useLayout } from '@/layout/composables/layout';


const { layoutState } = useLayout();

let timeout = null;

const onMouseEnter = () => {
  if (!layoutState.anchored.value) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    layoutState.sidebarActive.value = true;
  }
};

const onMouseLeave = () => {
  if (!layoutState.anchored.value) {
    if (!timeout) {
      timeout = setTimeout(() => (layoutState.sidebarActive.value = false), 300);
    }
  }
};

const anchor = () => {
  layoutState.anchored.value = !layoutState.anchored.value;
};
</script>

<template>
  <div @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <div class="sidebar-header">
      <router-link :to="{ name: 'DashbordAdmin' }" class="app-logo">
        <a href="/">
        <img class="img-heds" src="../../public/assets/images/FR-DE_HEdS.png" alt="Description">
        </a>
      </router-link>
      <button class="layout-sidebar-anchor p-link z-2 mb-2" type="button" @click="anchor()"></button>
    </div>
    <div class="layout-menu-container">
      <AppMenu />
    </div>
  </div>
</template>
<style lang="scss" scoped>

.img-heds {
  width: 180px;
  height: auto;
}

</style>
