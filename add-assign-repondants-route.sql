-- Script SQL pour ajouter la route d'assignation des répondants HES
-- À exécuter dans Supabase SQL Editor

-- Option 1: Si la route n'existe pas encore (première insertion)
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
  menu_order
) VALUES (
  '/admin/formation-pratique/assign-repondants-ba25',
  'AssignRepondantsBA25',
  '@/views/admin/AssignRepondantsView.vue',
  TRUE::boolean,
  TRUE::boolean,
  'page1.access'::text,
  'Formation Pratique Physio'::text,
  'Assignation Répondants BA25'::text,
  'pi pi-user-edit'::text,
  525::integer
) ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  component_path = EXCLUDED.component_path,
  requires_auth = EXCLUDED.requires_auth,
  is_active = EXCLUDED.is_active,
  need = EXCLUDED.need,
  menu_section = EXCLUDED.menu_section,
  menu_label = EXCLUDED.menu_label,
  menu_icon = EXCLUDED.menu_icon,
  menu_order = EXCLUDED.menu_order;

-- Option 2: Si vous avez une erreur, essayez cette version alternative
-- DELETE FROM dynamic_routes WHERE path = '/admin/formation-pratique/assign-repondants-ba25';
-- INSERT INTO dynamic_routes (path, name, component_path, requires_auth, is_active)
-- VALUES ('/admin/formation-pratique/assign-repondants-ba25', 'AssignRepondantsBA25', '@/views/admin/AssignRepondantsView.vue', true, true);
