-- Migration : Créer la table house_points_history pour la gestion des maisons
-- Date: 2025-10-08
-- Description: Table pour enregistrer l'historique des points attribués/retirés aux maisons HES

-- Créer la table house_points_history
CREATE TABLE IF NOT EXISTS house_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house TEXT NOT NULL CHECK (house IN ('harmonis', 'elaris', 'doloris', 'solencia')),
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_house_points_history_created_by 
    FOREIGN KEY (created_by) 
    REFERENCES users_profiles(id) 
    ON DELETE SET NULL
);

-- Ajouter des commentaires
COMMENT ON TABLE house_points_history IS 'Historique des points attribués ou retirés aux maisons HES';
COMMENT ON COLUMN house_points_history.house IS 'Nom de la maison (harmonis, elaris, doloris, solencia)';
COMMENT ON COLUMN house_points_history.points IS 'Nombre de points (positif = attribution, négatif = retrait)';
COMMENT ON COLUMN house_points_history.reason IS 'Raison de l''attribution/retrait des points';
COMMENT ON COLUMN house_points_history.created_by IS 'ID de l''utilisateur qui a attribué les points';

-- Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_house_points_history_house ON house_points_history(house);
CREATE INDEX IF NOT EXISTS idx_house_points_history_created_at ON house_points_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_house_points_history_created_by ON house_points_history(created_by);
CREATE INDEX IF NOT EXISTS idx_house_points_history_house_date ON house_points_history(house, created_at DESC);

-- Créer un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_house_points_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_house_points_history_updated_at ON house_points_history;
CREATE TRIGGER trigger_update_house_points_history_updated_at
  BEFORE UPDATE ON house_points_history
  FOR EACH ROW
  EXECUTE FUNCTION update_house_points_history_updated_at();

-- Activer RLS (Row Level Security)
ALTER TABLE house_points_history ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut voir l'historique
CREATE POLICY "Tout le monde peut voir l'historique des points"
  ON house_points_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique : Seuls les admins, game masters et house coaches peuvent insérer
CREATE POLICY "Admins/GameMasters/HouseCoaches peuvent attribuer des points"
  ON house_points_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'game_master', 'house_coach')
    )
  );

-- Politique : Seuls les admins peuvent modifier
CREATE POLICY "Seuls les admins peuvent modifier l'historique"
  ON house_points_history
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Politique : Seuls les admins peuvent supprimer
CREATE POLICY "Seuls les admins peuvent supprimer l'historique"
  ON house_points_history
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Insérer quelques données de test
INSERT INTO house_points_history (house, points, reason, created_at)
VALUES
  ('harmonis', 50, 'Victoire au défi "Innovation en Soins Infirmiers"', NOW() - INTERVAL '1 hour'),
  ('elaris', 30, 'Excellent travail d''équipe en simulation clinique', NOW() - INTERVAL '3 hours'),
  ('doloris', 25, 'Participation active aux ateliers de communication', NOW() - INTERVAL '1 day'),
  ('solencia', 40, 'Performance exceptionnelle lors de l''examen pratique', NOW() - INTERVAL '2 days'),
  ('harmonis', -10, 'Retard dans le rendu du projet de groupe', NOW() - INTERVAL '3 days'),
  ('elaris', 35, 'Leadership démontré lors du défi collectif', NOW() - INTERVAL '4 days');

-- Afficher un résumé
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table house_points_history créée avec succès !';
  RAISE NOTICE 'RLS activé avec politiques pour admins/game masters/house coaches';
  RAISE NOTICE '6 entrées de test insérées';
  RAISE NOTICE '========================================';
END $$;

-- Afficher la structure finale
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'house_points_history'
ORDER BY ordinal_position;
