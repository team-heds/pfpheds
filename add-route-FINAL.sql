-- ========================================
-- VERSION FINALE CORRIGÉE
-- ========================================
-- Basée sur la structure exacte de la table dynamic_routes

-- Supprimer si existe
DELETE FROM dynamic_routes 
WHERE path = '/admin/formation-pratique/assign-repondants-ba25';

-- Insertion avec les BONS types de données
INSERT INTO dynamic_routes (
  path,
  name,
  component_path,
  requires_auth,
  is_active,
  need,              -- JSONB !
  menu_section,
  menu_label,
  menu_icon,
  menu_order,
  props              -- boolean !
) VALUES (
  '/admin/formation-pratique/assign-repondants-ba25',
  'AssignRepondantsBA25',
  '@/views/admin/AssignRepondantsView.vue',
  true::boolean,                    -- requires_auth
  true::boolean,                    -- is_active
  '"page1.access"'::jsonb,          -- need (string JSON)
  'Formation Pratique Physio',      -- menu_section
  'Assignation Répondants BA25',    -- menu_label
  'pi pi-user-edit',                -- menu_icon
  525::integer,                     -- menu_order
  false::boolean                    -- props
);

-- Vérifier le résultat
SELECT 
  path, 
  name, 
  component_path, 
  requires_auth, 
  is_active, 
  need,
  menu_label,
  menu_order,
  props
FROM dynamic_routes 
WHERE path = '/admin/formation-pratique/assign-repondants-ba25';
