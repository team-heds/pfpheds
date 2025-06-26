<template>
  <Navbar />
  <div class="newsfeed-layout">
    <!-- Sidebar Gauche -->
    <div class="sidebar-left">
      <LeftSidebar />
    </div>

    <!-- Fil d'actualité avec Infinity Scroll -->
    <div class="main-feed" ref="mainFeed">
      <MainFeed />
    </div>

    <!-- Sidebar Droite -->
    <div class="sidebar-right">
      <RightSidebar />
    </div>
  </div>
  <MobileBottomNav :scrollTarget="mainFeedRef" />
</template>

<script>
import { ref } from 'vue';
import LeftSidebar from '@/components/Bibliotheque/Social/LeftSidebar.vue'
import MainFeed from '@/components/Bibliotheque/Social/MainFeed.vue'
import RightSidebar from '@/components/Bibliotheque/Social/RightSidebar.vue'
import Navbar from '@/components/Utils/Navbar.vue'
import MobileBottomNav from '@/components/Utils/MobileBottomNav.vue'

export default {
  components: {
    Navbar,
    LeftSidebar,
    MainFeed,
    RightSidebar,
    MobileBottomNav
  },
  setup() {
    const mainFeedRef = ref(null);
    return { mainFeedRef };
  }
};
</script>

<style scoped>
/* Layout global */
.newsfeed-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr; /* Sidebar gauche, MainFeed, Sidebar droite */
  gap: 1.5rem; /* Espace entre les colonnes */
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

/* Sidebar Gauche */
.sidebar-left {
  overflow-y: auto; /* Permet de scroller si le contenu dépasse */
}

/* MainFeed (Infinity Scroll) */
.main-feed {
  height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
  flex-direction: column;
  gap: 1rem;
  box-sizing: border-box;
  /* background: rgba(255,0,0,0.08);  temporaire debug retiré */
}

/* Masquer la barre de défilement dans le MainFeed */
.main-feed::-webkit-scrollbar {
  width: 0; /* Masque la barre de défilement */
  height: 0;
}

.main-feed {
  scrollbar-width: none; /* Masque la barre de défilement pour Firefox */
}

/* Sidebar Droite */
.sidebar-right {
  overflow-y: auto; /* Permet de scroller si nécessaire */
}

/* RESPONSIVE DESIGN */
/* Écrans d'ordinateur plus petits (13 pouces et moins) */
@media (max-width: 1366px) {
  .newsfeed-layout {
    grid-template-columns: 0.8fr 2.5fr 0.8fr;
    gap: 1rem;
  }

  .sidebar-left, .sidebar-right {
    font-size: 0.9rem;
  }
}

/* Écrans encore plus petits */
@media (max-width: 1200px) {
  .newsfeed-layout {
    grid-template-columns: 0.7fr 2.8fr 0.7fr;
    gap: 0.8rem;
  }
}

@media (max-width: 1024px) {
  .newsfeed-layout {
    grid-template-columns: 1fr 2fr;
  }
  .sidebar-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .newsfeed-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0 0.5rem;
    width: 100%;
    max-width: 100vw;
    margin: 0 auto;
    box-sizing: border-box;
    overflow-x: hidden;
  }
  .sidebar-left {
    display: none;
  }
  .main-feed {
    overflow-y: auto;
    gap: 0.5rem;
    width: 100%;
    max-width: 100vw;
    margin: 0 auto;
    box-sizing: border-box;
    overflow-x: hidden;
  }
}

@media (max-width: 480px) {
  .newsfeed-layout {
    padding: 0 0.25rem;
    width: 100%;
    max-width: 100vw;
  }
  .main-feed {
    gap: 0.25rem;
    width: 100%;
    max-width: 100vw;
  }
}

/* Ajout du bloc CSS global pour html, body, #app */
html, body, #app {
  height: 100vh !important;
  min-height: 100vh !important;
  max-height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box;
}
</style>