import { createApp, reactive } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '@/stores/authStore';

import PrimeVue from 'primevue/config';
import BadgeDirective from 'primevue/badgedirective';
import ConfirmationService from 'primevue/confirmationservice';
import DialogService from 'primevue/dialogservice';
import Ripple from 'primevue/ripple';
import StyleClass from 'primevue/styleclass';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';


import '@/assets/styles/styles.scss';
import "primeflex/primeflex.css";
import '@/assets/styles/mobile-scale.css';

import { useUserStore } from '@/stores/userStore'

const APP_VERSION = '0.1.76';
if ('serviceWorker' in navigator) {
  const lastVersion = localStorage.getItem('app_version');
  if (lastVersion !== APP_VERSION) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    });
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
    localStorage.setItem('app_version', APP_VERSION);
    if (lastVersion) window.location.reload();
  } else {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.update();
    });
  }
}

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

app.use(router);
app.use(PrimeVue, { ripple: true });
app.use(ToastService);
app.use(DialogService);
app.use(ConfirmationService);

// Créer un état réactif pour l'utilisateur
const userState = reactive({
  user: null
});

// Écouter les changements d'état d'authentification
const auth = getAuth();
onAuthStateChanged(auth, async (user) => {
  userState.user = user;
  
  // NOUVEAU : Déclencher l'intégration gamification lors de la connexion
  if (user) {
    try {
      const { default: gi } = await import('@/service/gamificationIntegration')
      await gi.onLogin(user.uid, {
        loginTime: Date.now(),
        loginMethod: 'firebase_auth',
        deviceType: window.innerWidth <= 768 ? 'mobile' : 'desktop'
      });
    } catch (error) {
      console.error('Erreur lors du déclenchement gamification à la connexion:', error);
    }
  }
});

// Créer un plugin simple pour fournir l'état de l'utilisateur à toute l'application
app.provide('userState', userState);

app.mount('#app');

// Initialiser le store d'authentification unifié
const authStore = useAuthStore();
authStore.initializeAuth().then(() => {
  console.log('🎉 Application et authentification initialisées');
});

const userStore = useUserStore()
userStore.init()

app.directive('tooltip', Tooltip);
app.directive('badge', BadgeDirective);
app.directive('ripple', Ripple);
app.directive('styleclass', StyleClass);

