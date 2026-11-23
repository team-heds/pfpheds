import { createApp, nextTick, watch } from 'vue';
import { createPinia } from 'pinia';
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
import { bootstrapApplication } from '@/service/appBootstrap';
import { bootstrapFailureMessage, markStartupConnectivity } from '@/service/startupConnectivity';
import { installPageNavigation } from '@/service/pageNavigationService';
import { NOTIFICATION_NAVIGATE, isInternalPath } from '@/utils/notificationClick';
import { clearPageListContexts, disposePageListContexts } from '@/composables/usePageListContext';

import { primevueLocaleFr } from '@/config/primevueLocaleFr';
import '@/assets/styles/styles.scss';
import 'primeflex/primeflex.css';
import '@/assets/styles/platform-foundations.scss';
import '@/assets/styles/si-admin-system.scss';
import { hideAppSplash } from '@/utils/appSplash';
import { initTheme } from '@/theme/themeService';
import { useTheme } from '@/theme/useTheme';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
navigator.serviceWorker?.addEventListener('message', (event) => {
  if (event.data?.type !== NOTIFICATION_NAVIGATE || !isInternalPath(event.data.url)) return;
  router.push(event.data.url).catch(() => {});
});
app.use(PrimeVue, { ripple: true, locale: primevueLocaleFr });
app.use(ToastService);
app.use(DialogService);
app.use(ConfirmationService);

const pageNavigation = installPageNavigation(router, { nextTick });
const stopNavigationAccountWatch = watch(
  () => useAuthStore(pinia).user?.id || null,
  () => {
    clearPageListContexts();
    pageNavigation.clearHistory();
    void pageNavigation.refresh();
  },
  { flush: 'sync' },
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopNavigationAccountWatch();
    pageNavigation.dispose();
    disposePageListContexts();
  });
}

app.directive('tooltip', Tooltip);
app.directive('badge', BadgeDirective);
app.directive('ripple', Ripple);
app.directive('styleclass', StyleClass);

async function bootstrap() {
  // Thème choisi (déjà posé par index.html) : feuilles dans le bon ordre, suivi du système.
  initTheme();
  // Garde le réglage de mise en page des anciennes pages accordé au thème.
  useTheme();
  const authStore = useAuthStore();
  const userStore = useUserStore();

  const showBootstrapFailure = (error, { retry }) => {
    // Sans réseau, l'écran « Hors ligne » est le seul message.
    if (markStartupConnectivity(error)) return;
    queueMicrotask(() => {
      let notice = document.getElementById('bootstrap-retry-notice');
      if (!notice) {
        notice = document.createElement('aside');
        notice.id = 'bootstrap-retry-notice';
        notice.setAttribute('role', 'alert');
        notice.style.cssText = 'position:fixed;inset:auto 1rem 1rem;z-index:10000;padding:1rem;border-radius:.75rem;background:#07182c;color:#fff;box-shadow:0 1rem 3rem rgba(0,0,0,.35);display:flex;gap:.75rem;align-items:center;justify-content:center;';
        notice.innerHTML = '<span></span><button type="button" style="border:0;border-radius:.5rem;padding:.65rem 1rem;background:#f3c300;color:#07182c;font-weight:700;cursor:pointer">Réessayer</button>';
        document.body.appendChild(notice);
        // Une coupure survenue pendant le chargement : on repart dès le retour du réseau.
        window.addEventListener('online', () => window.location.reload(), { once: true });
      }

      notice.querySelector('span').textContent = bootstrapFailureMessage(error);
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
    mount: () => {
      markStartupConnectivity();
      app.mount('#app');
      hideAppSplash();
      void pageNavigation.refresh();
    },
    onError: showBootstrapFailure,
  });
}

bootstrap();
