-- ================================================
-- SCHEMA SUPABASE - SYSTÈME DE GAMIFICATION COMPLET
-- ================================================

-- Table: badges
-- Tous les badges disponibles dans le système
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  rarity VARCHAR(50) CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  category VARCHAR(100),
  xp_reward INTEGER DEFAULT 0,
  requirements JSONB,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges(active);

-- Table: user_badges
-- Badges débloqués par les utilisateurs
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_unlocked ON user_badges(unlocked_at);

-- Table: challenges
-- Défis disponibles
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  difficulty VARCHAR(50) CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  xp_reward INTEGER DEFAULT 0,
  requirements JSONB,
  target_value INTEGER,
  icon VARCHAR(100),
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(active);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);

-- Table: user_challenges
-- Progression des utilisateurs sur les défis
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_completed ON user_challenges(completed);

-- Table: quests
-- Quêtes disponibles (multi-étapes)
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  story TEXT,
  type VARCHAR(50),
  difficulty VARCHAR(50) CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  xp_reward INTEGER DEFAULT 0,
  steps JSONB,
  total_steps INTEGER DEFAULT 1,
  requirements JSONB,
  icon VARCHAR(100),
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  is_daily BOOLEAN DEFAULT false,
  is_weekly BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(active);
CREATE INDEX IF NOT EXISTS idx_quests_difficulty ON quests(difficulty);
CREATE INDEX IF NOT EXISTS idx_quests_daily ON quests(is_daily);
CREATE INDEX IF NOT EXISTS idx_quests_weekly ON quests(is_weekly);

-- Table: user_quests
-- Progression des utilisateurs sur les quêtes
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  steps_completed INTEGER DEFAULT 0,
  current_step INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

CREATE INDEX IF NOT EXISTS idx_user_quests_user ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_quest ON user_quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_completed ON user_quests(completed);

-- Table: houses (Maisons HES)
CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  motto TEXT,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(100),
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  traits JSONB,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_houses_points ON houses(total_points DESC);

-- Table: gamification_data
-- Données de gamification principales pour chaque utilisateur
CREATE TABLE IF NOT EXISTS gamification_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  house_id UUID REFERENCES houses(id),
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  xp_to_next INTEGER DEFAULT 100,
  login_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  last_login TIMESTAMP WITH TIME ZONE,
  badges_count INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  quests_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gamification_user ON gamification_data(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_house ON gamification_data(house_id);
CREATE INDEX IF NOT EXISTS idx_gamification_level ON gamification_data(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_xp ON gamification_data(total_xp DESC);

-- Table: notifications
-- Notifications de gamification
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Table: gamification_logs
-- Historique de toutes les actions de gamification
CREATE TABLE IF NOT EXISTS gamification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  xp_gained INTEGER DEFAULT 0,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gamification_logs_user ON gamification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_logs_action ON gamification_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_gamification_logs_created ON gamification_logs(created_at DESC);

-- ================================================
-- FONCTIONS ET TRIGGERS
-- ================================================

-- Fonction: Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_badges_updated_at BEFORE UPDATE ON badges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quests_updated_at BEFORE UPDATE ON quests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_houses_updated_at BEFORE UPDATE ON houses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gamification_data_updated_at BEFORE UPDATE ON gamification_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction: Calculer le niveau basé sur l'XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(SQRT(xp / 50)) + 1;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Calculer l'XP nécessaire pour le prochain niveau
CREATE OR REPLACE FUNCTION calculate_xp_to_next(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (current_level * current_level * 50) - ((current_level - 1) * (current_level - 1) * 50);
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- POLITIQUES RLS (Row Level Security)
-- ================================================

-- Activer RLS sur toutes les tables
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_logs ENABLE ROW LEVEL SECURITY;

-- Politiques pour badges (lecture publique)
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT USING (true);

-- Politiques pour user_badges
CREATE POLICY "Users can view their own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour challenges (lecture publique)
CREATE POLICY "Challenges are viewable by everyone" ON challenges FOR SELECT USING (true);

-- Politiques pour user_challenges
CREATE POLICY "Users can view their own challenge progress" ON user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own challenge progress" ON user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own challenge progress" ON user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour quests (lecture publique)
CREATE POLICY "Quests are viewable by everyone" ON quests FOR SELECT USING (true);

-- Politiques pour user_quests
CREATE POLICY "Users can view their own quest progress" ON user_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quest progress" ON user_quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quest progress" ON user_quests FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour houses (lecture publique)
CREATE POLICY "Houses are viewable by everyone" ON houses FOR SELECT USING (true);

-- Politiques pour gamification_data
CREATE POLICY "Users can view their own gamification data" ON gamification_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own gamification data" ON gamification_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own gamification data" ON gamification_data FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour gamification_logs
CREATE POLICY "Users can view their own logs" ON gamification_logs FOR SELECT USING (auth.uid() = user_id);

-- ================================================
-- COMMENTAIRES
-- ================================================

COMMENT ON TABLE badges IS 'Tous les badges disponibles dans le système de gamification';
COMMENT ON TABLE user_badges IS 'Badges débloqués par chaque utilisateur';
COMMENT ON TABLE challenges IS 'Défis disponibles pour les utilisateurs';
COMMENT ON TABLE user_challenges IS 'Progression des utilisateurs sur les défis';
COMMENT ON TABLE quests IS 'Quêtes multi-étapes disponibles';
COMMENT ON TABLE user_quests IS 'Progression des utilisateurs sur les quêtes';
COMMENT ON TABLE houses IS 'Maisons HES du système de gamification';
COMMENT ON TABLE gamification_data IS 'Données principales de gamification pour chaque utilisateur';
COMMENT ON TABLE notifications IS 'Notifications de gamification pour les utilisateurs';
COMMENT ON TABLE gamification_logs IS 'Historique de toutes les actions de gamification';
