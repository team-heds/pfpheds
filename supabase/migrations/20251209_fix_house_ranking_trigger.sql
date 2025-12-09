-- Fonction pour mettre à jour les statistiques d'une maison (XP Total + Nombre de membres)
CREATE OR REPLACE FUNCTION update_house_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Cas DELETE : Mettre à jour l'ancienne maison
    IF (TG_OP = 'DELETE') THEN
        UPDATE public.houses
        SET 
            total_xp = (SELECT COALESCE(SUM(total_xp), 0) FROM public.gamification_data WHERE house_id = OLD.house_id),
            member_count = (SELECT COUNT(*) FROM public.gamification_data WHERE house_id = OLD.house_id)
        WHERE id = OLD.house_id;
        RETURN OLD;
    
    -- 2. Cas INSERT : Mettre à jour la nouvelle maison
    ELSIF (TG_OP = 'INSERT') THEN
        UPDATE public.houses
        SET 
            total_xp = (SELECT COALESCE(SUM(total_xp), 0) FROM public.gamification_data WHERE house_id = NEW.house_id),
            member_count = (SELECT COUNT(*) FROM public.gamification_data WHERE house_id = NEW.house_id)
        WHERE id = NEW.house_id;
        RETURN NEW;
    
    -- 3. Cas UPDATE : Gérer le changement de maison ou de points
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Si le house_id a changé, mettre à jour l'ancienne maison
        IF (OLD.house_id IS DISTINCT FROM NEW.house_id) THEN
            UPDATE public.houses
            SET 
                total_xp = (SELECT COALESCE(SUM(total_xp), 0) FROM public.gamification_data WHERE house_id = OLD.house_id),
                member_count = (SELECT COUNT(*) FROM public.gamification_data WHERE house_id = OLD.house_id)
            WHERE id = OLD.house_id;
        END IF;
        
        -- Mettre à jour la maison actuelle
        UPDATE public.houses
        SET 
            total_xp = (SELECT COALESCE(SUM(total_xp), 0) FROM public.gamification_data WHERE house_id = NEW.house_id),
            member_count = (SELECT COUNT(*) FROM public.gamification_data WHERE house_id = NEW.house_id)
        WHERE id = NEW.house_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà pour éviter les doublons
DROP TRIGGER IF EXISTS on_gamification_change_update_house_stats ON public.gamification_data;

-- Créer le trigger qui se déclenche à chaque modification
CREATE TRIGGER on_gamification_change_update_house_stats
AFTER INSERT OR UPDATE OR DELETE ON public.gamification_data
FOR EACH ROW
EXECUTE FUNCTION update_house_stats();

-- ==========================================================
-- CORRECTION IMMÉDIATE DU CLASSEMENT
-- ==========================================================
-- Recalculer les stats de toutes les maisons maintenant
UPDATE public.houses h
SET 
    total_xp = (SELECT COALESCE(SUM(total_xp), 0) FROM public.gamification_data WHERE house_id = h.id),
    member_count = (SELECT COUNT(*) FROM public.gamification_data WHERE house_id = h.id);

-- Rafraîchir le cache de l'API Supabase
NOTIFY pgrst, 'reload config';
