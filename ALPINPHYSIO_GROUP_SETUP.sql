-- =====================================================
-- CRÉATION SYSTÈME DE GROUPE ALP'IN PHYSIO
-- =====================================================

-- 1. Créer une table pour les membres de l'association Alp'in Physio
CREATE TABLE IF NOT EXISTS alpinphysio_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE, -- UID de l'utilisateur
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')), -- Role dans l'association
  nom TEXT,
  prenom TEXT,
  email TEXT,
  poste TEXT, -- Ex: Président, Secrétaire, etc.
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_alpinphysio_members_user_id ON alpinphysio_members(user_id);
CREATE INDEX IF NOT EXISTS idx_alpinphysio_members_active ON alpinphysio_members(is_active);

-- 2. Modifier la contrainte de type dans la table events pour ajouter 'alpinphysio'
-- D'abord supprimer l'ancienne contrainte
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;

-- Ajouter la nouvelle contrainte avec 'alpinphysio'
ALTER TABLE events ADD CONSTRAINT events_type_check 
  CHECK (type IN ('public', 'private', 'alpinphysio'));

-- 3. Ajouter une colonne pour l'association propriétaire (optionnel, pour futur multi-associations)
ALTER TABLE events ADD COLUMN IF NOT EXISTS association_id TEXT;

-- 4. RLS : Permettre aux membres actifs de l'association de voir les événements Alp'in Physio
DROP POLICY IF EXISTS "Membres AlpinPhysio voient événements association" ON events;
CREATE POLICY "Membres AlpinPhysio voient événements association"
ON events FOR SELECT
TO authenticated
USING (
  type = 'alpinphysio' AND (
    -- Soit c'est un membre actif de l'association
    auth.uid()::text IN (
      SELECT user_id FROM alpinphysio_members WHERE is_active = true
    )
    -- Soit c'est un événement public de l'association (visible par tous)
    OR type = 'public'
  )
  OR type IN ('public', 'private')
);

-- 5. RLS : Permettre aux admins Alp'in Physio de modifier les événements de l'association
DROP POLICY IF EXISTS "Admins AlpinPhysio peuvent modifier événements" ON events;
CREATE POLICY "Admins AlpinPhysio peuvent modifier événements"
ON events FOR UPDATE
TO authenticated
USING (
  (type = 'alpinphysio' AND auth.uid()::text IN (
    SELECT user_id FROM alpinphysio_members WHERE role = 'admin' AND is_active = true
  ))
  OR (auth.uid()::text = admin_uid) -- Créateur peut toujours modifier
)
WITH CHECK (
  (type = 'alpinphysio' AND auth.uid()::text IN (
    SELECT user_id FROM alpinphysio_members WHERE role = 'admin' AND is_active = true
  ))
  OR (auth.uid()::text = admin_uid)
);

-- 6. RLS : Permettre aux admins Alp'in Physio de supprimer les événements de l'association
DROP POLICY IF EXISTS "Admins AlpinPhysio peuvent supprimer événements" ON events;
CREATE POLICY "Admins AlpinPhysio peuvent supprimer événements"
ON events FOR DELETE
TO authenticated
USING (
  (type = 'alpinphysio' AND auth.uid()::text IN (
    SELECT user_id FROM alpinphysio_members WHERE role = 'admin' AND is_active = true
  ))
  OR (auth.uid()::text = admin_uid)
);

-- 7. RLS pour la table alpinphysio_members
ALTER TABLE alpinphysio_members ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les membres actifs
CREATE POLICY "Membres AlpinPhysio visibles par tous"
ON alpinphysio_members FOR SELECT
TO authenticated
USING (is_active = true);

-- Seuls les admins peuvent ajouter/modifier/supprimer des membres
CREATE POLICY "Admins AlpinPhysio gèrent membres"
ON alpinphysio_members FOR ALL
TO authenticated
USING (
  auth.uid()::text IN (
    SELECT user_id FROM alpinphysio_members WHERE role = 'admin' AND is_active = true
  )
)
WITH CHECK (
  auth.uid()::text IN (
    SELECT user_id FROM alpinphysio_members WHERE role = 'admin' AND is_active = true
  )
);

-- 8. Insérer des membres initiaux (EXEMPLE - À ADAPTER)
-- Remplace les user_id par les vrais UIDs des membres
INSERT INTO alpinphysio_members (user_id, role, nom, prenom, email, poste) VALUES
  ('UID_ADMIN_1', 'admin', 'Doe', 'John', 'john.doe@hevs.ch', 'Président'),
  ('UID_ADMIN_2', 'admin', 'Smith', 'Jane', 'jane.smith@hevs.ch', 'Vice-présidente')
ON CONFLICT (user_id) DO NOTHING;

-- 9. Fonction helper pour vérifier si un utilisateur est membre Alp'in Physio
CREATE OR REPLACE FUNCTION is_alpinphysio_member(user_uid TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM alpinphysio_members 
    WHERE user_id = user_uid AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Fonction helper pour vérifier si un utilisateur est admin Alp'in Physio
CREATE OR REPLACE FUNCTION is_alpinphysio_admin(user_uid TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM alpinphysio_members 
    WHERE user_id = user_uid AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rafraîchir le schéma
NOTIFY pgrst, 'reload schema';

-- Vérifier la structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'alpinphysio_members'
ORDER BY ordinal_position;

SELECT * FROM alpinphysio_members;
