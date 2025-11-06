import { supabase } from '@/supabase';

// Cache des composants importés dynamiquement
const componentCache = new Map();

/**
 * Charge un composant Vue dynamiquement depuis son path
 * @param {string} componentPath - Ex: '@/views/admin/DashboardView.vue'
 * @returns {Promise<Component>}
 */
async function loadComponent(componentPath) {
  // Si déjà en cache, retourner directement
  if (componentCache.has(componentPath)) {
    return componentCache.get(componentPath);
  }

  try {
    // Transformer '@/views/...' en chemin relatif depuis src
    const relativePath = componentPath.replace('@/', '../');
    
    // Import dynamique
    const module = await import(/* @vite-ignore */ relativePath);
    const component = module.default || module;
    
    // Mettre en cache
    componentCache.set(componentPath, component);
    
    return component;
  } catch (error) {
    console.error(`❌ Erreur chargement composant ${componentPath}:`, error);
    // Retourner un composant par défaut en cas d'erreur
    return {
      template: `<div class="error-component">
        <h2>Erreur de chargement</h2>
        <p>Le composant <code>${componentPath}</code> n'a pas pu être chargé.</p>
        <p class="error-message">${error.message}</p>
      </div>`,
      style: `
        .error-component { padding: 2rem; background: #fee; border: 1px solid #f00; border-radius: 0.5rem; }
        .error-message { color: #c00; font-family: monospace; }
      `
    };
  }
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

    // Transformer les données Supabase en définitions de routes Vue Router
    const routes = await Promise.all(
      data.map(async (route) => {
        const component = await loadComponent(route.component_path);

        // Construire l'objet meta
        const meta = {
          requiresAuth: route.requires_auth || false,
          dynamic: true
        };

        // need explicite ou défaut aligné avec le router local
        if (route.need !== null && route.need !== undefined) {
          meta.need = route.need;
        } else {
          meta.need = meta.requiresAuth ? 'authenticated' : 'public';
        }

        // Ajouter les infos de menu pour le sidebar
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
    );

    console.log('✅ Routes dynamiques chargées et transformées:', routes.map(r => r.path));

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

  dynamicRoutes.forEach(route => {
    // Vérifier si la route existe déjà
    if (router.hasRoute(route.name)) {
      console.warn(`⚠️ Route "${route.name}" existe déjà, elle sera remplacée`);
      router.removeRoute(route.name);
    }

    // Ajouter la route
    router.addRoute(route);
    console.log(`✅ Route ajoutée: ${route.path} (${route.name})`);
  });

  console.log(`✅ ${dynamicRoutes.length} routes dynamiques ajoutées au router`);
}

/**
 * Recharge les routes dynamiques (utile après modification dans l'admin)
 * @param {Router} router - Instance du router Vue
 */
export async function reloadDynamicRoutes(router) {
  console.log('🔄 Rechargement des routes dynamiques...');
  
  // Supprimer toutes les routes dynamiques existantes
  const allRoutes = router.getRoutes();
  allRoutes.forEach(route => {
    if (route.meta?.dynamic) {
      router.removeRoute(route.name);
    }
  });

  // Recharger depuis Supabase
  await addDynamicRoutesToRouter(router);
  
  console.log('✅ Routes dynamiques rechargées');
}

/**
 * Récupère les routes dynamiques pour l'affichage dans le menu
 * @returns {Promise<Array>} Routes organisées par section
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

    // Grouper par section
    const sections = {};
    (data || []).forEach(route => {
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
    console.error('Erreur récupération routes pour menu:', error);
    return {};
  }
}
