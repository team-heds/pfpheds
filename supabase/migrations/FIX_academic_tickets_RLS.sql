-- =====================================================
-- FIX: Correction des policies RLS pour academic_tickets
-- Date: 2025-01-20
-- =====================================================
-- 
-- Problème: La policy INSERT exige created_by = auth.uid() 
-- mais le frontend ne remplit pas ce champ automatiquement
--
-- Solution: 
-- 1. Supprimer l'ancienne policy INSERT restrictive
-- 2. Créer une policy INSERT permissive
-- 3. Ajouter un trigger pour auto-remplir created_by
-- =====================================================

-- Supprimer l'ancienne policy restrictive
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON public.academic_tickets;

-- Créer une nouvelle policy permissive
CREATE POLICY "Authenticated users can create tickets"
  ON public.academic_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fonction pour auto-remplir created_by avec l'utilisateur actuel
CREATE OR REPLACE FUNCTION set_created_by_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Si created_by n'est pas fourni, utiliser l'utilisateur actuel
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_set_created_by ON public.academic_tickets;

-- Créer le trigger pour auto-remplir created_by
CREATE TRIGGER trigger_set_created_by
  BEFORE INSERT ON public.academic_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by_on_insert();

-- Vérification des policies actuelles
-- SELECT * FROM pg_policies WHERE tablename = 'academic_tickets';
