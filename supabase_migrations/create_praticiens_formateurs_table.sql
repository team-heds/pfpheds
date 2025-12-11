-- Migration: Création de la table praticiens_formateurs
-- Description: Table pour gérer les praticiens formateurs
-- Date: 2024-12-11

-- ============================================
-- 1. CRÉATION DE LA TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS praticiens_formateurs (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  mail TEXT,
  institution TEXT,
  localite TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES POUR PERFORMANCE
-- ============================================

-- Index pour la recherche par nom
CREATE INDEX IF NOT EXISTS idx_praticiens_formateurs_nom ON praticiens_formateurs(nom);

-- Index pour la recherche par prénom
CREATE INDEX IF NOT EXISTS idx_praticiens_formateurs_prenom ON praticiens_formateurs(prenom);

-- Index pour la recherche par email
CREATE INDEX IF NOT EXISTS idx_praticiens_formateurs_mail ON praticiens_formateurs(mail);

-- Index pour la recherche par institution
CREATE INDEX IF NOT EXISTS idx_praticiens_formateurs_institution ON praticiens_formateurs(institution);

-- Index composite pour tri nom + prénom
CREATE INDEX IF NOT EXISTS idx_praticiens_formateurs_nom_prenom ON praticiens_formateurs(nom, prenom);

-- ============================================
-- 3. TRIGGER AUTO-UPDATE updated_at
-- ============================================

-- Fonction trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur praticiens_formateurs
DROP TRIGGER IF EXISTS update_praticiens_formateurs_updated_at ON praticiens_formateurs;
CREATE TRIGGER update_praticiens_formateurs_updated_at
    BEFORE UPDATE ON praticiens_formateurs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS
ALTER TABLE praticiens_formateurs ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs authentifiés peuvent lire
CREATE POLICY "Authenticated users can view praticiens_formateurs"
ON praticiens_formateurs
FOR SELECT
TO authenticated
USING (true);

-- Policy: Les admins et editors peuvent insérer
CREATE POLICY "Admins and editors can insert praticiens_formateurs"
ON praticiens_formateurs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'editor')
    AND user_profiles.is_active = true
  )
);

-- Policy: Les admins et editors peuvent mettre à jour
CREATE POLICY "Admins and editors can update praticiens_formateurs"
ON praticiens_formateurs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'editor')
    AND user_profiles.is_active = true
  )
);

-- Policy: Les admins peuvent supprimer
CREATE POLICY "Admins can delete praticiens_formateurs"
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

-- ============================================
-- 5. COMMENTAIRES
-- ============================================

COMMENT ON TABLE praticiens_formateurs IS 'Table des praticiens formateurs';
COMMENT ON COLUMN praticiens_formateurs.id IS 'ID unique auto-incrémenté';
COMMENT ON COLUMN praticiens_formateurs.nom IS 'Nom du praticien formateur';
COMMENT ON COLUMN praticiens_formateurs.prenom IS 'Prénom du praticien formateur';
COMMENT ON COLUMN praticiens_formateurs.mail IS 'Email du praticien formateur';
COMMENT ON COLUMN praticiens_formateurs.institution IS 'Institution du praticien formateur';
COMMENT ON COLUMN praticiens_formateurs.localite IS 'Localité du praticien formateur';
COMMENT ON COLUMN praticiens_formateurs.created_at IS 'Date de création';
COMMENT ON COLUMN praticiens_formateurs.updated_at IS 'Date de dernière modification';

-- ============================================
-- 6. DONNÉES DE TEST (OPTIONNEL - À RETIRER EN PRODUCTION)
-- ============================================

-- Exemple d'insertion de données de test
-- INSERT INTO praticiens_formateurs (nom, prenom, mail, institution, localite) VALUES
-- ('Dupont', 'Marie', 'marie.dupont@example.com', 'HEdS Fribourg', 'Fribourg'),
-- ('Martin', 'Jean', 'jean.martin@example.com', 'HEdS Genève', 'Genève'),
-- ('Bernard', 'Sophie', 'sophie.bernard@example.com', 'HEdS Lausanne', 'Lausanne');

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
