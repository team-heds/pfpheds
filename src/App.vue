<!-- src/App.vue -->
<template>
  <div id="app">
    <!-- Cercles de fond -->
    <div class="background-container">
      <div class="bg-circle_jaune"></div>
      <div class="bg-circle_violet"></div>
    </div>

    <!-- Contenu de l'application -->
    <div class="content">
      <Toast />
      <router-view />

      <!-- Intégration du widget ConvAI -->
      <ConvaiWidget />
    </div>

    <!-- Loader -->
    <Loader v-if="isLoading" />
  </div>
</template>

<script>
import Toast from 'primevue/toast';
import ConvaiWidget from './components/ConvaiWidget.vue'; // Import du composant ConvaiWidget
import Loader from './components/Utils/Loader.vue'; // Import du composant Loader

export default {
  name: "App",
  components: {
    Toast,
    ConvaiWidget, // Déclaration du composant
    Loader, // Déclaration du composant Loader
  },
  data() {
    return {
      isLoading: true, // État de chargement
    };
  },
  mounted() {
    // Simuler un chargement de données (par exemple, lors du démarrage de l'application)
    setTimeout(() => {
      this.isLoading = false; // Masquer le loader après 3 secondes
    }, 3000); // Temps en millisecondes
  },
};
</script>

<style scoped>
/* Contexte général de l'application */
#app {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

/* Conteneur des cercles */
.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1; /* Envoyer en arrière-plan */
  display: flex;
  justify-content: space-between;
  pointer-events: none; /* Empêche toute interaction avec les cercles */
}

/* Styles des cercles */
.bg-circle_jaune {
  width: 800px;
  height: 800px;
  border-radius: 50%;
  background: linear-gradient(129.96deg, #f1d063, #eff3f8);
  position: absolute;
  top: -35%;
  left: -200px;
  opacity: 0.5;
}

.bg-circle_violet {
  width: 800px;
  height: 800px;
  border-radius: 50%;
  background: linear-gradient(129.96deg, #6366f1, #eff3f8);
  position: absolute;
  bottom: -15%;
  right: -50%;
  transform: rotate(60deg);
  transform-origin: 0 0;
  opacity: 0.25;
}

/* Contenu de l'application */
.content {
  position: relative;
  z-index: 1; /* S'assurer que le contenu est au-dessus */
  min-height: 100vh;
  padding: 1rem;
}

/* Responsive : masquer les cercles sur mobile */
@media (max-width: 768px) {
  .background-container {
    display: none;
  }
}
</style>
