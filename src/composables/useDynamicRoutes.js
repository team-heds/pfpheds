import { supabase } from '@/supabase';

// Vite va scanner et bundler tous les .vue dans /src/views
const viewModules = import.meta.glob('@/views/**/*.vue');

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

  if (!loader && 1==2) {
    console.error('❌ View non trouvée pour component_path =', componentPathFromDb);
    console.error('🔑 Clé normalisée =', key);
    console.error('📚 Clés disponibles =', Object.keys(viewModules));
    throw new Error(`View not found for component_path: ${componentPathFromDb}`);
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
    console.log('🔄 Chargement des routes dynamiques depuis Supabase...');

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

    console.log(`✅ ${data.length} routes dynamiques récupérées`);

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

    console.log(
      '✅ Routes dynamiques transformées:',
      routes.map((r) => r.path)
    );

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
    'DynamicRoutesEditor'
  ];

  dynamicRoutes.forEach((route) => {
    if (!route) return;

    // Ignorer les routes admin protégées
    if (protectedRoutes.includes(route.name)) {
      console.log(`⏩ Route protégée ignorée: ${route.path} (${route.name})`);
      return;
    }

    // Vérifier si la route existe déjà
    if (router.hasRoute(route.name)) {
      console.warn(`⚠️ Route "${route.name}" existe déjà, elle sera remplacée`);
      router.removeRoute(route.name);
    }

    router.addRoute(route);
    console.log(`✅ Route ajoutée: ${route.path} (${route.name})`);
  });

  console.log(`✅ ${dynamicRoutes.length} routes dynamiques ajoutées au router`);
}

/**
 * Reloader toutes les routes dynamiques (après modif dans l’admin)
 */
export async function reloadDynamicRoutes(router) {
  console.log('🔄 Rechargement des routes dynamiques...');

  const allRoutes = router.getRoutes();
  allRoutes.forEach((route) => {
    if (route.meta && route.meta.dynamic) {
      router.removeRoute(route.name);
    }
  });

  await addDynamicRoutesToRouter(router);

  console.log('✅ Routes dynamiques rechargées');
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

