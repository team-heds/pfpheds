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
import { bootstrapApplication } from '@/service/appBootstrap';

import '@/assets/styles/styles.scss';
import 'primeflex/primeflex.css';
import '@/assets/styles/platform-foundations.scss';

const APP_VERSION = '0.2.9';

if ('serviceWorker' in navigator) {
  const lastVersion = localStorage.getItem('app_version');
  if (lastVersion !== APP_VERSION) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
    localStorage.setItem('app_version', APP_VERSION);
    if (lastVersion) window.location.reload();
  } else {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
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

  const showBootstrapFailure = (error, { retry }) => {
    queueMicrotask(() => {
      let notice = document.getElementById('bootstrap-retry-notice');
      if (!notice) {
        notice = document.createElement('aside');
        notice.id = 'bootstrap-retry-notice';
        notice.setAttribute('role', 'alert');
        notice.style.cssText = 'position:fixed;inset:auto 1rem 1rem;z-index:10000;padding:1rem;border-radius:.75rem;background:#07182c;color:#fff;box-shadow:0 1rem 3rem rgba(0,0,0,.35);display:flex;gap:.75rem;align-items:center;justify-content:center;';
        notice.innerHTML = '<span>Le chargement a pris trop de temps.</span><button type="button" style="border:0;border-radius:.5rem;padding:.65rem 1rem;background:#f3c300;color:#07182c;font-weight:700;cursor:pointer">Réessayer</button>';
        document.body.appendChild(notice);
      }

      const button = notice.querySelector('button');
      button.onclick = async () => {
        button.disabled = true;
        button.textContent = 'Nouvel essai…';
        if (error?.code === 'BOOTSTRAP_TIMEOUT') {
          window.location.reload();
          return;
        }
        const result = await retry();
        if (result.ok) {
          notice.remove();
          return;
        }
        button.disabled = false;
        button.textContent = 'Réessayer';
      };
    });
  };

  await bootstrapApplication({
    pathname: window.location.pathname,
    initializeAuth: () => authStore.initializeAuth(),
    initializeUser: () => userStore.init({
      session: authStore.session,
      sessionResolved: authStore.initialized,
    }),
    waitForRouter: () => router.isReady(),
    mount: () => app.mount('#app'),
    onError: showBootstrapFailure,
  });
}

bootstrap();
