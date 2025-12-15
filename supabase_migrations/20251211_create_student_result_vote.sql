-- Migration pour créer la table student_result_vote
-- Cette table stocke les résultats de l'algorithme d'attribution des places

-- 1. Création de la table student_result_vote
CREATE TABLE IF NOT EXISTS student_result_vote (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    pfp_type TEXT NOT NULL,
    year TEXT NOT NULL,
    
    -- Place attribuée
    assigned_place_id TEXT,
    assigned_place_name TEXT,
    assigned_institution_name TEXT,
    
    -- Métadonnées de l'attribution
    assigned_rank INTEGER, -- Rang du choix attribué (1 = premier choix, 2 = deuxième, etc.)
    algorithm_run_id UUID, -- ID de l'exécution de l'algorithme
    algorithm_version TEXT DEFAULT '1.0',
    
    -- Statut de l'attribution
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'pending', 'rejected', 'confirmed')),
    
    -- Choix originaux de l'étudiant (copie depuis student_votes)
    original_choices JSONB,
    
    -- Notes et métadonnées
    notes TEXT,
    priority_score DECIMAL(10, 2), -- Score de priorité calculé par l'algorithme
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte unique: un seul résultat par étudiant/PFP/année
    UNIQUE(user_id, pfp_type, year)
);

-- 2. Créer les index pour optimiser les recherches
-- Index simples
CREATE INDEX IF NOT EXISTS idx_student_result_vote_user_id ON student_result_vote(user_id);
CREATE INDEX IF NOT EXISTS idx_student_result_vote_algorithm_run ON student_result_vote(algorithm_run_id);

-- Index composites pour les requêtes fréquentes (meilleure performance)
CREATE INDEX IF NOT EXISTS idx_student_result_vote_pfp_year_status ON student_result_vote(pfp_type, year, status);
CREATE INDEX IF NOT EXISTS idx_student_result_vote_place_year ON student_result_vote(assigned_place_id, year) WHERE assigned_place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_result_vote_user_pfp_year ON student_result_vote(user_id, pfp_type, year);

-- Index pour les statistiques et analyses
CREATE INDEX IF NOT EXISTS idx_student_result_vote_rank ON student_result_vote(assigned_rank) WHERE assigned_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_result_vote_assigned_at ON student_result_vote(assigned_at DESC);

-- Index GIN pour recherches dans JSONB (choix originaux)
CREATE INDEX IF NOT EXISTS idx_student_result_vote_original_choices ON student_result_vote USING GIN(original_choices);

-- 3. Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_student_result_vote_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS trigger_update_student_result_vote_updated_at ON student_result_vote;
CREATE TRIGGER trigger_update_student_result_vote_updated_at
    BEFORE UPDATE ON student_result_vote
    FOR EACH ROW
    EXECUTE FUNCTION update_student_result_vote_updated_at();

-- 5. Row Level Security (RLS)
ALTER TABLE student_result_vote ENABLE ROW LEVEL SECURITY;

-- Policy: Les étudiants peuvent voir leurs propres résultats
DROP POLICY IF EXISTS "Students can view their own results" ON student_result_vote;
CREATE POLICY "Students can view their own results"
    ON student_result_vote
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Les administrateurs peuvent tout voir
DROP POLICY IF EXISTS "Admins can view all results" ON student_result_vote;
CREATE POLICY "Admins can view all results"
    ON student_result_vote
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND (role = 'admin' OR role = 'superadmin')
        )
    );

-- Policy: Seuls les administrateurs peuvent insérer
DROP POLICY IF EXISTS "Admins can insert results" ON student_result_vote;
CREATE POLICY "Admins can insert results"
    ON student_result_vote
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND (role = 'admin' OR role = 'superadmin')
        )
    );

-- Policy: Seuls les administrateurs peuvent mettre à jour
DROP POLICY IF EXISTS "Admins can update results" ON student_result_vote;
CREATE POLICY "Admins can update results"
    ON student_result_vote
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND (role = 'admin' OR role = 'superadmin')
        )
    );

-- Policy: Seuls les administrateurs peuvent supprimer
DROP POLICY IF EXISTS "Admins can delete results" ON student_result_vote;
CREATE POLICY "Admins can delete results"
    ON student_result_vote
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND (role = 'admin' OR role = 'superadmin')
        )
    );

