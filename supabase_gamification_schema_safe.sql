-- ================================================
-- SCHEMA SUPABASE - SYSTÈME DE GAMIFICATION
-- VERSION SAFE - N'affecte PAS gamification_data et houses existants
-- ================================================

-- ========================================
-- NOUVELLES TABLES UNIQUEMENT
-- ========================================

-- Table: badges
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

CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges(active);

-- Table: user_badges
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

-- Table: notifications
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
-- FONCTIONS (compatibles avec tables existantes)
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour les nouvelles tables uniquement
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_badges_updated_at') THEN
    CREATE TRIGGER update_badges_updated_at BEFORE UPDATE ON badges
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_challenges_updated_at') THEN
    CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_quests_updated_at') THEN
    CREATE TRIGGER update_quests_updated_at BEFORE UPDATE ON quests
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Fonctions utilitaires
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(SQRT(xp / 50)) + 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_xp_to_next(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (current_level * current_level * 50) - ((current_level - 1) * (current_level - 1) * 50);
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- POLITIQUES RLS (nouvelles tables uniquement)
-- ================================================

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_logs ENABLE ROW LEVEL SECURITY;

-- Politiques badges
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON badges;
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT USING (true);

-- Politiques user_badges
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
CREATE POLICY "Users can view their own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
CREATE POLICY "Users can insert their own badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques challenges
DROP POLICY IF EXISTS "Challenges are viewable by everyone" ON challenges;
CREATE POLICY "Challenges are viewable by everyone" ON challenges FOR SELECT USING (true);

-- Politiques user_challenges
DROP POLICY IF EXISTS "Users can view their own challenge progress" ON user_challenges;
CREATE POLICY "Users can view their own challenge progress" ON user_challenges FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own challenge progress" ON user_challenges;
CREATE POLICY "Users can insert their own challenge progress" ON user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own challenge progress" ON user_challenges;
CREATE POLICY "Users can update their own challenge progress" ON user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Politiques quests
DROP POLICY IF EXISTS "Quests are viewable by everyone" ON quests;
CREATE POLICY "Quests are viewable by everyone" ON quests FOR SELECT USING (true);

-- Politiques user_quests
DROP POLICY IF EXISTS "Users can view their own quest progress" ON user_quests;
CREATE POLICY "Users can view their own quest progress" ON user_quests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quest progress" ON user_quests;
CREATE POLICY "Users can insert their own quest progress" ON user_quests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quest progress" ON user_quests;
CREATE POLICY "Users can update their own quest progress" ON user_quests FOR UPDATE USING (auth.uid() = user_id);

-- Politiques notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Politiques gamification_logs
DROP POLICY IF EXISTS "Users can view their own logs" ON gamification_logs;
CREATE POLICY "Users can view their own logs" ON gamification_logs FOR SELECT USING (auth.uid() = user_id);

-- ================================================
-- VÉRIFICATION
-- ================================================

-- Compter les tables créées
SELECT 
  'badges' as table_name, COUNT(*) as row_count FROM badges
UNION ALL
SELECT 'challenges', COUNT(*) FROM challenges
UNION ALL
SELECT 'quests', COUNT(*) FROM quests
UNION ALL
SELECT 'user_badges', COUNT(*) FROM user_badges
UNION ALL
SELECT 'user_challenges', COUNT(*) FROM user_challenges
UNION ALL
SELECT 'user_quests', COUNT(*) FROM user_quests;

SELECT 'Schema safe installé avec succès !' as status;
