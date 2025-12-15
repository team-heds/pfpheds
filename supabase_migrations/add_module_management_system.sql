-- Migration: Système de gestion des modules par responsables
-- Date: 2025-01-12
-- Description: Ajoute les colonnes et permissions nécessaires pour que les responsables gèrent leurs modules

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

-- 7. Activer Row Level Security sur modules
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- 8. Politique RLS: Les responsables peuvent voir leurs modules
CREATE POLICY "Responsables can view own modules"
ON modules FOR SELECT
USING (
  responsable_email = auth.jwt() ->> 'email'
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_email = auth.jwt() ->> 'email' 
    AND user_roles.role = 'admin'
  )
);

-- 9. Politique RLS: Les responsables peuvent modifier leurs modules
CREATE POLICY "Responsables can update own modules"
ON modules FOR UPDATE
USING (
  responsable_email = auth.jwt() ->> 'email'
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_email = auth.jwt() ->> 'email' 
    AND user_roles.role = 'admin'
  )
);

-- 10. Politique RLS: Seuls les admins peuvent créer des modules
CREATE POLICY "Admins can create modules"
ON modules FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_email = auth.jwt() ->> 'email' 
    AND user_roles.role = 'admin'
  )
);

-- 11. Politique RLS: Seuls les admins peuvent supprimer des modules
CREATE POLICY "Admins can delete modules"
ON modules FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_email = auth.jwt() ->> 'email' 
    AND user_roles.role = 'admin'
  )
);

-- 12. Activer RLS sur user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 13. Politique RLS: Les utilisateurs peuvent voir leurs propres rôles
CREATE POLICY "Users can view own roles"
ON user_roles FOR SELECT
USING (
  user_email = auth.jwt() ->> 'email'
);

-- 14. Politique RLS: Seuls les admins peuvent gérer les rôles
CREATE POLICY "Admins can manage roles"
ON user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_email = auth.jwt() ->> 'email' 
    AND user_roles.role = 'admin'
  )
);

-- 15. Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. Trigger pour user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 17. Fonction helper pour vérifier si un utilisateur est admin
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

-- 18. Fonction helper pour vérifier si un utilisateur est responsable d'un module
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

-- 19. Vue pour les statistiques des responsables
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

-- 20. Données d'exemple pour les rôles (à adapter selon vos besoins)
-- Décommentez et ajustez selon votre structure

-- INSERT INTO user_roles (user_email, role) VALUES
-- ('admin@hevs.ch', 'admin'),
-- ('martin.dupont@hevs.ch', 'responsable_module'),
-- ('sophie.martin@hevs.ch', 'responsable_module');

-- 21. Mise à jour des modules existants (exemple)
-- Décommentez et ajustez selon vos données

-- UPDATE modules 
-- SET responsable_email = 'martin.dupont@hevs.ch' 
-- WHERE responsable LIKE '%Martin%Dupont%';

-- 22. Afficher un résumé
DO $$ 
BEGIN
  RAISE NOTICE 'Migration terminée avec succès!';
  RAISE NOTICE 'Prochaines étapes:';
  RAISE NOTICE '1. Ajouter les rôles dans user_roles';
  RAISE NOTICE '2. Mettre à jour responsable_email dans modules';
  RAISE NOTICE '3. Tester les permissions RLS';
END $$;
