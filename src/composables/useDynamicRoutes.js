import { supabase } from '@/supabase';

const DEBUG_DYNAMIC_ROUTES = import.meta.env.VITE_DEBUG_DYNAMIC_ROUTES === 'true';
const debugDynRoutes = (...args) => {
  if (DEBUG_DYNAMIC_ROUTES) console.debug('[DynRoutes]', ...args);
};

const viewModules = {
  ...import.meta.glob('@/views/**/*.vue'),
  ...import.meta.glob('@/components/**/*.vue')
};

const LEGACY_COMPONENT_ALIASES = new Map([
  ['/src/views/home/Pushview.vue', '/src/views/home/PushView.vue'],
  ['/src/views/home/Pushview2.vue', '/src/views/home/PushView2.vue'],
  ['/src/views/auth/LoginHome2.vue', '/src/views/auth/LoginHome.vue'],
  ['/src/views/admin/votations/VotationView.vue', '/src/views/admin/votations/VotationGenericView.vue'],
  ['/src/views/admin/formation-pratique/ProfilRepondantEnseignantViewPHYFP.vue', '/src/views/admin/formation-pratique/ProfileRepondantView.vue']
]);

const DEFAULT_NEED_AUTHENTICATED = 'authenticated';
const DEFAULT_NEED_PUBLIC = 'public';

function normalizeComponentPath(pathFromDb) {
  if (!pathFromDb) {
    throw new Error('component_path manquant pour une route dynamique');
  }

  let p = String(pathFromDb).trim();

  if (p.startsWith('@/')) {
    p = p.replace(/^@/, '/src');
  } else if (p.startsWith('/views/')) {
    p = p.replace(/^\/views/, '/src/views');
  } else if (p.startsWith('views/')) {
    p = '/src/' + p;
  } else if (p.startsWith('/components/')) {
    p = p.replace(/^\/components/, '/src/components');
  } else if (p.startsWith('components/')) {
    p = '/src/' + p;
  }

  return p;
}

function findCaseInsensitiveModuleKey(targetKey) {
  const normalizedTarget = String(targetKey || '').toLowerCase();
  return Object.keys(viewModules).find(key => key.toLowerCase() === normalizedTarget) || null;
}

function resolveAliasedComponentKey(key) {
  if (viewModules[key]) return key;

  const aliasKey = LEGACY_COMPONENT_ALIASES.get(key);
  if (aliasKey && viewModules[aliasKey]) return aliasKey;

  const caseInsensitiveKey = findCaseInsensitiveModuleKey(key);
  if (caseInsensitiveKey) return caseInsensitiveKey;

  if (aliasKey) {
    const aliasCaseInsensitiveKey = findCaseInsensitiveModuleKey(aliasKey);
    if (aliasCaseInsensitiveKey) return aliasCaseInsensitiveKey;
  }

  return null;
}

function resolveView(componentPathFromDb) {
  const key = normalizeComponentPath(componentPathFromDb);
  const resolvedKey = resolveAliasedComponentKey(key);
  const loader = resolvedKey ? viewModules[resolvedKey] : null;

  if (!loader) {
    debugDynRoutes(`view introuvable: "${componentPathFromDb}" (cle: "${key}")`);
  }

  return loader;
}

export async function loadDynamicRoutes() {
  try {
    const { data, error } = await supabase
      .from('dynamic_routes')
      .select('*')
      .eq('is_active', true)
      .order('menu_order', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205') {
        debugDynRoutes('table dynamic_routes absente, routes dynamiques desactivees pour cet environnement');
      } else {
        console.error('Erreur recuperation routes dynamiques:', error);
      }
      return [];
    }

    if (!data || data.length === 0) {
      debugDynRoutes('aucune route dynamique trouvee dans Supabase');
      return [];
    }

    return data
      .map((route) => {
        if (!route.path || !route.name || !route.component_path) {
          debugDynRoutes('route dynamique ignoree (incomplete):', route);
          return null;
        }

        let component;
        try {
          component = resolveView(route.component_path);
        } catch (e) {
          console.error('Impossible de resoudre le composant pour route dynamique:', route, e);
          return null;
        }

        const meta = {
          requiresAuth: route.requires_auth ?? false,
          dynamic: true
        };

        if (route.need !== null && route.need !== undefined) {
          meta.need = route.need;
        } else {
          meta.need = meta.requiresAuth ? DEFAULT_NEED_AUTHENTICATED : DEFAULT_NEED_PUBLIC;
        }

        if (route.menu_section) {
          meta.menuSection = route.menu_section;
          meta.menuLabel = route.menu_label;
          meta.menuIcon = route.menu_icon;
          meta.menuOrder = route.menu_order;
        }

        return {
          path: route.path,
          name: route.name,
          component,
          meta,
          props: route.props || false
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Erreur fatale lors du chargement des routes dynamiques:', error);
    return [];
  }
}

export async function addDynamicRoutesToRouter(router) {
  const dynamicRoutes = await loadDynamicRoutes();

  const protectedRoutes = [
    'AdminDashboardGeneral',
    'DashboardRM',
    'DashboardEnseignant',
    'AdminDashboardPFP',
    'AdminDashboardAcademique',
    'AdminDashboardGamification',
    'AnalyticsDashboardView',
    'AlertsDashboard',
    'AdminSettingsView',
    'SupabaseDiagnosticView',
    'AdminDefisView',
    'RBACAdmin',
    'DynamicRoutesEditor',
    'VotationView',
    'VotationViewPFP1B',
    'Ventriglisse3D',
    'GameView',
    'GameHub',
    'RomRunnerView',
    'TournoisView',
    'TournoiDetailsView'
  ];

  dynamicRoutes.forEach((route) => {
    if (!route) return;
    if (protectedRoutes.includes(route.name)) return;

    const hasValidComponent = typeof route.component === 'function';
    if (!hasValidComponent) {
      debugDynRoutes('ignoree (component introuvable):', route.path);
      return;
    }

    const pathAlreadyExists = router.getRoutes().some(r => r.path === route.path);
    if (pathAlreadyExists) {
      debugDynRoutes('ignoree (path deja present):', route.path);
      return;
    }

    if (router.hasRoute(route.name)) {
      debugDynRoutes(`"${route.name}" existe deja, remplacement`);
      router.removeRoute(route.name);
    }

    router.addRoute(route);
  });
}

export async function reloadDynamicRoutes(router) {
  const allRoutes = router.getRoutes();
  allRoutes.forEach((route) => {
    if (route.meta && route.meta.dynamic) {
      router.removeRoute(route.name);
    }
  });

  await addDynamicRoutesToRouter(router);
}

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
        need: route.need
      });
    });

    return sections;
  } catch (error) {
    console.error('Erreur recuperation routes pour menu:', error);
    return {};
  }
}
