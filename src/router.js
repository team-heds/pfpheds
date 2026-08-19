import { createRouter, createWebHistory } from 'vue-router';
import '@/firebase';
import { useAuthStore } from '@/stores/authStore';
import rolesService from '@/service/rolesService';
import { useRoleStore } from '@/stores/role';
import { addDynamicRoutesToRouter } from '@/composables/useDynamicRoutes';
import routes from '@/router/routes/index';

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
let isAuthStateChecked = false;
let dynamicRoutesLoaded = false;
const AUTH_BYPASS = import.meta.env.VITE_DISABLE_AUTH === 'true';

const ROUTER_DEBUG = import.meta.env.VITE_DEBUG_ROUTER === 'true';
const debugRouter = (...args) => {
  if (ROUTER_DEBUG) console.log(...args);
};

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const roleStore = useRoleStore();
  debugRouter(`🧭 Navigation vers: ${to.path} depuis: ${from.path}`);

  // Les callbacks de récupération contiennent un code éphémère. Ils doivent
  // atteindre leur écran immédiatement, sans dépendre du chargement des routes
  // dynamiques ni d'une vérification de session ordinaire.
  if (to.path === '/reset-password' || to.path === '/new-password') {
    return next();
  }
  
  // 🔥 Charger les routes dynamiques depuis Supabase au premier appel
  if (!dynamicRoutesLoaded) {
    debugRouter('🔄 Chargement des routes dynamiques depuis Supabase...');
    try {
      await addDynamicRoutesToRouter(router);
      dynamicRoutesLoaded = true;
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
  
  if (AUTH_BYPASS) {
    if (to.path === '/') return next('/home');
    return next();
  }

  // Vérifiez si l'état d'authentification est déjà récupéré
  if (!isAuthStateChecked) {
    await authStore.checkAuthState();
    isAuthStateChecked = true;
  }
  // Initialiser le roleStore si nécessaire
if (!roleStore.initialized) {
  await roleStore.init();
}
  
  const user = authStore.user;

  // Gestion spécifique pour la route "/"
  if (to.path === '/') {
    if (user) {
      // Si l'utilisateur est connecté, redirigez vers /feed
      return next('/feed');
    }
    // Sinon, continuez vers la page de login ("/")
    return next('/home');
  }

  // Vérification des permissions basées sur le roleStore
const need = to.meta.need;

// Autoriser immédiatement si 'public' ou 'anonymous'
const allowAnon = Array.isArray(need)
  ? (need.includes('public') || need.includes('anonymous'))
  : (need === 'public' || need === 'anonymous');
if (allowAnon) {
  return next();
}

// Si une permission est requise et qu'aucun utilisateur, rediriger vers login
if (need && !user) {
  console.warn('❌ Accès refusé: authentification requise pour cette page');
  return next('/');
}

// Autoriser tous les utilisateurs connectés pour le besoin par défaut 'authenticated'
const allowAuth = Array.isArray(need)
  ? need.includes('authenticated')
  : need === 'authenticated';
if (allowAuth) {
  return next();
}

if (need) {
  const canAccess = Array.isArray(need)
    ? (roleStore.isSuper || need.some(n => roleStore.can(n)))
    : (roleStore.isSuper || roleStore.can(need));

  if (!canAccess) {
    console.warn(`❌ Accès refusé: permission requise "${Array.isArray(need) ? need.join(',') : need}" manquante`);
    return next({ path: '/access' });
  }
}

  // Vérification des rôles (schéma historique) via meta.requiredRole
  const requiredRoles = to.meta.requiredRole;
  if (requiredRoles && user) {
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRequired = roleStore.isSuper || rolesArray.some(r => roleStore.can(r));
    if (!hasRequired) {
      console.warn(`❌ Accès refusé: rôle requis manquant parmi [${rolesArray.join(', ')}]`);
      return next({ path: '/access' });
    }
  }

  // Gestion des routes nécessitant une authentification
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (user) {
      // Si pas de rôle requis, autoriser directement l'accès
      if (!to.meta.requiredRole) {
        return next();
      }
      
      // Sinon, vérifier les rôles
      const userId = authStore.isFirebaseUser ? user.uid : user.id;
      const provider = authStore.authProvider;
      
      
      // Récupération des rôles via le service unifié
      const roles = await rolesService.getUserRoles(userId, provider);

      if (roles && Object.keys(roles).length > 0) {
        const userRoles = Object.keys(roles).filter(role => roles[role]); // Récupération des rôles actifs de l'utilisateur

        const requiredRoles = Array.isArray(to.meta.requiredRole)
          ? to.meta.requiredRole
          : [to.meta.requiredRole];

        // Vérifiez si l'utilisateur a au moins un des rôles requis
        if (requiredRoles.some(role => userRoles.includes(role))) {
          return next();
        } else {
          console.warn(`❌ Accès refusé: rôles requis ${requiredRoles.join(', ')}, rôles utilisateur: ${userRoles.join(', ')}`);
          alert('Accès refusé: Vous n\'avez pas les permissions requises.');
          return next('/');
        }
      } else {
        // Pas de rôles trouvés mais rôle requis
        console.warn('⚠️ Aucun rôle trouvé pour cet utilisateur');
        import('primevue/usetoast').then(({ useToast }) => {
          const toast = useToast();
          toast.add({ severity: 'error', summary: 'Accès refusé', detail: 'Aucun rôle trouvé.', life: 4000 });
        });
        return next('/home');
      }
    } else {
      import('primevue/usetoast').then(({ useToast }) => {
        const toast = useToast();
        toast.add({ severity: 'warn', summary: 'Connexion requise', detail: 'Vous devez être connecté pour accéder à cette page.', life: 4000 });
      });
      return next('/'); // Redirigez vers la page de connexion
    }
  } else {
    return next(); // Aucune authentification requise, autorisez l'accès
  }
});

export default router;
