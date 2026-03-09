import { supabase } from '@/supabase';

const isDev = import.meta.env.DEV;
const debugDynRoutes = (...args) => { if (isDev) console.debug('[DynRoutes]', ...args); };

// Vite va scanner et bundler toutes les vues et composants .vue utilisés par les routes dynamiques
// Inclure à la fois /views et /components pour supporter des chemins comme "@/components/games/Ventriglisse3D.vue"
const viewModules = {
  ...import.meta.glob('@/views/**/*.vue'),
  ...import.meta.glob('@/components/**/*.vue')
};

const DEFAULT_NEED = 'public';

/**
 * Normalise le component_path venant de la DB
 * pour matcher les clés de import.meta.glob.
 *
 * Ex DB possibles :
 *  "@/views/auth/LoginHome.vue"
 *  "/views/auth/LoginHome.vue"
 *  "views/auth/LoginHome.vue"
 *  "/src/views/auth/LoginHome.vue"
 */
function normalizeComponentPath(pathFromDb) {
  if (!pathFromDb) {
    throw new Error('component_path manquant pour une route dynamique');
  }

  let p = String(pathFromDb).trim();

  if (p.startsWith('@/')) {
    // "@/views/..." -> "/src/views/..."
    p = p.replace(/^@/, '/src');
  } else if (p.startsWith('/views/')) {
    // "/views/..." -> "/src/views/..."
    p = p.replace(/^\/views/, '/src/views');
  } else if (p.startsWith('views/')) {
    // "views/..." -> "/src/views/..."
    p = '/src/' + p;
  } else if (p.startsWith('/components/')) {
    // "/components/..." -> "/src/components/..."
    p = p.replace(/^\/components/, '/src/components');
  } else if (p.startsWith('components/')) {
    // "components/..." -> "/src/components/..."
    p = '/src/' + p;
  }
  // Si tu stockes déjà "/src/views/..." en DB, ça passe tel quel

  return p;
}

/**
 * Retourne la fonction de chargement de vue correspondant à component_path.
 * Vue Router accepte directement cette fonction (lazy load).
 */
function resolveView(componentPathFromDb) {
  const key = normalizeComponentPath(componentPathFromDb);
  const loader = viewModules[key];

  if (!loader) {
    console.warn(`⚠️ View non trouvée: "${componentPathFromDb}" (clé: "${key}")`)
  }

  // loader est une fonction () => import('...') déjà gérée par Vite
  return loader;
}

/**
 * Charge toutes les routes dynamiques depuis Supabase
 * @returns {Promise<Array>} Tableau de définitions de routes Vue Router
 */
export async function loadDynamicRoutes() {
  try {
    const { data, error } = await supabase
      .from('dynamic_routes')
      .select('*')
      .eq('is_active', true)
      .order('menu_order', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération routes dynamiques:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ Aucune route dynamique trouvée dans Supabase');
      return [];
    }

    const routes = data
      .map((route) => {
        if (!route.path || !route.name || !route.component_path) {
          console.warn('⚠️ Route dynamique ignorée (incomplète):', route);
          return null;
        }

        let component;
        try {
          component = resolveView(route.component_path);
        } catch (e) {
          console.error('❌ Impossible de résoudre le composant pour route dynamique:', route, e);
          // On laisse tomber cette route individuelle
          return null;
        }

        const meta = {
          requiresAuth: route.requires_auth ?? false,
          dynamic: true,
        };

        // need explicite ou défaut aligné avec ton router
        if (route.need !== null && route.need !== undefined) {
          meta.need = route.need;
        } else {
          meta.need = meta.requiresAuth ? DEFAULT_NEED : 'public';
        }

        // Infos de menu
        if (route.menu_section) {
          meta.menuSection = route.menu_section;
          meta.menuLabel = route.menu_label;
          meta.menuIcon = route.menu_icon;
          meta.menuOrder = route.menu_order;
        }

        return {
          path: route.path,
          name: route.name,
          component, // lazy loader glob
          meta,
          props: route.props || false,
        };
      })
      .filter(Boolean); // supprime les null


    return routes;
  } catch (error) {
    console.error('❌ Erreur fatale lors du chargement des routes dynamiques:', error);
    return [];
  }
}

/**
 * Ajoute les routes dynamiques au router
 * @param {Router} router - Instance du router Vue
 */
export async function addDynamicRoutesToRouter(router) {
  const dynamicRoutes = await loadDynamicRoutes();

  // Liste des routes admin à ignorer (définies statiquement dans router.js)
  const protectedRoutes = [
    'AdminDashboardGeneral',
    'DashboardRM',
    'DashboardEnseignant',
    'AdminDashboardPFP',
    'AdminDashboardAcademique',
    'AdminDashboardGamification',
    'AlertsDashboard',
    'AdminSettingsView',
    'SupabaseDiagnosticView',
    'AdminDefisView',
    'RBACAdmin',
    'DynamicRoutesEditor',
    // Routes de votation avec guards PFP
    'VotationView',
    'VotationViewPFP1B',
    // Empêcher l'écrasement des routes publiques importantes
    'Ventriglisse3D'
  ];

  dynamicRoutes.forEach((route) => {
    if (!route) return;

    // Ignorer les routes admin protégées
    if (protectedRoutes.includes(route.name)) {
      return;
    }

    // Sécurité: n'ajouter que si le composant est résolu correctement
    const hasValidComponent = typeof route.component === 'function';
    if (!hasValidComponent) {
      debugDynRoutes('ignorée (component introuvable):', route.path, route.component_path || '');
      return;
    }

    // Ne pas ajouter si un enregistrement avec le même path existe déjà
    const pathAlreadyExists = router.getRoutes().some(r => r.path === route.path);
    if (pathAlreadyExists) {
      debugDynRoutes('ignorée (path déjà présent):', route.path);
      return;
    }

    // Vérifier si la route existe déjà
    if (router.hasRoute(route.name)) {
      debugDynRoutes(`"${route.name}" existe déjà, remplacement`);
      router.removeRoute(route.name);
    }

    router.addRoute(route);
  });

}

/**
 * Reloader toutes les routes dynamiques (après modif dans l’admin)
 */
export async function reloadDynamicRoutes(router) {
  const allRoutes = router.getRoutes();
  allRoutes.forEach((route) => {
    if (route.meta && route.meta.dynamic) {
      router.removeRoute(route.name);
    }
  });

  await addDynamicRoutesToRouter(router);

}

/**
 * Récupère les routes dynamiques pour l'affichage dans le menu
 */
export async function getDynamicRoutesForMenu() {
  try {
    const { data, error } = await supabase
      .from('dynamic_routes')
      .select('*')
      .eq('is_active', true)
      .not('menu_section', 'is', null)
      .order('menu_order', { ascending: true });

    if (error) throw error;

    const sections = {};
    (data || []).forEach((route) => {
      const section = route.menu_section || 'Autre';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push({
        label: route.menu_label || route.name,
        icon: route.menu_icon || 'pi pi-circle',
        to: route.path,
        need: route.need,
      });
    });

    return sections;
  } catch (error) {
    console.error('Erreur récupération routes pour menu:', error);
    return {};
  }
}

