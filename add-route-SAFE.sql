-- ========================================
-- VERSION ULTRA-SÛRE
-- ========================================
-- Cette version copie exactement la structure d'une route existante
-- qui fonctionne déjà, donc aucun risque d'erreur de type

-- Supprimer si existe
DELETE FROM dynamic_routes 
WHERE path = '/admin/formation-pratique/assign-repondants-ba25';

-- Copier depuis une route Formation Pratique existante
INSERT INTO dynamic_routes (
  path,
  name,
  component_path,
  requires_auth,
  is_active,
  need,
  menu_section,
  menu_label,
  menu_icon,
  menu_order,
  props
)
SELECT 
  '/admin/formation-pratique/assign-repondants-ba25',
  'AssignRepondantsBA25',
  '@/views/admin/AssignRepondantsView.vue',
  true,
  true,
  'page1.access',
  'Formation Pratique Physio',
  'Assignation Répondants BA25',
  'pi pi-user-edit',
  525,
  props
FROM dynamic_routes 
WHERE path = '/admin/formation-pratique/profil-etudiants'
LIMIT 1
ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Vérifier le résultat
SELECT path, name, component_path, requires_auth, is_active, need, menu_label
FROM dynamic_routes 
WHERE path = '/admin/formation-pratique/assign-repondants-ba25';
