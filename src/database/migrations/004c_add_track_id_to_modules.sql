-- ============================================
-- Migration 004c: Ajouter track_id aux modules
-- Date: 2024-12-17
-- Description: Ajout colonne track_id pour séparer modules SI/PHY
-- ⚠️ IDEMPOTENT: peut être exécuté plusieurs fois
-- ============================================

-- Ajouter la colonne track_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'modules' AND column_name = 'track_id'
  ) THEN
    ALTER TABLE modules ADD COLUMN track_id TEXT REFERENCES tracks(id);
    RAISE NOTICE '✅ Colonne track_id ajoutée à modules';
  ELSE
    RAISE NOTICE '⏭️ Colonne track_id existe déjà dans modules';
  END IF;
END $$;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_modules_track ON modules(track_id);

-- ============================================
-- Backfill: Tagger les modules existants
-- Par défaut, tous les modules existants sont SI (à ajuster selon vos données)
-- ============================================

-- Option 1: Tagger tous les modules sans track_id comme SI
UPDATE modules 
SET track_id = 'SI' 
WHERE track_id IS NULL;

-- Option 2: Si vous avez une logique pour identifier les modules PHY
-- Par exemple, basé sur le numéro de module ou un autre critère:
-- UPDATE modules SET track_id = 'PHY' WHERE number LIKE 'PHY%';
-- UPDATE modules SET track_id = 'PHY' WHERE title ILIKE '%physio%';

-- ============================================
-- RLS Policy pour modules avec filtrage par filière
-- ============================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Modules visible par filière" ON modules;
DROP POLICY IF EXISTS "modules_select_policy" ON modules;

-- Policy: Voir les modules de ses filières
CREATE POLICY "Modules visible par filière" ON modules
  FOR SELECT
  USING (
    -- SuperAdmin voit tout
    is_global_admin()
    -- Ou l'utilisateur a accès à la filière du module
    OR can_access_track(track_id)
    -- Fallback legacy: si pas de track_id, visible par tous les authentifiés
    OR (track_id IS NULL AND auth.uid() IS NOT NULL)
  );

-- Vérification
SELECT '✅ track_id ajouté aux modules' AS status;
SELECT track_id, COUNT(*) as count FROM modules GROUP BY track_id;
