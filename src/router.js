import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useRoleStore } from '@/stores/role';
import { addDynamicRoutesToRouter } from '@/composables/useDynamicRoutes';
import { withTimeout } from '@/service/appBootstrap';
import routes from '@/router/routes/index';
import { evaluateRouteAccess } from '@/router/accessControl';
import {
  finishNavigationMeasurement,
  startNavigationMeasurement,
} from '@/service/navigationPerformanceService';

const DEFAULT_NEED = 'authenticated';
routes.forEach(r => {
  // Ensure meta exists
  if (!r.meta) r.meta = {};

  const hasNeed = !(r.meta.need === undefined || r.meta.need === null);
  const requires = !!r.meta.requiresAuth;

  if (!hasNeed) {
    r.meta.need = requires ? DEFAULT_NEED : 'public';
  }
});

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Ajouter un guard de navigation
let dynamicRoutesLoaded = false;
let dynamicRoutesPromise = null;
const AUTH_BYPASS = import.meta.env.VITE_DISABLE_AUTH === 'true';

const ROUTER_DEBUG = import.meta.env.VITE_DEBUG_ROUTER === 'true';
const debugRouter = (...args) => {
  if (ROUTER_DEBUG) console.log(...args);
};
let activeNavigationMeasurement = null;

async function ensureDynamicRoutes() {
  if (dynamicRoutesLoaded) return;
  if (dynamicRoutesPromise) return dynamicRoutesPromise;

  dynamicRoutesPromise = withTimeout(
    addDynamicRoutesToRouter(router),
    8_000,
    () => Object.assign(new Error('Dynamic routes loading timed out'), {
      code: 'DYNAMIC_ROUTES_TIMEOUT',
      retryable: true,
    }),
  )
    .then(() => {
      dynamicRoutesLoaded = true;
    })
    .finally(() => {
      dynamicRoutesPromise = null;
    });

  return dynamicRoutesPromise;
}

router.beforeEach(async (to, from, next) => {
  activeNavigationMeasurement = startNavigationMeasurement(to, from);
  const authStore = useAuthStore();
  const roleStore = useRoleStore();
  debugRouter(`🧭 Navigation vers: ${to.path} depuis: ${from.path}`);

  // Les callbacks de récupération contiennent un code éphémère. Ils doivent
  // atteindre leur écran immédiatement, sans dépendre du chargement des routes
  // dynamiques ni d'une vérification de session ordinaire.
  if (to.path === '/reset-password' || to.path === '/new-password') {
    return next();
  }

  if (AUTH_BYPASS) {
    if (to.path === '/') return next('/home');
    return next();
  }

  // Resolve Supabase auth before querying protected dynamic-route metadata.
  // Anonymous login pages must never generate a misleading 401 here.
  await authStore.initializeAuth();
  const user = authStore.user;
  
  // 🔥 Charger les routes dynamiques depuis Supabase au premier appel
  if (user && !dynamicRoutesLoaded) {
    debugRouter('🔄 Chargement des routes dynamiques depuis Supabase...');
    try {
      await ensureDynamicRoutes();
      debugRouter('✅ Routes dynamiques chargées');
      
      // Si la route demandée existe maintenant, y naviguer
      if (router.hasRoute(to.name) && to.name !== from.name) {
        debugRouter(`🔄 Re-navigation vers ${to.path} après chargement des routes`);
        return next({ ...to, replace: true });
      }
    } catch (error) {
      console.error('❌ Erreur chargement routes dynamiques:', error);
      // Continuer même en cas d'erreur pour ne pas bloquer l'app
    }
  }
  
  // Initialiser le roleStore si nécessaire
if (!roleStore.initialized) {
  await roleStore.init({
    session: authStore.session,
    sessionResolved: authStore.initialized,
  });
}
  
  // Gestion spécifique pour la route "/"
  if (to.path === '/') {
    if (user) {
      // Si l'utilisateur est connecté, redirigez vers /feed
      return next('/feed');
    }
    // Sinon, continuez vers la page de login ("/")
    return next('/home');
  }

  const access = evaluateRouteAccess({
    ...to.meta,
    requiresAuth: to.matched.some(record => record.meta.requiresAuth)
  }, {
    isAuthenticated: Boolean(user),
    isSuper: roleStore.isSuper,
    can: requirement => roleStore.can(requirement)
  });

  if (!access.allowed) {
    if (access.reason === 'authentication') {
      console.warn('❌ Accès refusé: authentification requise pour cette page');
      // Lien reçu de l'extérieur (QR code scanné) : revenir sur la page après la connexion.
      if (to.matched.some(record => record.meta.loginRedirect)) {
        return next({ path: '/home', query: { redirect: to.fullPath } });
      }
      return next('/');
    }

    console.warn('❌ Accès refusé: permissions de route insuffisantes', {
      reason: access.reason,
      missing: access.missing,
      path: to.path
    });
    return next({ path: '/access' });
  }

  return next();
});

router.afterEach((_to, _from, failure) => {
  finishNavigationMeasurement(activeNavigationMeasurement, { failed: Boolean(failure) });
  activeNavigationMeasurement = null;
});

export default router;