-- 6. Fonction RPC pour enregistrer un résultat d'attribution
CREATE OR REPLACE FUNCTION upsert_student_result(
    p_user_id UUID,
    p_pfp_type TEXT,
    p_year TEXT,
    p_assigned_place_id TEXT,
    p_assigned_place_name TEXT,
    p_assigned_institution_name TEXT,
    p_assigned_rank INTEGER,
    p_algorithm_run_id UUID,
    p_original_choices JSONB DEFAULT NULL,
    p_priority_score DECIMAL DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS student_result_vote AS $$
DECLARE
    result_record student_result_vote;
BEGIN
    -- Vérifier que l'utilisateur est admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND (role = 'admin' OR role = 'superadmin')
    ) THEN
        RAISE EXCEPTION 'Permission denied: Admin access required';
    END IF;

    -- Upsert du résultat
    INSERT INTO student_result_vote (
        user_id,
        pfp_type,
        year,
        assigned_place_id,
        assigned_place_name,
        assigned_institution_name,
        assigned_rank,
        algorithm_run_id,
        original_choices,
        priority_score,
        notes,
        status,
        assigned_at
    ) VALUES (
        p_user_id,
        p_pfp_type,
        p_year,
        p_assigned_place_id,
        p_assigned_place_name,
        p_assigned_institution_name,
        p_assigned_rank,
        p_algorithm_run_id,
        p_original_choices,
        p_priority_score,
        p_notes,
        'assigned',
        NOW()
    )
    ON CONFLICT (user_id, pfp_type, year)
    DO UPDATE SET
        assigned_place_id = EXCLUDED.assigned_place_id,
        assigned_place_name = EXCLUDED.assigned_place_name,
        assigned_institution_name = EXCLUDED.assigned_institution_name,
        assigned_rank = EXCLUDED.assigned_rank,
        algorithm_run_id = EXCLUDED.algorithm_run_id,
        original_choices = EXCLUDED.original_choices,
        priority_score = EXCLUDED.priority_score,
        notes = EXCLUDED.notes,
        status = 'assigned',
        assigned_at = NOW(),
        updated_at = NOW()
    RETURNING * INTO result_record;

    RETURN result_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6b. Fonction RPC pour insérer plusieurs résultats en batch (OPTIMISATION)
CREATE OR REPLACE FUNCTION batch_upsert_student_results(
    p_results JSONB
)
RETURNS TABLE (
    success_count INTEGER,
    error_count INTEGER,
    errors JSONB
) AS $$
DECLARE
    v_success_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_errors JSONB := '[]'::JSONB;
    v_result JSONB;
    v_user_id UUID;
BEGIN
    -- Pas de vérification des permissions ici
    -- Le service_role du backend a déjà tous les droits via SECURITY DEFINER

    -- Parcourir chaque résultat à insérer
    FOR v_result IN SELECT * FROM jsonb_array_elements(p_results)
    LOOP
        BEGIN
            v_user_id := (v_result->>'user_id')::UUID;
            
            INSERT INTO student_result_vote (
                user_id,
                pfp_type,
                year,
                assigned_place_id,
                assigned_place_name,
                assigned_institution_name,
                assigned_rank,
                algorithm_run_id,
                original_choices,
                priority_score,
                notes,
                status,
                assigned_at
            ) VALUES (
                v_user_id,
                v_result->>'pfp_type',
                v_result->>'year',
                v_result->>'assigned_place_id',
                v_result->>'assigned_place_name',
                v_result->>'assigned_institution_name',
                (v_result->>'assigned_rank')::INTEGER,
                (v_result->>'algorithm_run_id')::UUID,
                (v_result->>'original_choices')::JSONB,
                (v_result->>'priority_score')::DECIMAL,
                v_result->>'notes',
                COALESCE(v_result->>'status', 'assigned'),
                NOW()
            )
            ON CONFLICT (user_id, pfp_type, year)
            DO UPDATE SET
                assigned_place_id = EXCLUDED.assigned_place_id,
                assigned_place_name = EXCLUDED.assigned_place_name,
                assigned_institution_name = EXCLUDED.assigned_institution_name,
                assigned_rank = EXCLUDED.assigned_rank,
                algorithm_run_id = EXCLUDED.algorithm_run_id,
                original_choices = EXCLUDED.original_choices,
                priority_score = EXCLUDED.priority_score,
                notes = EXCLUDED.notes,
                status = 'assigned',
                assigned_at = NOW(),
                updated_at = NOW();
            
            v_success_count := v_success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            v_errors := v_errors || jsonb_build_object(
                'user_id', v_user_id,
                'error', SQLERRM
            );
        END;
    END LOOP;

    RETURN QUERY SELECT v_success_count, v_error_count, v_errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonction RPC pour récupérer le résultat d'un étudiant
