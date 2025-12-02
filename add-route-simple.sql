-- VERSION SIMPLIFIÉE - Insertion minimale
-- Essayez d'abord celle-ci si vous avez des erreurs JSON

-- Supprimer la route si elle existe déjà (pour réinitialiser)
DELETE FROM dynamic_routes 
WHERE path = '/admin/formation-pratique/assign-repondants-ba25';

-- Insertion simple avec colonnes minimales (avec props JSON)
INSERT INTO dynamic_routes (
  path, 
  name, 
  component_path,
  props
) VALUES (
  '/admin/formation-pratique/assign-repondants-ba25',
  'AssignRepondantsBA25',
  '@/views/admin/AssignRepondantsView.vue',
  'false'::jsonb
);

-- Ensuite, mettre à jour les autres colonnes une par une
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

-- Vérifier le résultat
SELECT * FROM dynamic_routes 
WHERE path = '/admin/formation-pratique/assign-repondants-ba25';
