<template>
  <Navbar />
  <div class="newsfeed-layout">
    <!-- Sidebar Gauche -->
    <div class="sidebar-left">
      <LeftSidebar />
    </div>

    <!-- Fil d'actualité avec Infinity Scroll -->
    <div class="main-feed">
      <MainFeed />
    </div>

    <!-- Sidebar Droite -->
    <div class="sidebar-right">
      <RightSidebar />
    </div>
  </div>
</template>

<script>
import LeftSidebar from '@/components/Bibliotheque/Social/LeftSidebar.vue'
import MainFeed from '@/components/Bibliotheque/Social/MainFeed.vue'
import RightSidebar from '@/components/Bibliotheque/Social/RightSidebar.vue'
import Navbar from '@/components/Utils/Navbar.vue'

export default {
  components: {
    Navbar,
    LeftSidebar,
    MainFeed,
    RightSidebar
}
};
</script>

<style scoped>
/* Layout global */
.newsfeed-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr; /* Sidebar gauche, MainFeed, Sidebar droite */
  gap: 1.5rem; /* Espace entre les colonnes */
  height: 100vh; /* Hauteur fixe pour la page */
  overflow: hidden; /* Empêche tout débordement de contenu */
}

/* Sidebar Gauche */
.sidebar-left {
  overflow-y: auto; /* Permet de scroller si le contenu dépasse */
}

/* MainFeed (Infinity Scroll) */
.main-feed {
  overflow-y: scroll; /* Activer le scroll uniquement pour MainFeed */
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
</style>

