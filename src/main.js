import { createApp, reactive } from 'vue';
import { createPinia } from 'pinia';
import { onAuthStateChanged } from 'firebase/auth';
import PrimeVue from 'primevue/config';
import BadgeDirective from 'primevue/badgedirective';
import ConfirmationService from 'primevue/confirmationservice';
import DialogService from 'primevue/dialogservice';
import Ripple from 'primevue/ripple';
import StyleClass from 'primevue/styleclass';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';

import App from './App.vue';
import router from './router';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { auth, isFirebaseEnabled } from '@/firebase';

import '@/assets/styles/styles.scss';
import 'primeflex/primeflex.css';
import '@/assets/styles/mobile-scale.css';

const APP_VERSION = '0.1.100';

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

const userState = reactive({
  user: null
});

if (isFirebaseEnabled && auth) {
  onAuthStateChanged(auth, async (user) => {
    userState.user = user;

    if (user) {
      try {
        const { default: gamificationIntegration } = await import('@/service/gamificationIntegration');
        await gamificationIntegration.onLogin(user.uid, {
          loginTime: Date.now(),
          loginMethod: 'firebase_auth',
          deviceType: window.innerWidth <= 768 ? 'mobile' : 'desktop'
        });
      } catch (error) {
        console.error('Erreur lors du declenchement gamification a la connexion:', error);
      }
    }
  });
} else {
  userState.user = null;
}

app.provide('userState', userState);

app.directive('tooltip', Tooltip);
app.directive('badge', BadgeDirective);
app.directive('ripple', Ripple);
app.directive('styleclass', StyleClass);

async function bootstrap() {
  const authStore = useAuthStore();
  const userStore = useUserStore();

  try {
    await authStore.initializeAuth();
    await userStore.init();
    await router.isReady();
    console.log('Application et authentification initialisees');
  } catch (error) {
    console.error('Erreur lors du bootstrap applicatif:', error);
  } finally {
    app.mount('#app');
  }
}

bootstrap();
