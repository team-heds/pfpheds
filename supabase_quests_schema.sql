-- ============================================
-- SCHEMA SUPABASE POUR SYSTÈME DE QUÊTES
-- ============================================
-- À exécuter dans le SQL Editor de Supabase
-- ============================================

-- NETTOYAGE : Supprimer les tables existantes (dans le bon ordre)
DROP TABLE IF EXISTS public.user_quest_step_progress CASCADE;
DROP TABLE IF EXISTS public.user_quest_progress CASCADE;
DROP TABLE IF EXISTS public.quest_steps CASCADE;
DROP TABLE IF EXISTS public.quests CASCADE;

-- 1. TABLE QUESTS (Quêtes créées par les admins)
-- ============================================
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL, -- 'daily', 'weekly', 'achievement', 'exploration', 'social', 'challenge'
  difficulty TEXT NOT NULL, -- 'easy', 'medium', 'hard', 'expert'
  category TEXT,
  points INTEGER NOT NULL DEFAULT 50,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'active', -- 'draft', 'active', 'archived'
  
  -- Métadonnées
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Statistiques
  participants_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  
  -- Contraintes
  CONSTRAINT valid_type CHECK (type IN ('daily', 'weekly', 'achievement', 'exploration', 'social', 'challenge')),
  CONSTRAINT valid_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'archived'))
);

-- 2. TABLE QUEST_STEPS (Étapes des quêtes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.quest_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(quest_id, step_order)
);

-- 3. TABLE USER_QUEST_PROGRESS (Progression utilisateur)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- Pourcentage 0-100
  current_step INTEGER DEFAULT 0,
  
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, quest_id),
  CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100),
  CONSTRAINT valid_status CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed'))
);

-- 4. TABLE USER_QUEST_STEP_PROGRESS (Progression par étape)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_quest_step_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_quest_progress_id UUID NOT NULL REFERENCES public.user_quest_progress(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.quest_steps(id) ON DELETE CASCADE,
  
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_quest_progress_id, step_id)
);

-- ============================================
-- INDEX POUR PERFORMANCE
-- ============================================
CREATE INDEX idx_quests_status ON public.quests(status);
CREATE INDEX idx_quests_type ON public.quests(type);
CREATE INDEX idx_quests_created_at ON public.quests(created_at DESC);

CREATE INDEX idx_quest_steps_quest_id ON public.quest_steps(quest_id);
CREATE INDEX idx_quest_steps_order ON public.quest_steps(quest_id, step_order);

CREATE INDEX idx_user_quest_progress_user ON public.user_quest_progress(user_id);
CREATE INDEX idx_user_quest_progress_quest ON public.user_quest_progress(quest_id);
CREATE INDEX idx_user_quest_progress_status ON public.user_quest_progress(user_id, status);

-- ============================================
-- TRIGGERS POUR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quests_updated_at
BEFORE UPDATE ON public.quests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_quest_progress_updated_at
BEFORE UPDATE ON public.user_quest_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_step_progress ENABLE ROW LEVEL SECURITY;

-- POLICIES QUESTS
-- Lecture : Tout le monde peut voir les quêtes actives
CREATE POLICY "Anyone can view active quests"
ON public.quests FOR SELECT
TO authenticated
USING (status = 'active');

-- Lecture admin : Les admins voient toutes les quêtes
CREATE POLICY "Admins can view all quests"
ON public.quests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role_name IN ('admin', 'game_master') 
    AND is_active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->'roles'->>'admin' = 'true'
  )
);

-- Création : Seuls les admins peuvent créer
CREATE POLICY "Admins can create quests"
ON public.quests FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role_name IN ('admin', 'game_master') 
    AND is_active = true
  )
  OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->'roles'->>'admin' = 'true'
  )
);

-- Mise à jour : Seuls les admins peuvent modifier
CREATE POLICY "Admins can update quests"
ON public.quests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role_name IN ('admin', 'game_master') 
    AND is_active = true
  )
  OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->'roles'->>'admin' = 'true'
  )
);

-- Suppression : Seuls les admins peuvent supprimer
CREATE POLICY "Admins can delete quests"
ON public.quests FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role_name IN ('admin', 'game_master') 
    AND is_active = true
  )
  OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->'roles'->>'admin' = 'true'
  )
);

-- POLICIES QUEST_STEPS
-- Lecture : Voir les étapes des quêtes actives
CREATE POLICY "Anyone can view steps of active quests"
ON public.quest_steps FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quests 
    WHERE id = quest_id AND status = 'active'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role_name IN ('admin', 'game_master') 
    AND is_active = true
  )
);

-- Création/Modification : Admins uniquement
CREATE POLICY "Admins can manage quest steps"
ON public.quest_steps FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role_name IN ('admin', 'game_master') 
    AND is_active = true
  )
  OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->'roles'->>'admin' = 'true'
  )
);

-- POLICIES USER_QUEST_PROGRESS
-- Lecture : Voir sa propre progression
CREATE POLICY "Users can view own progress"
ON public.user_quest_progress FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Création/Modification : Gérer sa propre progression
CREATE POLICY "Users can manage own progress"
ON public.user_quest_progress FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins : Voir toutes les progressions
CREATE POLICY "Admins can view all progress"
ON public.user_quest_progress FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role_name IN ('admin', 'game_master') 
    AND is_active = true
  )
);

