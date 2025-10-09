-- =====================================================
-- MIGRATION ÉVÉNEMENTS : FIREBASE → SUPABASE
-- =====================================================

-- 1. Supprimer toutes les tables et vues existantes (dans le bon ordre)
DROP VIEW IF EXISTS public.events_with_counts CASCADE;
DROP TABLE IF EXISTS public.event_likes CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.events_view CASCADE;

-- Supprimer les fonctions et triggers existants
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 2. Créer la table events avec la bonne structure
CREATE TABLE public.events (
  -- Identifiant unique
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations de base
  title TEXT NOT NULL,
  description TEXT,
  lieu TEXT,
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Type et accès
  type TEXT NOT NULL CHECK (type IN ('public', 'private')) DEFAULT 'public',
  role TEXT, -- Pour les événements privés (ex: 'Physio', 'Comité')
  
  -- Créateur
  admin_uid TEXT NOT NULL, -- UID de l'utilisateur Firebase/Supabase
  
  -- Engagement
  likes INTEGER DEFAULT 0,
  
  -- Image
  image_url TEXT -- URL de l'image dans Supabase Storage
);

-- 3. Créer une table pour les inscriptions (relation many-to-many)
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_uid TEXT NOT NULL,
  user_nom TEXT,
  user_prenom TEXT,
  user_photo_url TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Éviter les doublons
  UNIQUE(event_id, user_uid)
);

-- 4. Créer une table pour les likes (relation many-to-many)
CREATE TABLE public.event_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_uid TEXT NOT NULL,
  liked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Éviter les doublons
  UNIQUE(event_id, user_uid)
);

-- 5. Index pour optimiser les performances
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_events_type ON public.events(type);
CREATE INDEX idx_events_admin ON public.events(admin_uid);
CREATE INDEX idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON public.event_registrations(user_uid);
CREATE INDEX idx_event_likes_event ON public.event_likes(event_id);
CREATE INDEX idx_event_likes_user ON public.event_likes(user_uid);

-- 6. Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 7. Vue pour faciliter les requêtes (avec nombre d'inscrits et likes)
CREATE OR REPLACE VIEW public.events_with_counts AS
SELECT 
  e.*,
  COALESCE(r.registration_count, 0) AS registration_count,
  COALESCE(l.likes_count, 0) AS likes_count
FROM public.events e
LEFT JOIN (
  SELECT event_id, COUNT(*) AS registration_count
  FROM public.event_registrations
  GROUP BY event_id
) r ON e.id = r.event_id
LEFT JOIN (
  SELECT event_id, COUNT(*) AS likes_count
  FROM public.event_likes
  GROUP BY event_id
) l ON e.id = l.event_id;

-- 8. Row Level Security (RLS) pour la sécurité
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire les événements publics
CREATE POLICY "Anyone can view public events"
ON public.events FOR SELECT
USING (type = 'public');

-- Politique : Les utilisateurs authentifiés peuvent lire les événements privés
CREATE POLICY "Authenticated users can view private events"
ON public.events FOR SELECT
USING (auth.role() = 'authenticated');

-- Politique : Seul le créateur peut modifier/supprimer son événement
CREATE POLICY "Admin can update their events"
ON public.events FOR UPDATE
USING (admin_uid = auth.uid());

CREATE POLICY "Admin can delete their events"
ON public.events FOR DELETE
USING (admin_uid = auth.uid());

-- Politique : Les utilisateurs authentifiés peuvent créer des événements
CREATE POLICY "Authenticated users can create events"
ON public.events FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND admin_uid = auth.uid());

-- Politique : Inscriptions lisibles par tous
CREATE POLICY "Anyone can view registrations"
ON public.event_registrations FOR SELECT
USING (true);

-- Politique : Les utilisateurs peuvent s'inscrire
CREATE POLICY "Users can register themselves"
ON public.event_registrations FOR INSERT
WITH CHECK (auth.uid() = user_uid);

-- Politique : Les utilisateurs peuvent se désinscrire
CREATE POLICY "Users can unregister themselves"
ON public.event_registrations FOR DELETE
USING (auth.uid() = user_uid);

-- Politique : Likes lisibles par tous
CREATE POLICY "Anyone can view likes"
ON public.event_likes FOR SELECT
USING (true);

-- Politique : Les utilisateurs peuvent liker
CREATE POLICY "Users can like events"
ON public.event_likes FOR INSERT
WITH CHECK (auth.uid() = user_uid);

-- Politique : Les utilisateurs peuvent unliker
CREATE POLICY "Users can unlike events"
ON public.event_likes FOR DELETE
USING (auth.uid() = user_uid);

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
-- 
-- Instructions :
-- 1. Copie ce SQL dans l'éditeur SQL de Supabase
-- 2. Exécute-le
-- 3. Vérifie que les tables sont créées dans "Table Editor"
-- 4. Configure Firebase Storage Bucket "events" dans Supabase Storage
-- =====================================================
