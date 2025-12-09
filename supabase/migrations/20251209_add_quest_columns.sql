-- Ajouter les colonnes manquantes à la table quests pour supporter les nouvelles fonctionnalités du QuestManagement
-- Ce script est idempotent (IF NOT EXISTS) donc sans danger à exécuter plusieurs fois

-- 1. Icône et Apparence
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🗺️';

-- 2. Gestion du Temps
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS duration INTEGER; -- Durée en heures pour compléter

-- 3. Récurrence
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS recurring_type TEXT; -- 'daily', 'weekly', 'monthly'

-- 4. Conditions et Ciblage
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS min_level INTEGER DEFAULT 1;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS max_level INTEGER;
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS target_houses TEXT[]; -- Liste des maisons ciblées (ex: ['Harmonis', 'Solencia'])

-- 5. Récompenses XP spécifiques (si différent de points)
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS xp_reward INTEGER;

-- 6. Mise à jour des permissions (au cas où)
GRANT ALL ON TABLE public.quests TO authenticated;
GRANT ALL ON TABLE public.quests TO service_role;

-- 7. Rafraîchir le cache de l'API pour voir les nouvelles colonnes immédiatement
NOTIFY pgrst, 'reload config';
