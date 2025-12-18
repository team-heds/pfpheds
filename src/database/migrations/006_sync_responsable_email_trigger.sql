-- ============================================
-- Migration 006: Trigger sync responsable → responsable_email
-- ============================================
-- Ce trigger synchronise automatiquement le champ responsable_email
-- à partir du champ responsable en cherchant l'email dans user_profiles

-- Fonction pour trouver l'email d'un utilisateur par son nom
CREATE OR REPLACE FUNCTION find_user_email_by_name(p_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF p_name IS NULL OR p_name = '' THEN
    RETURN NULL;
  END IF;
  
  -- Chercher par nom complet (forname + family_name)
  SELECT email INTO v_email
  FROM user_profiles
  WHERE LOWER(CONCAT(forname, ' ', family_name)) = LOWER(p_name)
     OR LOWER(display_name) = LOWER(p_name)
  LIMIT 1;
  
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction trigger pour sync responsable → responsable_email
CREATE OR REPLACE FUNCTION sync_module_responsable_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Si responsable_email est NULL et responsable est défini
  IF NEW.responsable_email IS NULL AND NEW.responsable IS NOT NULL AND NEW.responsable != '' THEN
    NEW.responsable_email := find_user_email_by_name(NEW.responsable);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trg_sync_module_responsable_email ON modules;

-- Créer le trigger sur INSERT et UPDATE
CREATE TRIGGER trg_sync_module_responsable_email
  BEFORE INSERT OR UPDATE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION sync_module_responsable_email();

-- ============================================
-- Migration one-shot: mettre à jour les modules existants
-- ============================================
UPDATE modules m
SET responsable_email = up.email
FROM user_profiles up
WHERE (
  LOWER(CONCAT(up.forname, ' ', up.family_name)) = LOWER(m.responsable)
  OR LOWER(up.display_name) = LOWER(m.responsable)
)
AND up.email IS NOT NULL
AND m.responsable IS NOT NULL 
AND m.responsable != ''
AND m.responsable_email IS NULL;

-- ============================================
-- Vérification
-- ============================================
-- SELECT code, title, responsable, responsable_email 
-- FROM modules 
-- WHERE responsable IS NOT NULL;
