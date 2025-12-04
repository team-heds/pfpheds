-- ========================================
-- MIGRATION: Add Documentation Routes System
-- Date: 2024-12-03
-- Description: Table pour gérer les routes de documentation avec accès admin
-- ========================================

-- ========================================
-- 1. CREATE DOCUMENTATION ROUTES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.documentation_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_path TEXT NOT NULL UNIQUE,
  route_name TEXT NOT NULL,
  component_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'pi pi-book',
  category TEXT DEFAULT 'general',
  file_path TEXT,
  is_active BOOLEAN DEFAULT true,
  required_roles TEXT[] DEFAULT ARRAY['admin']::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_documentation_routes_active ON public.documentation_routes(is_active);
CREATE INDEX IF NOT EXISTS idx_documentation_routes_category ON public.documentation_routes(category);
CREATE INDEX IF NOT EXISTS idx_documentation_routes_path ON public.documentation_routes(route_path);

-- ========================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Activer RLS sur la table
ALTER TABLE public.documentation_routes ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : Seulement les admins peuvent voir les routes
CREATE POLICY "Admins can view documentation routes"
  ON public.documentation_routes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Politique de création : Seulement les admins peuvent créer des routes
CREATE POLICY "Admins can create documentation routes"
  ON public.documentation_routes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Politique de mise à jour : Seulement les admins peuvent modifier
CREATE POLICY "Admins can update documentation routes"
  ON public.documentation_routes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Politique de suppression : Seulement les admins peuvent supprimer
CREATE POLICY "Admins can delete documentation routes"
  ON public.documentation_routes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ========================================
-- 3. TRIGGER POUR UPDATED_AT
-- ========================================

CREATE OR REPLACE FUNCTION public.update_documentation_routes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_documentation_routes_timestamp
  BEFORE UPDATE ON public.documentation_routes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_documentation_routes_updated_at();

-- ========================================
-- 4. FONCTION HELPER POUR VÉRIFIER L'ACCÈS
-- ========================================

