-- =====================================================
-- Migration pour créer la table des tickets académiques (Kanban)
-- Date: 2025-01-20
-- =====================================================
--
-- IMPORTANT: 
-- - Cette migration ne crée PAS la table modules car elle existe déjà
-- - La colonne module_id n'a PAS de contrainte FK pour éviter les conflits
-- - Vous pouvez ajouter la FK plus tard manuellement (voir commentaire ligne 53)
-- - Les permissions RLS sont permissives pour faciliter les tests
--
-- =====================================================

-- Table des tickets académiques (dans le schéma public pour l'API REST)
CREATE TABLE IF NOT EXISTS public.academic_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations de base
  type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'development', 'simulation', 'other')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Statut et priorité
  status VARCHAR(50) NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'validation', 'problems', 'done')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  order_index INTEGER DEFAULT 0,
  
  -- Relations (module_id sans contrainte FK pour éviter les erreurs si la table modules a une structure différente)
  module_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Dates
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Métadonnées spécifiques au type (JSONB pour flexibilité)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Assets et notes
  has_assets BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  -- Publication Vimeo (pour les vidéos)
  vimeo_id VARCHAR(100),
  vimeo_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE
);

-- NOTE: Contrainte FK désactivée car la structure de la table modules existante est différente
-- Si vous voulez l'activer plus tard, vérifiez d'abord la structure de modules et utilisez :
-- ALTER TABLE academic_tickets 
-- ADD CONSTRAINT academic_tickets_module_id_fkey 
-- FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_academic_tickets_status ON public.academic_tickets(status);
CREATE INDEX IF NOT EXISTS idx_academic_tickets_type ON public.academic_tickets(type);
CREATE INDEX IF NOT EXISTS idx_academic_tickets_module ON public.academic_tickets(module_id);
CREATE INDEX IF NOT EXISTS idx_academic_tickets_created_by ON public.academic_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_academic_tickets_assigned_to ON public.academic_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_academic_tickets_due_date ON public.academic_tickets(due_date);
CREATE INDEX IF NOT EXISTS idx_academic_tickets_created_at ON public.academic_tickets(created_at DESC);

-- Index GIN pour recherche dans metadata JSONB
CREATE INDEX IF NOT EXISTS idx_academic_tickets_metadata ON public.academic_tickets USING gin(metadata);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_academic_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_update_academic_tickets_updated_at ON public.academic_tickets;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER trigger_update_academic_tickets_updated_at
  BEFORE UPDATE ON public.academic_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_academic_tickets_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.academic_tickets ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Authenticated users can view all tickets" ON public.academic_tickets;
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON public.academic_tickets;
DROP POLICY IF EXISTS "Users can update tickets" ON public.academic_tickets;
DROP POLICY IF EXISTS "Users can delete tickets" ON public.academic_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.academic_tickets;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON public.academic_tickets;

-- Politique: Tous les utilisateurs authentifiés peuvent voir tous les tickets
CREATE POLICY "Authenticated users can view all tickets"
  ON public.academic_tickets
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique: Utilisateurs authentifiés peuvent créer des tickets
CREATE POLICY "Authenticated users can create tickets"
  ON public.academic_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Politique: Tous les utilisateurs peuvent modifier les tickets
CREATE POLICY "Users can update tickets"
  ON public.academic_tickets
  FOR UPDATE
  TO authenticated
  USING (true);

-- Politique: Tous les utilisateurs peuvent supprimer les tickets
CREATE POLICY "Users can delete tickets"
  ON public.academic_tickets
  FOR DELETE
  TO authenticated
  USING (true);

-- Commentaires pour documentation
COMMENT ON TABLE public.academic_tickets IS 'Tickets pour la gestion de production de contenu académique (Kanban)';
COMMENT ON COLUMN public.academic_tickets.type IS 'Type de ticket: video, development, simulation, other';
COMMENT ON COLUMN public.academic_tickets.status IS 'Statut du ticket dans le workflow Kanban';
COMMENT ON COLUMN public.academic_tickets.priority IS 'Priorité du ticket: low, normal, high, urgent';
COMMENT ON COLUMN public.academic_tickets.order_index IS 'Position du ticket dans sa colonne';
COMMENT ON COLUMN public.academic_tickets.metadata IS 'Données spécifiques au type de ticket (JSONB)';
COMMENT ON COLUMN public.academic_tickets.vimeo_id IS 'ID de la vidéo sur Vimeo (pour type video)';
COMMENT ON COLUMN public.academic_tickets.vimeo_url IS 'URL de la vidéo sur Vimeo (pour type video)';
COMMENT ON COLUMN public.academic_tickets.published_at IS 'Date de publication sur Vimeo';

-- Exemples de structure metadata selon le type:
-- 
-- Type VIDEO:
-- {
--   "person_filmed": "Prof. Dupont",
--   "filming_date": "2025-01-25T10:00:00Z",
--   "modality": "powerpoint_sonorise",
--   "duration_minutes": 15,
--   "assets_url": "https://drive.google.com/..."
-- }
--
-- Type DEVELOPMENT:
-- {
--   "dev_type": "web_app",
--   "technologies": "Vue.js, Node.js",
--   "repository_url": "https://github.com/..."
-- }
--
-- Type SIMULATION:
-- {
--   "sim_type": "clinical_case",
--   "participants_count": 5,
--   "equipment": "Mannequins, matériel d'injection..."
-- }

-- Vue pour statistiques rapides
CREATE OR REPLACE VIEW academic_tickets_stats AS
SELECT 
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE status = 'backlog') as backlog_count,
  COUNT(*) FILTER (WHERE status = 'todo') as todo_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'validation') as validation_count,
  COUNT(*) FILTER (WHERE status = 'problems') as problems_count,
  COUNT(*) FILTER (WHERE status = 'done') as done_count,
  COUNT(*) FILTER (WHERE type = 'video') as video_count,
  COUNT(*) FILTER (WHERE type = 'development') as development_count,
  COUNT(*) FILTER (WHERE type = 'simulation') as simulation_count,
  COUNT(*) FILTER (WHERE type = 'other') as other_count,
  COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('done', 'validation')) as overdue_count
FROM public.academic_tickets;

COMMENT ON VIEW academic_tickets_stats IS 'Vue pour les statistiques des tickets académiques';
