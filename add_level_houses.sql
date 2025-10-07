-- ================================================
-- AJOUTER SYSTÈME DE NIVEAUX POUR LES MAISONS
-- ================================================

-- 1. Ajouter la colonne level aux maisons
ALTER TABLE houses 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 2. Calculer le niveau initial basé sur total_xp existant
-- Formule: niveau_maison = FLOOR(SQRT(total_xp / 10000)) + 1
-- (Plus difficile que niveau individuel car collectif)
UPDATE houses
SET level = GREATEST(1, FLOOR(SQRT(total_xp / 10000.0)) + 1);

-- 3. Voir les niveaux actuels des maisons
SELECT 
  name,
  total_xp,
  level,
  member_count,
  FLOOR(SQRT(total_xp / 10000.0)) + 1 as niveau_calcule
FROM houses
ORDER BY total_xp DESC;

-- 4. Table de référence des niveaux de maisons
WITH niveau_maison AS (
  SELECT 
    level as niveau,
    POWER(level - 1, 2) * 10000 as xp_minimum,
    POWER(level, 2) * 10000 as xp_prochain_niveau,
    POWER(level, 2) * 10000 - POWER(level - 1, 2) * 10000 as xp_requis,
    CASE
      WHEN level = 1 THEN 'Maison Naissante'
      WHEN level = 2 THEN 'Maison Active'
      WHEN level = 3 THEN 'Maison Dynamique'
      WHEN level = 4 THEN 'Maison Brillante'
      WHEN level = 5 THEN 'Maison d''Excellence'
      WHEN level = 6 THEN 'Maison Prestigieuse'
      WHEN level = 7 THEN 'Maison Légendaire'
      WHEN level >= 8 THEN 'Maison Mythique'
    END as titre
  FROM generate_series(1, 10) as level
)
SELECT * FROM niveau_maison ORDER BY niveau;

-- 5. Fonction pour calculer automatiquement le niveau d'une maison
CREATE OR REPLACE FUNCTION update_house_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level = GREATEST(1, FLOOR(SQRT(NEW.total_xp / 10000.0)) + 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger pour mise à jour automatique du niveau
DROP TRIGGER IF EXISTS trigger_update_house_level ON houses;
CREATE TRIGGER trigger_update_house_level
  BEFORE UPDATE OF total_xp ON houses
  FOR EACH ROW
  EXECUTE FUNCTION update_house_level();

SELECT '✅ Système de niveaux pour maisons ajouté !' as status;