CREATE OR REPLACE FUNCTION get_student_result(
    p_user_id UUID,
    p_pfp_type TEXT,
    p_year TEXT
)
RETURNS student_result_vote AS $$
DECLARE
    result_record student_result_vote;
BEGIN
    SELECT * INTO result_record
    FROM student_result_vote
    WHERE user_id = p_user_id
    AND pfp_type = p_pfp_type
    AND year = p_year;

    RETURN result_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Fonction RPC pour récupérer tous les résultats d'une attribution
CREATE OR REPLACE FUNCTION get_algorithm_results(
    p_pfp_type TEXT,
    p_year TEXT,
    p_algorithm_run_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    student_name TEXT,
    student_classe TEXT,
    pfp_type TEXT,
    year TEXT,
    assigned_place_id TEXT,
    assigned_place_name TEXT,
    assigned_institution_name TEXT,
    assigned_rank INTEGER,
    algorithm_run_id UUID,
    status TEXT,
    priority_score DECIMAL,
    assigned_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.user_id,
        COALESCE(u.display_name, CONCAT(u.forname, ' ', u.family_name)) AS student_name,
        u.classe AS student_classe,
        r.pfp_type,
        r.year,
        r.assigned_place_id,
        r.assigned_place_name,
        r.assigned_institution_name,
        r.assigned_rank,
        r.algorithm_run_id,
        r.status,
        r.priority_score,
        r.assigned_at
    FROM student_result_vote r
    LEFT JOIN user_profiles u ON u.user_id = r.user_id
    WHERE r.pfp_type = p_pfp_type
    AND r.year = p_year
    AND (p_algorithm_run_id IS NULL OR r.algorithm_run_id = p_algorithm_run_id)
    ORDER BY r.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Vue pour les statistiques de résultats
CREATE OR REPLACE VIEW result_statistics AS
SELECT 
    pfp_type,
    year,
    algorithm_run_id,
    COUNT(*) as total_assignments,
    COUNT(DISTINCT assigned_place_id) as unique_places,
    COUNT(CASE WHEN assigned_rank = 1 THEN 1 END) as first_choice_count,
    COUNT(CASE WHEN assigned_rank = 2 THEN 1 END) as second_choice_count,
    COUNT(CASE WHEN assigned_rank = 3 THEN 1 END) as third_choice_count,
    COUNT(CASE WHEN assigned_rank > 3 THEN 1 END) as other_choice_count,
    ROUND(AVG(assigned_rank), 2) as average_rank,
    ROUND(AVG(priority_score), 2) as average_priority_score,
    COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned_count,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
    MAX(assigned_at) as last_assignment_date
FROM student_result_vote
GROUP BY pfp_type, year, algorithm_run_id;

-- 10. Accorder les permissions sur la vue
GRANT SELECT ON result_statistics TO authenticated;

-- Commentaires pour la documentation
COMMENT ON TABLE student_result_vote IS 'Stocke les résultats de l''algorithme d''attribution des places de stages';
COMMENT ON COLUMN student_result_vote.assigned_rank IS 'Rang du choix attribué (1 = premier choix, 2 = deuxième, etc.)';
COMMENT ON COLUMN student_result_vote.algorithm_run_id IS 'ID unique de l''exécution de l''algorithme pour traçabilité';
COMMENT ON COLUMN student_result_vote.priority_score IS 'Score de priorité calculé par l''algorithme';
COMMENT ON FUNCTION upsert_student_result IS 'Enregistre ou met à jour un résultat d''attribution (admin uniquement)';
COMMENT ON FUNCTION get_student_result IS 'Récupère le résultat d''attribution d''un étudiant';
COMMENT ON FUNCTION get_algorithm_results IS 'Récupère tous les résultats d''une exécution d''algorithme';
