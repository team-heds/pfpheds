<template>
  <Navbar />
  <SocialThreeColumnLayout>
    <!-- Sidebar Gauche -->
    <template #left>
      <LeftSidebar />
    </template>

    <!-- Fil d'actualité avec Infinity Scroll -->
    <div class="main-feed" ref="mainFeedRef">
      <MainFeedSupabase v-if="isSupabaseUser" />
      <MainFeed v-else />
    </div>

    <!-- Sidebar Droite -->
    <template #right>
      <RightSidebar />
    </template>
  </SocialThreeColumnLayout>
  <MobileBottomNav :scrollTarget="mainFeedRef" />
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import LeftSidebar from '@/components/social/library/LeftSidebar.vue'
import MainFeed from '@/components/social/library/MainFeed.vue'
import MainFeedSupabase from '@/components/social/library/MainFeedSupabase.vue'
import RightSidebar from '@/components/social/library/RightSidebar.vue'
import Navbar from '@/components/common/utils/Navbar.vue'
import MobileBottomNav from '@/components/common/utils/MobileBottomNav.vue'
import SocialThreeColumnLayout from '@/components/common/layouts/SocialThreeColumnLayout.vue'
import { useAuthStore } from '@/stores/authStore'

export default {
  components: {
    Navbar,
    LeftSidebar,
    MainFeed,
    MainFeedSupabase,
    RightSidebar,
    MobileBottomNav,
    SocialThreeColumnLayout
  },
  setup() {
    const mainFeedRef = ref(null);
    const authStore = useAuthStore();
    onMounted(async () => {
      if (!authStore.user) {
        await authStore.checkAuthState();
      }
    });
    const isSupabaseUser = computed(() => authStore.isSupabaseUser);
    return { mainFeedRef, isSupabaseUser };
  }
};
</script>

<style scoped>
/* Layout global */
.newsfeed-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr; /* Sidebar gauche, MainFeed, Sidebar droite */
  gap: 1.5rem; /* Espace entre les colonnes */
  height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)));
  max-height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)));
  overflow: hidden;
}

/* Sidebar Gauche */
.sidebar-left {
  height: 100%;
  overflow-y: hidden; /* Sidebar statique */
}

/* MainFeed (Infinity Scroll) */
.main-feed {
  height: 100%;
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
  height: 100%;
  overflow-y: hidden; /* Sidebar statique */
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

/* Le scroll global est géré par #app (App.vue) et la zone centrale */
@media (max-width: 52rem) {
  .main-feed {
    height: auto;
    overflow: visible;
    padding-inline: clamp(0.5rem, 3vw, 1rem);
  }
}
</style>
