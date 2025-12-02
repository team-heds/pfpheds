-- ========================================
-- VARIANTES D'INSERTION - Essayez-les une par une
-- ========================================

-- VARIANTE 1: Avec props = NULL
DELETE FROM dynamic_routes WHERE path = '/admin/formation-pratique/assign-repondants-ba25';
INSERT INTO dynamic_routes (path, name, component_path, props)
VALUES (
  '/admin/formation-pratique/assign-repondants-ba25',
  'AssignRepondantsBA25',
  '@/views/admin/AssignRepondantsView.vue',
  NULL
);

/*
-- VARIANTE 2: Avec props comme objet JSON vide
DELETE FROM dynamic_routes WHERE path = '/admin/formation-pratique/assign-repondants-ba25';
INSERT INTO dynamic_routes (path, name, component_path, props)
VALUES (
  '/admin/formation-pratique/assign-repondants-ba25',
  'AssignRepondantsBA25',
  '@/views/admin/AssignRepondantsView.vue',
  '{}'::jsonb
);

-- VARIANTE 3: Sans la colonne props du tout
DELETE FROM dynamic_routes WHERE path = '/admin/formation-pratique/assign-repondants-ba25';
INSERT INTO dynamic_routes (path, name, component_path)
VALUES (
  '/admin/formation-pratique/assign-repondants-ba25',
  'AssignRepondantsBA25',
  '@/views/admin/AssignRepondantsView.vue'
);

-- VARIANTE 4: En copiant depuis une route existante
DELETE FROM dynamic_routes WHERE path = '/admin/formation-pratique/assign-repondants-ba25';
INSERT INTO dynamic_routes (
  path, name, component_path, requires_auth, is_active, need, 
  menu_section, menu_label, menu_icon, menu_order, props
)
SELECT 
  '/admin/formation-pratique/assign-repondants-ba25',
  'AssignRepondantsBA25',
  '@/views/admin/AssignRepondantsView.vue',
  requires_auth,
  is_active,
  'page1.access',
  'Formation Pratique Physio',
  'Assignation Répondants BA25',
  'pi pi-user-edit',
  525,
  props
FROM dynamic_routes 
WHERE path = '/admin/formation-pratique/profil-etudiants'
LIMIT 1;
*/

-- Ensuite mettez à jour les détails
UPDATE dynamic_routes 
SET 
  requires_auth = true,
  is_active = true,
  need = 'page1.access',
  menu_section = 'Formation Pratique Physio',
  menu_label = 'Assignation Répondants BA25',
  menu_icon = 'pi pi-user-edit',
  menu_order = 525
WHERE path = '/admin/formation-pratique/assign-repondants-ba25';

-- Vérifier
SELECT * FROM dynamic_routes 
WHERE path = '/admin/formation-pratique/assign-repondants-ba25';
