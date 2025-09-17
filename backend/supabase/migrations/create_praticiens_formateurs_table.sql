-- Création de la table pour les Praticiens Formateurs
CREATE TABLE IF NOT EXISTS public.praticiens_formateurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    mail TEXT,
    institution TEXT,
    localite TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer Row Level Security (RLS)
ALTER TABLE public.praticiens_formateurs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- Permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Allow read access to authenticated users" ON public.praticiens_formateurs
FOR SELECT
TO authenticated
USING (true);

-- Permettre aux administrateurs de tout faire (à adapter selon vos rôles)
CREATE POLICY "Allow full access for admins" ON public.praticiens_formateurs
FOR ALL
USING (true) -- Mettez ici votre logique de rôle admin, ex: `get_my_claim('role') = 'admin'`
WITH CHECK (true);

COMMENT ON TABLE public.praticiens_formateurs IS 'Table contenant les informations sur les praticiens formateurs.';
COMMENT ON COLUMN public.praticiens_formateurs.institution IS 'Le nom de l''institution. Pourrait être une clé étrangère vers une table d''institutions à l''avenir.';
