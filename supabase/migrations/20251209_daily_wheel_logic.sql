-- 1. Nettoyage (pour éviter les conflits si vous avez déjà essayé)
DROP FUNCTION IF EXISTS public.spin_daily_wheel();
DROP FUNCTION IF EXISTS public.get_daily_wheel_status();

-- 2. Création de la table historique
CREATE TABLE IF NOT EXISTS public.daily_wheel_spins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    spin_date DATE DEFAULT CURRENT_DATE NOT NULL,
    result_type TEXT NOT NULL,
    prize_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_daily_wheel_user_date ON public.daily_wheel_spins(user_id, spin_date);

-- 3. Fonction SPIN (Moteur du jeu + Ajout XP)
CREATE OR REPLACE FUNCTION public.spin_daily_wheel()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_rand INT;
    v_result_type TEXT;
    v_prize_details JSONB;
    v_xp_bonus INT := 0;
    v_already_spun BOOLEAN;
BEGIN
    v_user_id := auth.uid();

    -- Vérif si déjà joué
    SELECT EXISTS(SELECT 1 FROM public.daily_wheel_spins WHERE user_id = v_user_id AND spin_date = CURRENT_DATE) INTO v_already_spun;
    IF v_already_spun THEN RAISE EXCEPTION 'ALREADY_SPUN_TODAY'; END IF;

    -- Tirage
    v_rand := floor(random() * 100 + 1);

    -- Logique gains
    IF v_rand <= 35 THEN
        v_result_type := 'QUIZ_EASY';
        v_xp_bonus := 2; 
        v_prize_details := jsonb_build_object('xp', 10, 'difficulty', 'easy', 'label', 'Quiz Facile');
    ELSIF v_rand <= 60 THEN
        v_result_type := 'XP_BONUS';
        v_xp_bonus := 5;
        v_prize_details := jsonb_build_object('xp', 5, 'label', 'Bonus +5 XP');
    ELSIF v_rand <= 75 THEN
         v_result_type := 'QUIZ_HARD';
         v_xp_bonus := 5;
         v_prize_details := jsonb_build_object('xp', 20, 'difficulty', 'hard', 'label', 'Quiz Difficile');
    ELSIF v_rand <= 90 THEN
         v_result_type := 'HELP_CHALLENGE';
         v_xp_bonus := 0;
         v_prize_details := jsonb_build_object('xp', 15, 'mission', 'help', 'label', 'Défi Entraide');
    ELSE
         v_result_type := 'REROLL';
         v_xp_bonus := 0;
         v_prize_details := jsonb_build_object('token', 1, 'label', 'Jeton Rejouer');
    END IF;

    -- Enregistrement du tour
    INSERT INTO public.daily_wheel_spins (user_id, result_type, prize_details)
    VALUES (v_user_id, v_result_type, v_prize_details);

    -- Mise à jour des points XP
    IF v_xp_bonus > 0 THEN
        INSERT INTO public.gamification_data (user_id, xp, level)
        VALUES (v_user_id, v_xp_bonus, 1)
        ON CONFLICT (user_id) 
        DO UPDATE SET xp = gamification_data.xp + v_xp_bonus, updated_at = NOW();
    END IF;

    RETURN jsonb_build_object('result_type', v_result_type, 'prize_details', v_prize_details, 'xp_added', v_xp_bonus, 'status', 'SUCCESS');
END;
$$;

-- 4. Fonction STATUS (Vérif disponibilité)
CREATE OR REPLACE FUNCTION public.get_daily_wheel_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_last_spin RECORD;
BEGIN
    v_user_id := auth.uid();
    SELECT * FROM public.daily_wheel_spins WHERE user_id = v_user_id AND spin_date = CURRENT_DATE INTO v_last_spin;
    
    RETURN jsonb_build_object(
        'can_spin', v_last_spin IS NULL,
        'last_result', CASE WHEN v_last_spin IS NOT NULL THEN v_last_spin.prize_details ELSE NULL END
    );
END;
$$;

-- 5. Permissions (Important !)
GRANT EXECUTE ON FUNCTION public.spin_daily_wheel TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_wheel_status TO authenticated;
GRANT ALL ON TABLE public.daily_wheel_spins TO authenticated;

-- 6. Recharger la config
NOTIFY pgrst, 'reload config';
