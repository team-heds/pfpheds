<!-- src/App.vue -->
<template>
  <div class="app-shell" :class="{ 'app-shell--immersive': isImmersiveRoute }">
    <a class="skip-link" href="#main-content">Aller au contenu principal</a>
    <!-- Cercles de fond -->
    <div v-if="!isImmersiveRoute" class="background-container">
      <div class="bg-circle_jaune"></div>
      <div class="bg-circle_violet"></div>
    </div>


    <!-- Layout de l'application -->
    <div id="main-content" class="content" tabindex="-1">
      <Toast />
      <ConfirmDialog />
      <router-view />
      <MobileBottomNav v-if="showMobileBottomNav" />
      <VersionningComponent v-if="!isImmersiveRoute" />
      <PwaInstallPrompt />
      <OfflineBanner />
      <!-- Intégration du widget ConvAI -->
      <!-- <ConvaiWidget /> -->
      <!-- Centre de notifications gamification -->
      <GamificationNotification
        v-if="gamificationUserJourneyEnabled && gamificationUserId"
        :user-id="gamificationUserId"
        :realtime-enabled="realtimeEnabled"
      />
    </div>

    <!-- Loader
    <Loader v-if="isLoading" /> -->
  </div>
</template>

<script>
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
// import ConvaiWidget from '@/components/ui/ConvaiWidget.vue';
// import Loader from '@/components/common/utils/Loader.vue'; // Import du composant Loader
import VersionningComponent from './components/common/utils/VersionningComponent.vue'; // Import du nouveau composant
import MobileBottomNav from '@/components/common/utils/MobileBottomNav.vue';
import PwaInstallPrompt from '@/components/common/utils/PwaInstallPrompt.vue';
import OfflineBanner from '@/components/common/utils/OfflineBanner.vue';
import GamificationNotification from '@/components/gamification/notifications/GamificationNotification.vue';
import questExpirationService from '@/service/questExpirationService';
import { mapState } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { gamificationFeatures } from '@/config/gamificationFeatures';
import { runtimeFeatures } from '@/config/runtimeFeatures';
import gamificationIntegration from '@/service/gamificationIntegration';
import { recordDailyVisit } from '@/utils/dailyVisit';

export default {
  name: "App",
  components: {
    Toast,
    ConfirmDialog,
    // ConvaiWidget,
    VersionningComponent,
    MobileBottomNav,
    PwaInstallPrompt,
    OfflineBanner,
    GamificationNotification,
  },
  data() {
    return {
      isLoading: true, // État de chargement
      expirationCheckInterval: null, // ID de l'intervalle d'expiration
    };
  },
  computed: {
    ...mapState(useAuthStore, {
      gamificationUserId: (store) => store.user?.id || null,
    }),
    gamificationUserJourneyEnabled() {
      return gamificationFeatures.userJourney;
    },
    realtimeEnabled() {
      return runtimeFeatures.supabaseRealtime;
    },
    showMobileBottomNav() {
      return this.$route.meta?.hideMobileNav !== true;
    },
    isImmersiveRoute() {
      return this.$route.meta?.immersive === true;
    },
    showHeaderIconsMobile() {
      const routeName = this.$route.name;
      // Liste des pages où on NE VEUT PAS les icônes
      const excluded = [
        'LoginHome',
        'CreatePostDialog',
        'StoryEditor',
        'StoryModal',
        'AddStory',
        'AddStoryCore',
        'AddStoryMobile',
        'CreateContentMobile',
      ];
      // Affiche uniquement sur mobile
      return window.innerWidth <= 600 && !excluded.includes(routeName);
    }
  },
  watch: {
    // Connexion du jour : comptée à l'ouverture, même si la session est restée active.
    gamificationUserId: {
      immediate: true,
      handler() {
        this.recordDailyVisit();
      },
    },
  },
  methods: {
    recordDailyVisit() {
      if (!this.gamificationUserJourneyEnabled || !this.gamificationUserId) return;
      recordDailyVisit({
        userId: this.gamificationUserId,
        onLogin: (userId, details) => gamificationIntegration.onLogin(userId, details),
        details: { loginMethod: 'session' },
      });
    },
    onVisibilityChange() {
      // Onglet laissé ouvert d'un jour à l'autre : le retour sur la page compte le nouveau jour.
      if (document.visibilityState === 'visible') this.recordDailyVisit();
    },
  },
  mounted() {
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    // Simuler un chargement de données (par exemple, lors du démarrage de l'application)
    setTimeout(() => {
      this.isLoading = false; // Masquer le loader après 3 secondes
    }, 3000); // Temps en millisecondes
    // 🕐 Démarrer la vérification automatique des quêtes expirées (toutes les 5 min)
    console.log('🚀 Démarrage service d\'expiration des quêtes...')
    this.expirationCheckInterval = questExpirationService.startPeriodicCheck(5)
  },
  beforeUnmount() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    // 🛑 Arrêter proprement la vérification à la fermeture de l'app
    if (this.expirationCheckInterval) {
      questExpirationService.stopPeriodicCheck(this.expirationCheckInterval)
    }
  },
};
</script>

<style scoped>
/* Contexte général de l'application */
.app-shell {
  position: relative;
  width: 100vw;
  height: 100vh;
  /* Hauteur réellement visible : sur téléphone, 100vh passe sous la barre du navigateur. */
  height: 100dvh;
  overflow: hidden; /* Keep for background */
  display: flex;
  flex-direction: column;
  /* Application installée : le contenu reste sous l'encoche et hors des bords arrondis. */
  padding-block-start: env(safe-area-inset-top, 0px);
  padding-inline: env(safe-area-inset-left, 0px) env(safe-area-inset-right, 0px);
}

:global(html),
:global(body) {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  margin: 0;
  padding: 0;
  overflow: hidden; /* Keep for background */
}

/* Conteneur des cercles */
.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
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
  flex-grow: 1; /* Take remaining space */
  overflow-y: auto; /* Allow scrolling */
  padding: var(--content-pad);
}

.app-shell--immersive {
  background: #ffffff;
}

.app-shell--immersive .content {
  padding: 0;
  background: #ffffff;
}

/* Responsive : masquer les cercles sur mobile */
@media (max-width: 768px) {
  .background-container {
    display: none;
  }

  .content {
    padding-block-end: calc(var(--content-pad) + 4.5rem + env(safe-area-inset-bottom, 0px));
  }
}
</style>
