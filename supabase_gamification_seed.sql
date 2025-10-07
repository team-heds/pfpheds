-- ================================================
-- DONNÉES DE TEST - SYSTÈME DE GAMIFICATION
-- ================================================

-- ========================================
-- 1. MAISONS HES
-- ========================================

INSERT INTO houses (name, motto, description, color, icon, total_points, level, traits) VALUES
('Harmonis', 'L''équilibre soigne', 'Tu es quelqu''un de stable, paisible et centré. Tu cherches l''harmonie autour de toi, tu aides les autres à se sentir bien sans faire de bruit. Tu sais que l''équilibre soigne.', '#2E8B57', 'pi-plus', 0, 1, '["Stabilité", "Paix", "Équilibre", "Harmonie", "Sérénité"]'::jsonb),
('Elaris', 'Clarifier, guider, apaiser', 'Tu es clair dans tes idées, tu aimes guider les autres et voir au-delà des apparences. Tu éclaires les chemins, tu transmets des idées avec calme et assurance.', '#DC143C', 'pi-sun', 0, 1, '["Clarté", "Leadership", "Vision", "Guidance", "Assurance"]'::jsonb),
('Doloris', 'Comprendre la douleur, c''est soigner', 'Tu ressens profondément ce que les autres vivent. Tu as de la compassion, tu veux comprendre avant d''agir. Tu ne fais pas les choses à moitié.', '#FFD700', 'pi-heart', 0, 1, '["Empathie", "Compassion", "Compréhension", "Profondeur", "Sensibilité"]'::jsonb),
('Solencia', 'Apaiser pour mieux guérir', 'Tu es doux, apaisant, et tu offres ta présence aux autres dans les moments difficiles. Tu sais écouter, rassurer et consoler.', '#4169E1', 'pi-moon', 0, 1, '["Douceur", "Réconfort", "Écoute", "Tendresse", "Consolation"]'::jsonb);

-- ========================================
-- 2. BADGES
-- ========================================

-- Badges de progression
INSERT INTO badges (name, description, icon, rarity, category, xp_reward, requirements) VALUES
('Premier Pas', 'Complète ta première quête', 'pi-flag', 'common', 'progression', 10, '{"type": "quests_completed", "value": 1}'::jsonb),
('Apprenti', 'Atteins le niveau 5', 'pi-star', 'common', 'progression', 25, '{"type": "level", "value": 5}'::jsonb),
('Étudiant Assidu', 'Atteins le niveau 10', 'pi-book', 'uncommon', 'progression', 50, '{"type": "level", "value": 10}'::jsonb),
('Expert', 'Atteins le niveau 25', 'pi-crown', 'rare', 'progression', 100, '{"type": "level", "value": 25}'::jsonb),
('Maître', 'Atteins le niveau 50', 'pi-shield', 'epic', 'progression', 250, '{"type": "level", "value": 50}'::jsonb),
('Légende', 'Atteins le niveau 100', 'pi-trophy', 'legendary', 'progression', 500, '{"type": "level", "value": 100}'::jsonb),

-- Badges de streak
('Régulier', 'Connecte-toi 3 jours d''affilée', 'pi-calendar', 'common', 'streak', 15, '{"type": "login_streak", "value": 3}'::jsonb),
('Fidèle', 'Connecte-toi 7 jours d''affilée', 'pi-calendar-plus', 'uncommon', 'streak', 35, '{"type": "login_streak", "value": 7}'::jsonb),
('Dévoué', 'Connecte-toi 30 jours d''affilée', 'pi-calendar-times', 'rare', 'streak', 100, '{"type": "login_streak", "value": 30}'::jsonb),
('Inébranlable', 'Connecte-toi 100 jours d''affilée', 'pi-prime', 'epic', 'streak', 300, '{"type": "login_streak", "value": 100}'::jsonb),

-- Badges sociaux
('Sociable', 'Fais 10 commentaires', 'pi-comment', 'common', 'social', 20, '{"type": "comments", "value": 10}'::jsonb),
('Populaire', 'Reçois 50 likes', 'pi-heart-fill', 'uncommon', 'social', 40, '{"type": "likes_received", "value": 50}'::jsonb),
('Influenceur', 'Reçois 200 likes', 'pi-users', 'rare', 'social', 80, '{"type": "likes_received", "value": 200}'::jsonb),
('Ambassadeur', 'Aide 10 autres étudiants', 'pi-user-plus', 'epic', 'social', 150, '{"type": "help_count", "value": 10}'::jsonb),