-- POLICIES USER_QUEST_STEP_PROGRESS
CREATE POLICY "Users can manage own step progress"
ON public.user_quest_step_progress FOR ALL
TO authenticated
USING (
  user_quest_progress_id IN (
    SELECT id FROM public.user_quest_progress WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  user_quest_progress_id IN (
    SELECT id FROM public.user_quest_progress WHERE user_id = auth.uid()
  )
);

-- ============================================
-- FONCTIONS HELPER
-- ============================================

-- Fonction pour initialiser une quête pour un utilisateur
CREATE OR REPLACE FUNCTION assign_quest_to_user(p_user_id UUID, p_quest_id UUID)
RETURNS UUID AS $$
DECLARE
  v_progress_id UUID;
BEGIN
  -- Créer l'entrée de progression
  INSERT INTO public.user_quest_progress (user_id, quest_id, status, started_at)
  VALUES (p_user_id, p_quest_id, 'in_progress', NOW())
  ON CONFLICT (user_id, quest_id) 
  DO UPDATE SET 
    status = 'in_progress',
    started_at = COALESCE(user_quest_progress.started_at, NOW()),
    updated_at = NOW()
  RETURNING id INTO v_progress_id;
  
  RETURN v_progress_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer une quête comme complétée
CREATE OR REPLACE FUNCTION complete_quest(p_user_id UUID, p_quest_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_quest_progress
  SET 
    status = 'completed',
    progress = 100,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id AND quest_id = p_quest_id;
  
  -- Incrémenter le compteur de complétion de la quête
  UPDATE public.quests
  SET completion_count = completion_count + 1
  WHERE id = p_quest_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour les statistiques des quêtes
CREATE OR REPLACE FUNCTION update_quest_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrémenter le compteur de participants
    UPDATE public.quests
    SET participants_count = participants_count + 1
    WHERE id = NEW.quest_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quest_stats_trigger
AFTER INSERT ON public.user_quest_progress
FOR EACH ROW
EXECUTE FUNCTION update_quest_stats();

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue pour les quêtes avec leurs étapes
CREATE OR REPLACE VIEW quests_with_steps AS
SELECT 
  q.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', qs.id,
        'step_order', qs.step_order,
        'title', qs.title,
        'description', qs.description,
        'required', qs.required
      ) ORDER BY qs.step_order
    ) FILTER (WHERE qs.id IS NOT NULL),
    '[]'::json
  ) as steps
FROM public.quests q
LEFT JOIN public.quest_steps qs ON q.id = qs.quest_id
GROUP BY q.id;

-- Vue pour la progression utilisateur avec détails
CREATE OR REPLACE VIEW user_quest_progress_detailed AS
SELECT 
  uqp.*,
  q.title as quest_title,
  q.description as quest_description,
  q.type as quest_type,
  q.difficulty as quest_difficulty,
  q.points as quest_points,
  q.xp_reward as quest_xp_reward
FROM public.user_quest_progress uqp
JOIN public.quests q ON uqp.quest_id = q.id;

-- ============================================
-- DONNÉES D'EXEMPLE (OPTIONNEL)
-- ============================================

-- Quête exemple 1
DO $$ 
DECLARE
  v_quest_id UUID;
BEGIN
  INSERT INTO public.quests (
    title, 
    description, 
    type, 
    difficulty, 
    category, 
    points, 
    xp_reward, 
    status
  ) VALUES (
    'Première Connexion',
    'Connectez-vous à la plateforme pour la première fois et explorez l''interface',
    'achievement',
    'easy',
    'Découverte',
    50,
    50,
    'active'
  ) RETURNING id INTO v_quest_id;
  
  -- Étapes de la quête
  INSERT INTO public.quest_steps (quest_id, step_order, title, description) VALUES
    (v_quest_id, 1, 'Se connecter', 'Connectez-vous avec vos identifiants'),
    (v_quest_id, 2, 'Visiter le profil', 'Accédez à votre page de profil'),
    (v_quest_id, 3, 'Explorer les quêtes', 'Visitez la page des quêtes');
END $$;

-- Quête exemple 2
DO $$ 
DECLARE
  v_quest_id UUID;
BEGIN
  INSERT INTO public.quests (
    title, 
    description, 
    type, 
    difficulty, 
    category, 
    points, 
    xp_reward, 
    status
  ) VALUES (
    'Contributeur Actif',
    'Participez activement à la communauté en publiant du contenu',
    'social',
    'medium',
    'Communauté',
    100,
    100,
    'active'
  ) RETURNING id INTO v_quest_id;
  
  -- Étapes
  INSERT INTO public.quest_steps (quest_id, step_order, title, description) VALUES
    (v_quest_id, 1, 'Créer un post', 'Publiez votre premier message'),
    (v_quest_id, 2, 'Commenter', 'Commentez un post d''un autre utilisateur'),
    (v_quest_id, 3, 'Recevoir des likes', 'Recevez 5 likes sur vos publications');
END $$;

-- ============================================
-- FIN DU SCHEMA
-- ============================================

-- NOTES D'UTILISATION :
-- 1. Exécutez ce script dans le SQL Editor de Supabase
-- 2. Vérifiez que les tables user_roles existent (créées précédemment pour les rôles admin)
-- 3. Les RLS policies utilisent les rôles admin pour les permissions
-- 4. Les vues facilitent les requêtes complexes
-- 5. Les fonctions helper simplifient les opérations courantes