CREATE OR REPLACE FUNCTION public.user_can_access_documentation_route(
  p_route_path TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_required_roles TEXT[];
  v_user_roles TEXT[];
  v_has_access BOOLEAN := false;
BEGIN
  -- Récupérer les rôles requis pour cette route
  SELECT required_roles INTO v_required_roles
  FROM public.documentation_routes
  WHERE route_path = p_route_path
  AND is_active = true;

  -- Si la route n'existe pas ou n'est pas active
  IF v_required_roles IS NULL THEN
    RETURN false;
  END IF;

  -- Récupérer les rôles de l'utilisateur
  SELECT ARRAY_AGG(role) INTO v_user_roles
  FROM public.user_roles
  WHERE user_id = p_user_id;

  -- Vérifier si l'utilisateur a au moins un des rôles requis
  SELECT EXISTS (
    SELECT 1
    FROM unnest(v_required_roles) AS required_role
    WHERE required_role = ANY(v_user_roles)
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 5. INSERT DOCUMENTATION ROUTES
-- ========================================

-- Insérer la route de documentation PrimeVue
INSERT INTO public.documentation_routes (
  route_path,
  route_name,
  component_name,
  title,
  description,
  icon,
  category,
  file_path,
  required_roles,
  is_active
) VALUES (
  '/docs/primevue',
  'PrimeVueDocs',
  'PrimeVueDocsView',
  'Documentation PrimeVue',
  'Documentation complète des composants et fonctionnalités PrimeVue pour le développement d''interfaces utilisateur modernes',
  'pi pi-book',
  'development',
  '/Primevue/llms-full.txt',
  ARRAY['admin']::TEXT[],
  true
) ON CONFLICT (route_path) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  file_path = EXCLUDED.file_path,
  required_roles = EXCLUDED.required_roles,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Insérer d'autres routes de documentation si nécessaire
INSERT INTO public.documentation_routes (
  route_path,
  route_name,
  component_name,
  title,
  description,
  icon,
  category,
  required_roles,
  is_active
) VALUES 
(
  '/docs/vue',
  'VueDocs',
  'VueDocsView',
  'Documentation Vue.js',
  'Documentation du framework Vue.js 3 - Composition API, Reactivity, Components',
  'pi pi-code',
  'development',
  ARRAY['admin', 'developer']::TEXT[],
  false -- Désactivée par défaut, à activer quand le contenu sera disponible
),
(
  '/docs/firebase',
  'FirebaseDocs',
  'FirebaseDocsView',
  'Documentation Firebase',
  'Guide d''utilisation de Firebase - Authentication, Realtime Database, Storage',
  'pi pi-database',
  'development',
  ARRAY['admin', 'developer']::TEXT[],
  false
),
(
  '/docs/supabase',
  'SupabaseDocs',
  'SupabaseDocsView',
  'Documentation Supabase',
  'Guide complet de Supabase - PostgreSQL, Auth, RLS, Storage',
  'pi pi-cloud',
  'development',
  ARRAY['admin', 'developer']::TEXT[],
  false
),
(
  '/docs/api',
  'ApiDocs',
  'ApiDocsView',
  'Documentation API',
  'Documentation des APIs internes et externes de l''application',
  'pi pi-server',
  'api',
  ARRAY['admin', 'developer']::TEXT[],
  false
),
(
  '/docs/user-guide',
  'UserGuideDocs',
  'UserGuideDocsView',
  'Guide Utilisateur',
  'Manuel d''utilisation de l''application pour les utilisateurs finaux',
  'pi pi-users',
  'user-help',
  ARRAY['admin', 'teacher', 'student']::TEXT[],
  false
)
ON CONFLICT (route_path) DO NOTHING;

-- ========================================
-- 6. CREATE VIEW POUR FACILITER LES REQUÊTES
-- ========================================

CREATE OR REPLACE VIEW public.active_documentation_routes AS
SELECT 
  id,
  route_path,
  route_name,
  component_name,
  title,
  description,
  icon,
  category,
  file_path,
  required_roles,
  created_at,
  updated_at
FROM public.documentation_routes
WHERE is_active = true
ORDER BY category, title;

-- Donner accès à la vue
GRANT SELECT ON public.active_documentation_routes TO authenticated;

-- ========================================
-- 7. FONCTION POUR RÉCUPÉRER LES ROUTES D'UN UTILISATEUR
-- ========================================

CREATE OR REPLACE FUNCTION public.get_user_documentation_routes(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  id UUID,
  route_path TEXT,
  route_name TEXT,
  component_name TEXT,
  title TEXT,
  description TEXT,
  icon TEXT,
  category TEXT,
  file_path TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dr.id,
    dr.route_path,
    dr.route_name,
    dr.component_name,
    dr.title,
    dr.description,
    dr.icon,
    dr.category,
    dr.file_path
  FROM public.documentation_routes dr
  WHERE dr.is_active = true
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
    AND ur.role = ANY(dr.required_roles)
  )
  ORDER BY dr.category, dr.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. COMMENTAIRES POUR DOCUMENTATION
-- ========================================

COMMENT ON TABLE public.documentation_routes IS 'Table pour gérer les routes de documentation avec contrôle d''accès par rôle';
COMMENT ON COLUMN public.documentation_routes.route_path IS 'Chemin de la route (ex: /docs/primevue)';
COMMENT ON COLUMN public.documentation_routes.route_name IS 'Nom de la route pour Vue Router';
COMMENT ON COLUMN public.documentation_routes.component_name IS 'Nom du composant Vue associé';
COMMENT ON COLUMN public.documentation_routes.required_roles IS 'Liste des rôles autorisés à accéder à cette route';
COMMENT ON COLUMN public.documentation_routes.file_path IS 'Chemin du fichier de documentation (si applicable)';
COMMENT ON COLUMN public.documentation_routes.category IS 'Catégorie de la documentation (development, api, user-help, etc.)';

COMMENT ON FUNCTION public.user_can_access_documentation_route IS 'Vérifie si un utilisateur peut accéder à une route de documentation';
COMMENT ON FUNCTION public.get_user_documentation_routes IS 'Retourne toutes les routes de documentation accessibles pour un utilisateur';

-- ========================================
-- MIGRATION TERMINÉE
-- ========================================

-- Log de la migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 0020_add_documentation_routes completed successfully';
  RAISE NOTICE 'Created table: documentation_routes';
  RAISE NOTICE 'Created RLS policies for admin-only access';
  RAISE NOTICE 'Inserted route: /docs/primevue (active)';
  RAISE NOTICE 'Inserted 5 additional documentation routes (inactive)';
END $$;