-- Badges de maisons
('Esprit d''Harmonis', 'Rejoins la maison Harmonis', 'pi-plus', 'uncommon', 'house', 30, '{"type": "house", "value": "Harmonis"}'::jsonb),
('Esprit d''Elaris', 'Rejoins la maison Elaris', 'pi-sun', 'uncommon', 'house', 30, '{"type": "house", "value": "Elaris"}'::jsonb),
('Esprit de Doloris', 'Rejoins la maison Doloris', 'pi-heart', 'uncommon', 'house', 30, '{"type": "house", "value": "Doloris"}'::jsonb),
('Esprit de Solencia', 'Rejoins la maison Solencia', 'pi-moon', 'uncommon', 'house', 30, '{"type": "house", "value": "Solencia"}'::jsonb),

-- Badges de défis
('Challenger', 'Complète ton premier défi', 'pi-bolt', 'common', 'challenges', 15, '{"type": "challenges_completed", "value": 1}'::jsonb),
('Compétiteur', 'Complète 10 défis', 'pi-exclamation-circle', 'uncommon', 'challenges', 50, '{"type": "challenges_completed", "value": 10}'::jsonb),
('Champion', 'Complète 50 défis', 'pi-check-circle', 'rare', 'challenges', 150, '{"type": "challenges_completed", "value": 50}'::jsonb),

-- Badges spéciaux
('Pionnier', 'Sois parmi les 100 premiers inscrits', 'pi-star-fill', 'legendary', 'special', 200, '{"type": "early_adopter", "value": 100}'::jsonb),
('Perfectionniste', 'Complète toutes les quêtes disponibles', 'pi-check-square', 'mythic', 'special', 500, '{"type": "all_quests_completed", "value": true}'::jsonb),
('Collectionneur', 'Débloque 50 badges', 'pi-briefcase', 'epic', 'special', 250, '{"type": "badges_count", "value": 50}'::jsonb);

-- ========================================
-- 3. DÉFIS
-- ========================================

-- Défis faciles
INSERT INTO challenges (title, description, type, difficulty, xp_reward, target_value, icon, active, start_date, end_date) VALUES
('Bienvenue !', 'Complète ton profil à 100%', 'profile', 'easy', 50, 100, 'pi-user-edit', true, NOW(), NOW() + INTERVAL '30 days'),
('Premier Post', 'Publie ton premier message sur le forum', 'social', 'easy', 30, 1, 'pi-send', true, NOW(), NOW() + INTERVAL '7 days'),
('Commentateur', 'Fais 5 commentaires constructifs', 'social', 'easy', 40, 5, 'pi-comment', true, NOW(), NOW() + INTERVAL '7 days'),
('Lecteur Assidu', 'Lis 10 articles du blog', 'learning', 'easy', 35, 10, 'pi-book', true, NOW(), NOW() + INTERVAL '14 days'),

-- Défis moyens
('Sociable', 'Crée 3 discussions dans le forum', 'social', 'medium', 75, 3, 'pi-comments', true, NOW(), NOW() + INTERVAL '14 days'),
('Étudiant Actif', 'Complète 5 quêtes cette semaine', 'quests', 'medium', 100, 5, 'pi-compass', true, NOW(), NOW() + INTERVAL '7 days'),
('Expert du Sujet', 'Réponds correctement à 20 quiz', 'learning', 'medium', 80, 20, 'pi-question-circle', true, NOW(), NOW() + INTERVAL '30 days'),
('Mentor', 'Aide 5 autres étudiants', 'social', 'medium', 90, 5, 'pi-user-plus', true, NOW(), NOW() + INTERVAL '14 days'),

-- Défis difficiles
('Marathon de Connaissances', 'Obtiens 90% ou plus à 10 quiz', 'learning', 'hard', 150, 10, 'pi-chart-line', true, NOW(), NOW() + INTERVAL '30 days'),
('Leader Communautaire', 'Crée 10 discussions populaires (10+ likes chacune)', 'social', 'hard', 200, 10, 'pi-star-fill', true, NOW(), NOW() + INTERVAL '30 days'),
('Maître des Quêtes', 'Complète 20 quêtes', 'quests', 'hard', 180, 20, 'pi-map', true, NOW(), NOW() + INTERVAL '60 days'),

-- Défis experts
('Perfectionniste', 'Obtiens 100% sur tous les modules disponibles', 'learning', 'expert', 300, 100, 'pi-check-circle', true, NOW(), NOW() + INTERVAL '90 days'),
('Influenceur', 'Atteins 500 likes sur tes publications', 'social', 'expert', 350, 500, 'pi-heart-fill', true, NOW(), NOW() + INTERVAL '90 days');

-- ========================================
-- 4. QUÊTES
-- ========================================

