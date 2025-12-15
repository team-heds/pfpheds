-- Migration: Système de gestion des modules par responsables (SANS RLS ACTIF)
-- Date: 2025-01-12
-- Description: Ajoute les colonnes et infrastructure pour la gestion par responsables
-- NOTE: Le RLS n'est PAS activé automatiquement - à activer manuellement plus tard

-- 0. Nettoyage - Supprimer les objets existants s'ils existent
DROP POLICY IF EXISTS "Responsables can view own modules" ON modules;
DROP POLICY IF EXISTS "Responsables can update own modules" ON modules;
DROP POLICY IF EXISTS "Admins can create modules" ON modules;
DROP POLICY IF EXISTS "Admins can delete modules" ON modules;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP VIEW IF EXISTS responsable_stats;
DROP FUNCTION IF EXISTS is_module_owner(TEXT, UUID);
DROP FUNCTION IF EXISTS is_admin(TEXT);
DROP TABLE IF EXISTS user_roles CASCADE;

-- 1. Ajouter les colonnes manquantes dans modules
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS responsable_email TEXT;

ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS heures_contact INTEGER;

ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS coordinateur TEXT;

ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS short_code TEXT;

-- 2. Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_modules_responsable_email 
ON modules(responsable_email);

-- 3. Ajouter des commentaires pour documentation
COMMENT ON COLUMN modules.responsable_email IS 'Email du responsable du module (correspond à auth.users.email)';

-- 4. Créer la table des rôles utilisateurs
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'responsable_module', 'enseignant', 'etudiant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 5. Index pour les rôles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(user_email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 6. Commentaires pour user_roles
COMMENT ON TABLE user_roles IS 'Rôles des utilisateurs dans le système';
COMMENT ON COLUMN user_roles.role IS 'admin: administrateur complet, responsable_module: gère ses modules, enseignant: enseigne dans des modules, etudiant: suit des modules';

-- 7. Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger pour user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 9. Fonction helper pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin(email_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_email = email_param 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Fonction helper pour vérifier si un utilisateur est responsable d'un module
CREATE OR REPLACE FUNCTION is_module_owner(user_email TEXT, module_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM modules 
    WHERE id = module_id 
    AND responsable_email = user_email
  ) OR is_admin(user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Vue pour les statistiques des responsables
CREATE OR REPLACE VIEW responsable_stats AS
SELECT 
  responsable_email,
  responsable,
  COUNT(*) as total_modules,
  COUNT(CASE WHEN year = 1 THEN 1 END) as modules_year_1,
  COUNT(CASE WHEN year = 2 THEN 1 END) as modules_year_2,
  COUNT(CASE WHEN year = 3 THEN 1 END) as modules_year_3,
  SUM(credits) as total_credits,
  SUM(heures_contact) as total_heures_contact
FROM modules
WHERE responsable_email IS NOT NULL
GROUP BY responsable_email, responsable;

COMMENT ON VIEW responsable_stats IS 'Statistiques agrégées par responsable de module';

-- 12. Données d'exemple pour les rôles (à adapter selon vos besoins)
-- Décommentez et ajustez selon votre structure

-- INSERT INTO user_roles (user_email, role) VALUES
-- ('admin@hevs.ch', 'admin'),
-- ('antoine.quarroz@hevs.ch', 'admin'),
-- ('martin.dupont@hevs.ch', 'responsable_module'),
-- ('sophie.martin@hevs.ch', 'responsable_module');

-- 13. Afficher un résumé
DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès!';
  RAISE NOTICE '⚠️  RLS N''EST PAS ACTIVÉ - Les modules sont accessibles à tous';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Prochaines étapes:';
  RAISE NOTICE '1. Ajouter les rôles dans user_roles';
  RAISE NOTICE '2. Mettre à jour responsable_email dans modules';
  RAISE NOTICE '3. Activer RLS manuellement quand prêt';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Pour activer RLS plus tard, exécutez:';
  RAISE NOTICE '   ALTER TABLE modules ENABLE ROW LEVEL SECURITY;';
  RAISE NOTICE '   -- Puis créez les politiques RLS nécessaires';
END $$;
