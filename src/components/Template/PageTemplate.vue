<template>
  <Navbar />
  <div class="three-column-layout">
    <!-- Sidebar gauche -->
    <aside class="sidebar-left">
      <slot name="left">
        <LeftSidebar />
      </slot>
    </aside>
    <!-- Contenu principal -->
    <main class="main-content">
      <slot>
        <MainContent />
      </slot>
    </main>
    <!-- Sidebar droite -->
    <aside class="sidebar-right">
      <slot name="right">
        <RightSidebar />
      </slot>
    </aside>
  </div>
</template>

<script setup>
import Navbar from '@/components/Utils/Navbar.vue'
import LeftSidebar from '@/components/Bibliotheque/Social/LeftSidebar.vue'
import MainContent from '@/components/Bibliotheque/Social/MainFeed.vue'
import RightSidebar from '@/components/Bibliotheque/Social/RightSidebar.vue'
</script>

<style scoped>
html, body {
  scrollbar-width: none !important;      /* Firefox */
  -ms-overflow-style: none !important;   /* IE/Edge */
}
html::-webkit-scrollbar, body::-webkit-scrollbar {
  width: 0 !important;
  display: none !important;
  background: transparent !important;
}
.three-column-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  gap: 1.5rem;
  min-height: 100vh;
}
.sidebar-left,
.sidebar-right {
  overflow-y: scroll;
  padding: 1.5rem 1rem;
  min-width: 220px;
  scrollbar-width: none !important; /* Firefox */
  -ms-overflow-style: none !important; /* IE/Edge */
}
.sidebar-left::-webkit-scrollbar,
.sidebar-right::-webkit-scrollbar {
  width: 0 !important;
  background: transparent !important;
  display: none !important;
}
.main-content {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem 0;
  min-width: 0;
  scrollbar-width: none !important;
}
.main-content::-webkit-scrollbar {
  width: 0 !important;
  background: transparent !important;
  display: none !important;
}
@media (max-width: 900px) {
  .three-column-layout {
    grid-template-columns: 1fr;
  }
  .sidebar-left,
  .sidebar-right {
    display: none;
  }
  .main-content {
    padding: 1rem 0.5rem;
  }
}
</style>
