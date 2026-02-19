-- ============================================
-- Table: votation_sessions
-- Gère les sessions de votation PFP (ouverture/fermeture)
-- ============================================

CREATE TABLE IF NOT EXISTS votation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pfp_type TEXT NOT NULL,          -- ex: 'PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4'
  year TEXT NOT NULL,               -- ex: '2026'
  target_class TEXT NOT NULL,       -- ex: 'BA25', 'BA24', 'BA23', 'BA22'
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opened_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide des sessions actives
CREATE INDEX IF NOT EXISTS idx_votation_sessions_active 
  ON votation_sessions (pfp_type, year, status) 
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_votation_sessions_class 
  ON votation_sessions (target_class, status) 
  WHERE status = 'open';

-- RLS (Row Level Security)
ALTER TABLE votation_sessions ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent déjà
DROP POLICY IF EXISTS "Admins can manage votation sessions" ON votation_sessions;
DROP POLICY IF EXISTS "Students can read open sessions" ON votation_sessions;

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage votation sessions"
  ON votation_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Les étudiants peuvent lire les sessions ouvertes
CREATE POLICY "Students can read open sessions"
  ON votation_sessions
  FOR SELECT
  USING (status = 'open');