-- Quêtes d'introduction
INSERT INTO quests (title, description, story, type, difficulty, xp_reward, total_steps, steps, icon, active, is_daily) VALUES
('Découverte de la Plateforme', 
 'Familiarise-toi avec toutes les fonctionnalités', 
 'Bienvenue ! Cette quête te guidera à travers les différentes sections de la plateforme.',
 'tutorial', 'easy', 100, 5,
 '[
   {"title": "Complète ton profil", "description": "Ajoute une photo et une bio", "xp": 20},
   {"title": "Explore le forum", "description": "Visite le forum et lis 3 discussions", "xp": 15},
   {"title": "Rejoins une maison", "description": "Passe le quiz des maisons HES", "xp": 25},
   {"title": "Fais ta première publication", "description": "Partage quelque chose sur le forum", "xp": 20},
   {"title": "Connecte-toi 3 jours d''affilée", "description": "Reviens demain et après-demain", "xp": 20}
 ]'::jsonb,
 'pi-map-marker', true, false),

('Le Chemin du Soignant', 
 'Apprends les bases des soins infirmiers', 
 'Cette quête te guidera à travers les fondamentaux des soins.',
 'learning', 'medium', 200, 4,
 '[
   {"title": "Module 1: Hygiène", "description": "Complète le module d''hygiène", "xp": 50},
   {"title": "Module 2: Anatomie de base", "description": "Apprends l''anatomie de base", "xp": 50},
   {"title": "Module 3: Premiers soins", "description": "Maîtrise les premiers soins", "xp": 50},
   {"title": "Examen final", "description": "Réussis l''examen avec 80%+", "xp": 50}
 ]'::jsonb,
 'pi-heart', true, false),

('Esprit d''Équipe', 
 'Collabore avec d''autres étudiants', 
 'Le travail d''équipe est essentiel dans le domaine de la santé.',
 'social', 'medium', 150, 3,
 '[
   {"title": "Rejoins un groupe d''étude", "description": "Crée ou rejoins un groupe", "xp": 40},
   {"title": "Participe à une discussion", "description": "Contribue activement à une discussion de groupe", "xp": 50},
   {"title": "Aide un camarade", "description": "Réponds à une question d''un autre étudiant", "xp": 60}
 ]'::jsonb,
 'pi-users', true, false);

-- Quêtes quotidiennes
INSERT INTO quests (title, description, story, type, difficulty, xp_reward, total_steps, steps, icon, active, is_daily) VALUES
('Routine Quotidienne', 
 'Complète tes activités du jour', 
 'Chaque jour est une opportunité d''apprendre et de progresser.',
 'daily', 'easy', 50, 3,
 '[
   {"title": "Connecte-toi", "description": "Démarre ta journée sur la plateforme", "xp": 10},
   {"title": "Lis un article", "description": "Apprends quelque chose de nouveau", "xp": 20},
   {"title": "Interagis", "description": "Fais un commentaire ou like une publication", "xp": 20}
 ]'::jsonb,
 'pi-calendar', true, true);

-- Quêtes hebdomadaires
INSERT INTO quests (title, description, story, type, difficulty, xp_reward, total_steps, steps, icon, active, is_weekly) VALUES
('Objectifs Hebdomadaires', 
 'Accomplis tes objectifs de la semaine', 
 'Une semaine productive te rapproche de tes objectifs.',
 'weekly', 'medium', 150, 4,
 '[
   {"title": "Complète 3 modules", "description": "Termine 3 modules d''apprentissage", "xp": 40},
   {"title": "Participe à 5 discussions", "description": "Sois actif sur le forum", "xp": 30},
   {"title": "Aide 2 étudiants", "description": "Réponds aux questions de tes pairs", "xp": 40},
   {"title": "Obtiens 80%+ à un quiz", "description": "Montre ta maîtrise", "xp": 40}
 ]'::jsonb,
 'pi-chart-bar', true, true);

-- ================================================
-- STATISTIQUES
-- ================================================

-- Afficher le nombre de badges créés par rareté
SELECT rarity, COUNT(*) as count
FROM badges
GROUP BY rarity
ORDER BY 
  CASE rarity
    WHEN 'common' THEN 1
    WHEN 'uncommon' THEN 2
    WHEN 'rare' THEN 3
    WHEN 'epic' THEN 4
    WHEN 'legendary' THEN 5
    WHEN 'mythic' THEN 6
  END;

-- Afficher le nombre de défis par difficulté
SELECT difficulty, COUNT(*) as count
FROM challenges
GROUP BY difficulty
ORDER BY 
  CASE difficulty
    WHEN 'easy' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'hard' THEN 3
    WHEN 'expert' THEN 4
  END;

-- Afficher les quêtes avec leur type
SELECT title, type, difficulty, xp_reward, total_steps
FROM quests
ORDER BY difficulty, xp_reward DESC;
