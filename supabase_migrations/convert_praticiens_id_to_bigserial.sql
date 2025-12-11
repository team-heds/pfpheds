-- Conversion de la colonne id de text (Firebase) vers bigserial (Supabase)
-- ATTENTION : Ce script va réinitialiser les IDs ! Sauvegarde tes données d'abord si nécessaire.

-- Option 1 : Garder les données existantes avec nouveaux IDs numériques
-- (Les anciens IDs Firebase seront perdus, mais les données restent)

BEGIN;

-- 1. Créer une table temporaire avec la nouvelle structure
CREATE TABLE praticiens_formateurs_new (
    id BIGSERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    mail TEXT,
    institution TEXT,
    localite TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Copier les données (sans les IDs Firebase)
INSERT INTO praticiens_formateurs_new (nom, prenom, mail, institution, localite, created_at, updated_at)
SELECT nom, prenom, mail, institution, localite, created_at, updated_at
FROM praticiens_formateurs
ORDER BY id; -- Pour préserver l'ordre si possible

-- 3. Supprimer l'ancienne table
DROP TABLE praticiens_formateurs;

-- 4. Renommer la nouvelle table
ALTER TABLE praticiens_formateurs_new RENAME TO praticiens_formateurs;

-- 5. Recréer les policies RLS
ALTER TABLE praticiens_formateurs ENABLE ROW LEVEL SECURITY;

-- Policy SELECT : Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "authenticated_read_praticiens"
ON praticiens_formateurs
FOR SELECT
TO authenticated
USING (true);

-- Policy INSERT : Tous les utilisateurs authentifiés peuvent insérer
CREATE POLICY "authenticated_insert_praticiens"
ON praticiens_formateurs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy UPDATE : Tous les utilisateurs authentifiés peuvent modifier
CREATE POLICY "authenticated_update_praticiens"
ON praticiens_formateurs
FOR UPDATE
TO authenticated
USING (true);

-- Policy DELETE : Seulement les admins peuvent supprimer
CREATE POLICY "admin_delete_praticiens"
ON praticiens_formateurs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
    AND user_profiles.is_active = true
  )
);

-- 6. Créer les index pour performance
CREATE INDEX idx_praticiens_nom ON praticiens_formateurs(nom);
CREATE INDEX idx_praticiens_prenom ON praticiens_formateurs(prenom);
CREATE INDEX idx_praticiens_mail ON praticiens_formateurs(mail);

COMMIT;

-- Vérification finale
SELECT COUNT(*) as total_praticiens FROM praticiens_formateurs;
SELECT * FROM praticiens_formateurs ORDER BY id DESC LIMIT 5;
