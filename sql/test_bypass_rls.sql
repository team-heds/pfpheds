-- TEST: Désactiver temporairement RLS pour diagnostiquer
ALTER TABLE recap_cpt_evaluation DISABLE ROW LEVEL SECURITY;

-- Test d'insertion directe pour voir si ça fonctionne
INSERT INTO recap_cpt_evaluation (
  user_id, 
  annee, 
  pfp1_cpt
) VALUES (
  '7fc3563c-7aaa-4186-9ff3-4e3eabe79af2', 
  '2025', 
  false
) ON CONFLICT (user_id, annee) DO UPDATE SET
  pfp1_cpt = EXCLUDED.pfp1_cpt,
  updated_at = NOW();

-- Vérifier si l'insertion a fonctionné
SELECT * FROM recap_cpt_evaluation 
WHERE user_id = '7fc3563c-7aaa-4186-9ff3-4e3eabe79af2';

-- Si ça fonctionne, réactiver RLS avec des policies plus permissives
ALTER TABLE recap_cpt_evaluation ENABLE ROW LEVEL SECURITY;
