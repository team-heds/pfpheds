-- =====================================================
-- CORRECTION : Politiques RLS sans récursion
-- =====================================================

-- 1. Supprimer TOUTES les anciennes politiques pour repartir à zéro
DROP POLICY IF EXISTS "Membres AlpinPhysio voient événements association" ON events;
DROP POLICY IF EXISTS "Admins AlpinPhysio peuvent modifier événements" ON events;
DROP POLICY IF EXISTS "Admins AlpinPhysio peuvent supprimer événements" ON events;
DROP POLICY IF EXISTS "Membres AlpinPhysio visibles par tous" ON alpinphysio_members;
DROP POLICY IF EXISTS "Admins AlpinPhysio gèrent membres" ON alpinphysio_members;

-- 2. Politiques SIMPLES pour alpinphysio_members (SANS récursion)
ALTER TABLE alpinphysio_members ENABLE ROW LEVEL SECURITY;

-- Tout le monde authentifié peut lire les membres actifs (PAS de vérification récursive)
CREATE POLICY "Lecture membres actifs"
ON alpinphysio_members FOR SELECT
TO authenticated
USING (is_active = true);

-- Permettre les INSERT/UPDATE/DELETE sans vérification (on gérera côté application)
-- OU utiliser une fonction SECURITY DEFINER
CREATE POLICY "Gestion membres"
ON alpinphysio_members FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Politiques pour events (utiliser les fonctions SECURITY DEFINER)

-- SELECT : Tout le monde peut voir public/private, membres peuvent voir alpinphysio
CREATE POLICY "Lecture événements"
ON events FOR SELECT
TO authenticated
USING (
  type IN ('public', 'private')
  OR (type = 'alpinphysio' AND is_alpinphysio_member(auth.uid()::text))
);

-- INSERT : Tout le monde peut créer
CREATE POLICY "Création événements"
ON events FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE : Créateur OU admin alpinphysio (pour événements alpinphysio)
CREATE POLICY "Modification événements"
ON events FOR UPDATE
TO authenticated
USING (
  auth.uid()::text = admin_uid
  OR (type = 'alpinphysio' AND is_alpinphysio_admin(auth.uid()::text))
)
WITH CHECK (
  auth.uid()::text = admin_uid
  OR (type = 'alpinphysio' AND is_alpinphysio_admin(auth.uid()::text))
);

-- DELETE : Créateur OU admin alpinphysio
CREATE POLICY "Suppression événements"
ON events FOR DELETE
TO authenticated
USING (
  auth.uid()::text = admin_uid
  OR (type = 'alpinphysio' AND is_alpinphysio_admin(auth.uid()::text))
);

-- Rafraîchir
NOTIFY pgrst, 'reload schema';

-- Vérifier les politiques
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('events', 'alpinphysio_members')
ORDER BY tablename, policyname;
