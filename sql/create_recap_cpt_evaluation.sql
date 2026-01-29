-- Table pour le suivi des CPT et Évaluations reçues par étudiant
CREATE TABLE IF NOT EXISTS recap_cpt_evaluation (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  annee VARCHAR(10) NOT NULL,
  
  -- PFP CPT (4 colonnes): null = vide, false = croix, true = checkmark
  pfp1_cpt BOOLEAN,
  pfp1_cpt_comment TEXT,
  
  pfp2_cpt BOOLEAN,
  pfp2_cpt_comment TEXT,
  
  pfp3_cpt BOOLEAN,
  pfp3_cpt_comment TEXT,
  
  pfp4_cpt BOOLEAN,
  pfp4_cpt_comment TEXT,
  
  -- PFP Eval (4 colonnes): null = vide, false = croix, true = checkmark
  pfp1_eval BOOLEAN,
  pfp1_eval_comment TEXT,
  
  pfp2_eval BOOLEAN,
  pfp2_eval_comment TEXT,
  
  pfp3_eval BOOLEAN,
  pfp3_eval_comment TEXT,
  
  pfp4_eval BOOLEAN,
  pfp4_eval_comment TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unique pour éviter les doublons user_id + année
  UNIQUE(user_id, annee)
);

-- Index pour améliorer les performances
CREATE INDEX idx_recap_cpt_evaluation_user_id ON recap_cpt_evaluation(user_id);
CREATE INDEX idx_recap_cpt_evaluation_annee ON recap_cpt_evaluation(annee);

-- Trigger pour auto-update du updated_at
CREATE OR REPLACE FUNCTION update_recap_cpt_evaluation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recap_cpt_evaluation_updated_at
  BEFORE UPDATE ON recap_cpt_evaluation
  FOR EACH ROW
  EXECUTE FUNCTION update_recap_cpt_evaluation_updated_at();

-- RLS Policies
ALTER TABLE recap_cpt_evaluation ENABLE ROW LEVEL SECURITY;

-- Lecture: tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Allow authenticated users to read recap_cpt_evaluation"
  ON recap_cpt_evaluation FOR SELECT
  TO authenticated
  USING (true);

-- Insertion: tous les utilisateurs authentifiés peuvent insérer
CREATE POLICY "Allow authenticated users to insert recap_cpt_evaluation"
  ON recap_cpt_evaluation FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Mise à jour: tous les utilisateurs authentifiés peuvent mettre à jour
CREATE POLICY "Allow authenticated users to update recap_cpt_evaluation"
  ON recap_cpt_evaluation FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Suppression: tous les utilisateurs authentifiés peuvent supprimer
CREATE POLICY "Allow authenticated users to delete recap_cpt_evaluation"
  ON recap_cpt_evaluation FOR DELETE
  TO authenticated
  USING (true);
