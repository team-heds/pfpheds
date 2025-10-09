-- =====================================================
-- CORRECTION : Supprimer la colonne 'admin' en double
-- =====================================================
-- La table a maintenant 'admin' ET 'admin_uid'
-- On garde 'admin_uid' (qui a NOT NULL) et on supprime 'admin'

-- Option 1 : Supprimer la colonne 'admin' avec CASCADE (recommandé)
-- CASCADE supprime aussi les politiques RLS qui utilisent cette colonne
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'admin'
    ) THEN
        ALTER TABLE events DROP COLUMN admin CASCADE;
    END IF;
END $$;

-- Option 2 : Ou copier les valeurs de 'admin' vers 'admin_uid' si nécessaire
-- UPDATE events SET admin_uid = admin WHERE admin_uid IS NULL AND admin IS NOT NULL;
-- ALTER TABLE events DROP COLUMN IF EXISTS admin;

-- Rafraîchir le schéma
NOTIFY pgrst, 'reload schema';

-- Supprimer les anciennes politiques si elles existent encore
DROP POLICY IF EXISTS "Tous peuvent lire les événements" ON events;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent créer" ON events;
DROP POLICY IF EXISTS "Créateur peut modifier" ON events;
DROP POLICY IF EXISTS "Créateur peut supprimer" ON events;

-- Recréer les politiques RLS avec admin_uid

CREATE POLICY "Tous peuvent lire les événements"
ON events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Utilisateurs authentifiés peuvent créer"
ON events FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Créateur peut modifier"
ON events FOR UPDATE
TO authenticated
USING (auth.uid()::text = admin_uid)
WITH CHECK (auth.uid()::text = admin_uid);

CREATE POLICY "Créateur peut supprimer"
ON events FOR DELETE
TO authenticated
USING (auth.uid()::text = admin_uid);

-- Vérifier la structure finale
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN ('admin', 'admin_uid')
ORDER BY column_name;
