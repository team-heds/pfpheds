--
-- PostgreSQL database dump
--

-- Dumped from database version 15.6
-- Dumped by pg_dump version 15.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: aal_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: badge_rarity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.badge_rarity AS ENUM (
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
    'mythic'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.factor_type AS ENUM (
    'totp',
    'webauthn'
);


--
-- Name: track_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.track_role AS ENUM (
    'SUPER_ADMIN',
    'SECRETARIAT',
    'RF',
    'ADMIN',
    'RM',
    'TEACHER',
    'STUDENT'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'student',
    'house_coach',
    'game_master',
    'teacher',
    'admin'
);


--
-- Name: _create_profile_from_import(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._create_profile_from_import() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: _normalize_need(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._normalize_need(val jsonb) RETURNS jsonb
    LANGUAGE sql IMMUTABLE
    AS $$
  select case
    when val is null then null
    when jsonb_typeof(val) in ('array','string') then val
    else to_jsonb(val::text)
  end
$$;


--
-- Name: add_user_xp(uuid, text, integer, text, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_user_xp(p_user_id uuid, p_action text, p_amount integer DEFAULT NULL::integer, p_source_type text DEFAULT NULL::text, p_source_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_xp_amount INTEGER;
  v_new_total_xp INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_house_id UUID;
BEGIN
  -- Recuperer les donnees actuelles
  SELECT
    gd.current_level,
    gd.total_xp,
    gd.house_id
  INTO v_old_level, v_new_total_xp, v_house_id
  FROM gamification_data gd
  WHERE gd.user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User gamification data not found'
    );
  END IF;

  -- Determiner le montant XP
  IF p_amount IS NULL THEN
    v_xp_amount := 10;
  ELSE
    v_xp_amount := p_amount;
  END IF;

  -- Calculer nouveau total
  v_new_total_xp := v_new_total_xp + v_xp_amount;
  v_new_level := calculate_level_from_xp(v_new_total_xp);

  -- Mettre a jour gamification_data
  UPDATE gamification_data gd
  SET
    total_xp = v_new_total_xp,
    current_level = v_new_level,
    house_points = gd.house_points + v_xp_amount,
    updated_at = NOW()
  WHERE gd.user_id = p_user_id;

  -- Mettre a jour la maison
  UPDATE houses h
  SET
    total_xp = h.total_xp + v_xp_amount,
    updated_at = NOW()
  WHERE h.id = v_house_id;

  -- Retourner resultat
  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'action', p_action,
    'xp_gained', v_xp_amount,
    'total_xp', v_new_total_xp,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'level_up', v_new_level > v_old_level
  );
END;
$$;


--
-- Name: admin_create_user(text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_create_user(user_email text, user_password text, user_forname text DEFAULT ''::text, user_family_name text DEFAULT ''::text, user_role text DEFAULT 'student'::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()::text
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can create users';
  END IF;

  new_user_id := uuid_generate_v4();

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000-000000',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(), NOW(), NOW(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('forname', user_forname, 'family_name', user_family_name, 'role', user_role),
    FALSE, 'authenticated', 'authenticated'
  );

  INSERT INTO public.user_profiles (
    user_id, email, forname, family_name, role, is_active, created_at, updated_at
  )
  VALUES (
    new_user_id::text, user_email, user_forname, user_family_name, user_role, TRUE, NOW(), NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  result := json_build_object('user_id', new_user_id, 'email', user_email, 'role', user_role, 'success', true);
  RETURN result;
END;
$$;


--
-- Name: api_my_permissions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.api_my_permissions() RETURNS TABLE(perm text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  current_user_id uuid;
  user_role text;
  user_permissions jsonb;
BEGIN
  -- Get current authenticated user ID
  current_user_id := auth.uid();

  -- Return empty if no user is authenticated
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Fetch role + permissions for the current user
  -- LIMIT 1 prevents any accidental multi-row issues (shouldn't happen, but safe).
  SELECT
    up.role,
    up.permissions
  INTO
    user_role,
    user_permissions
  FROM public.user_profiles up
  WHERE up.user_id = current_user_id
  LIMIT 1;

  -- Return role as a permission if it exists and is non-empty
  IF user_role IS NOT NULL AND btrim(user_role) <> '' THEN
    RETURN QUERY SELECT user_role::text;
  END IF;

  -- Return permissions from permissions column only if it's a jsonb array
  IF user_permissions IS NOT NULL THEN
    IF jsonb_typeof(user_permissions) = 'array' THEN
      RETURN QUERY
        SELECT jsonb_array_elements_text(user_permissions)::text;
    END IF;
  END IF;

  RETURN;
END;
$$;


--
-- Name: api_my_track_permissions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.api_my_track_permissions() RETURNS TABLE(track_id character varying, track_label character varying, role character varying, is_global_admin boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT
    utr.track_id,
    t.label as track_label,
    utr.role,
    is_global_admin() as is_global_admin
  FROM user_track_roles utr
  JOIN tracks t ON t.id = utr.track_id
  WHERE utr.user_id = auth.uid()
  AND utr.is_active = true
  AND t.is_active = true;
$$;


--
-- Name: api_my_track_roles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.api_my_track_roles() RETURNS TABLE(track_id text, track_label text, track_color text, role text, granted_at timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT
    utr.track_id,
    t.label AS track_label,
    t.color AS track_color,
    utr.role::TEXT,
    utr.granted_at
  FROM user_track_roles utr
  LEFT JOIN tracks t ON t.id = utr.track_id
  WHERE utr.user_id = auth.uid()
  AND utr.is_active = true
  AND (utr.expires_at IS NULL OR utr.expires_at > NOW())
  ORDER BY t.display_order, utr.role;
$$;


--
-- Name: app_can_manage_cases(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_can_manage_cases() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  select (select public.app_is_privileged()) or exists (
    select 1 from public.user_profiles up
    where up.user_id = (select auth.uid())
      and coalesce(up.permissions, '{}'::jsonb) ? 'page1.access'
  );
$$;


--
-- Name: app_is_privileged(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.app_is_privileged() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  select
    exists (
      select 1
      from public.user_profiles up
      where up.user_id = (select auth.uid())
        and (
          lower(coalesce(up.role, '')) in ('admin', 'super.all', 'adminphysio', 'adminsoins')
          or coalesce(up.permissions, '{}'::jsonb) ?| array['admin', 'super.all', 'editor']
        )
    )
    or exists (
      select 1
      from public.user_track_roles utr
      where utr.user_id = (select auth.uid())
        and utr.is_active = true
        and utr.role::text in ('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'RF', 'RM')
        and (utr.expires_at is null or utr.expires_at > now())
    );
$$;


--
-- Name: assign_game_master(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_game_master(user_email text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE profiles
  SET role = 'game_master'
  WHERE email = user_email;

  RAISE NOTICE 'Utilisateur % assigné comme Maître du Jeu', user_email;
END;
$$;


--
-- Name: assign_house_coach(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_house_coach(user_email text, house_name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE profiles
  SET role = 'house_coach',
      house = house_name
  WHERE email = user_email;

  RAISE NOTICE 'Utilisateur % assigné comme coach de %', user_email, house_name;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: gamification_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gamification_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    total_xp integer DEFAULT 0,
    current_level integer DEFAULT 1,
    house_id uuid,
    house_points integer DEFAULT 0,
    gamification_metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: assign_my_house(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_my_house(p_house_id uuid) RETURNS public.gamification_data
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
declare current_user_id uuid := (select auth.uid()); result public.gamification_data;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.houses where id = p_house_id) then raise exception 'House not found'; end if;
  insert into public.gamification_data (user_id, email, house_id, total_xp, current_level, house_points, gamification_metadata)
    values (current_user_id, coalesce((select auth.jwt() ->> 'email'), ''), p_house_id, 50, 1, 50,
      jsonb_build_object('quiz_completed', true, 'quiz_date', now()))
    on conflict (user_id) do update set
      house_id = case when public.gamification_data.house_id is null then excluded.house_id else public.gamification_data.house_id end,
      total_xp = coalesce(public.gamification_data.total_xp, 0) + case when public.gamification_data.house_id is null then 50 else 0 end,
      house_points = coalesce(public.gamification_data.house_points, 0) + case when public.gamification_data.house_id is null then 50 else 0 end,
      gamification_metadata = coalesce(public.gamification_data.gamification_metadata, '{}'::jsonb) || excluded.gamification_metadata,
      updated_at = now()
    returning * into result;
  return result;
end;
$$;


--
-- Name: assign_quest_to_all_users(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_quest_to_all_users(p_quest_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'auth'
    AS $$
declare affected integer := 0;
begin
  if not (select public.app_is_privileged()) then raise exception 'Insufficient privileges'; end if;
  if not exists (select 1 from public.quests where id = p_quest_id) then raise exception 'Quest not found'; end if;
  insert into public.user_quest_progress (user_id, quest_id, status, progress)
    select id, p_quest_id, 'not_started', 0 from auth.users
    on conflict (user_id, quest_id) do nothing;
  get diagnostics affected = row_count;
  update public.quests set participants_count = participants_count + affected where id = p_quest_id;
  return affected;
end;
$$;


--
-- Name: auto_create_user_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_create_user_profile() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Vérifier si le profil existe déjà
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = NEW.user_id) THEN
    -- Créer le profil automatiquement
    INSERT INTO user_profiles (
      user_id,
      email,
      forname,
      family_name,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      NEW.user_id,
      NEW.email,
      extract_forname_from_email(NEW.email),
      extract_family_name_from_email(NEW.email),
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Profil user_profiles créé automatiquement pour %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: auto_generate_display_name(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_generate_display_name() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Si display_name est NULL ou vide, le générer automatiquement
  IF NEW.display_name IS NULL OR NEW.display_name = '' OR NEW.display_name = 'Utilisateur' THEN
    NEW.display_name := generate_display_name(NEW.forname, NEW.family_name);
  END IF;

  -- Si display_name est toujours vide, utiliser l'email
  IF NEW.display_name = '' AND NEW.email IS NOT NULL THEN
    NEW.display_name := split_part(NEW.email, '@', 1);
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: batch_upsert_student_results(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.batch_upsert_student_results(p_results jsonb) RETURNS TABLE(success_count integer, error_count integer, errors jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_success_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_errors JSONB := '[]'::JSONB;
    v_result JSONB;
    v_user_id UUID;
BEGIN
    -- PAS de vérification des permissions ici
    -- Le service_role du backend a déjà tous les droits

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
$$;


--
-- Name: calculate_house_level(bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_house_level(total_xp bigint) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Niveaux basés sur la configuration JavaScript
  IF total_xp >= 1353750 THEN RETURN 20;
  ELSIF total_xp >= 1068750 THEN RETURN 19;
  ELSIF total_xp >= 843125 THEN RETURN 18;
  ELSIF total_xp >= 662625 THEN RETURN 17;
  ELSIF total_xp >= 520125 THEN RETURN 16;
  ELSIF total_xp >= 406125 THEN RETURN 15;
  ELSIF total_xp >= 315875 THEN RETURN 14;
  ELSIF total_xp >= 244625 THEN RETURN 13;
  ELSIF total_xp >= 187625 THEN RETURN 12;
  ELSIF total_xp >= 142500 THEN RETURN 11;
  ELSIF total_xp >= 106875 THEN RETURN 10;
  ELSIF total_xp >= 78375 THEN RETURN 9;
  ELSIF total_xp >= 57000 THEN RETURN 8;
  ELSIF total_xp >= 40375 THEN RETURN 7;
  ELSIF total_xp >= 27313 THEN RETURN 6;
  ELSIF total_xp >= 17813 THEN RETURN 5;
  ELSIF total_xp >= 10688 THEN RETURN 4;
  ELSIF total_xp >= 5938 THEN RETURN 3;
  ELSIF total_xp >= 2375 THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$;


--
-- Name: calculate_level(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_level(total_xp integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    CASE
        WHEN total_xp < 100 THEN RETURN 1;   -- Novice
        WHEN total_xp < 300 THEN RETURN 2;   -- Apprenti
        WHEN total_xp < 600 THEN RETURN 3;   -- Compagnon
        WHEN total_xp < 1000 THEN RETURN 4;  -- Expert
        ELSE RETURN 5;                       -- Maître
    END CASE;
END;
$$;


--
-- Name: calculate_level_from_xp(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_level_from_xp(xp integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Formule : niveau = floor(sqrt(xp / 100)) + 1
    -- Niveau 1: 0-99 XP, Niveau 2: 100-399 XP, Niveau 3: 400-899 XP, etc.
    RETURN FLOOR(SQRT(xp / 100.0)) + 1;
END;
$$;


--
-- Name: can_access_track(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_track(p_track_id text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  SELECT
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM user_track_roles
      WHERE user_id = auth.uid()
      AND track_id = p_track_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    );
$$;


--
-- Name: check_and_unlock_badges(uuid, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_and_unlock_badges(p_user_id uuid, p_action text, p_total_xp integer, p_level integer) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_badge RECORD;
    v_unlocked_badges JSON[] := '{}';
    v_condition JSONB;
    v_meets_condition BOOLEAN;
    v_post_count INTEGER;
    v_comment_count INTEGER;
    v_login_streak INTEGER;
BEGIN
    -- Parcourir tous les badges actifs non encore débloqués
    FOR v_badge IN
        SELECT b.* FROM badges b
        WHERE b.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM user_badges ub
            WHERE ub.user_id = p_user_id AND ub.badge_id = b.id
        )
    LOOP
        v_meets_condition := false;
        v_condition := v_badge.conditions;

        -- Vérifier les conditions selon le type
        IF v_condition ? 'total_xp' THEN
            v_meets_condition := p_total_xp >= (v_condition->>'total_xp')::INTEGER;
        ELSIF v_condition ? 'level' THEN
            v_meets_condition := p_level >= (v_condition->>'level')::INTEGER;
        ELSIF v_condition ? 'action_count' THEN
            -- Compter les actions spécifiques
            SELECT COUNT(*) INTO v_post_count
            FROM xp_history
            WHERE user_id = p_user_id AND action = (v_condition->>'action_type');

            v_meets_condition := v_post_count >= (v_condition->>'count')::INTEGER;
        ELSIF v_condition ? 'login_streak' THEN
            SELECT login_streak INTO v_login_streak
            FROM user_profiles WHERE user_id = p_user_id;

            v_meets_condition := v_login_streak >= (v_condition->>'days')::INTEGER;
        END IF;

        -- Si les conditions sont remplies, débloquer le badge
        IF v_meets_condition THEN
            INSERT INTO user_badges (user_id, badge_id, earned_at)
            VALUES (p_user_id, v_badge.id, NOW())
            ON CONFLICT DO NOTHING;

            -- Ajouter XP bonus si applicable
            IF v_badge.xp_bonus > 0 THEN
                PERFORM add_user_xp(
                    p_user_id,
                    'BADGE_UNLOCK',
                    v_badge.xp_bonus,
                    'badge',
                    v_badge.id,
                    'Badge débloqué: ' || v_badge.name
                );
            END IF;

            -- Ajouter à la liste des badges débloqués
            v_unlocked_badges := v_unlocked_badges || json_build_object(
                'id', v_badge.id,
                'name', v_badge.name,
                'description', v_badge.description,
                'rarity', v_badge.rarity,
                'xp_bonus', v_badge.xp_bonus
            );
        END IF;
    END LOOP;

    RETURN array_to_json(v_unlocked_badges);
END;
$$;


--
-- Name: check_quest_expiration(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_quest_expiration() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.end_date IS NOT NULL AND NEW.end_date < NOW() AT TIME ZONE 'Europe/Zurich' THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: copy_previous_year_place_propositions(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.copy_previous_year_place_propositions(p_target_year text, p_pfp_type text DEFAULT NULL::text) RETURNS TABLE(updated_places integer, updated_fields integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_uid uuid;
  v_is_admin boolean := false;
  v_previous_year text;
BEGIN
  IF p_target_year IS NULL OR p_target_year !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'p_target_year must be a 4-digit year';
  END IF;

  IF p_pfp_type IS NOT NULL AND p_pfp_type NOT IN ('PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4') THEN
    RAISE EXCEPTION 'p_pfp_type must be NULL or one of PFP1A/PFP1B/PFP2/PFP3/PFP4';
  END IF;

  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.user_id = v_uid
      AND (
        up.role IN ('admin', 'super.all')
        OR (up.permissions IS NOT NULL AND up.permissions ? 'admin')
        OR (up.permissions IS NOT NULL AND up.permissions ? 'super.all')
      )
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  v_previous_year := (p_target_year::integer - 1)::text;

  RETURN QUERY
  WITH candidates AS (
    SELECT
      p."PlaceId",
      (
        (p_pfp_type IS NULL OR p_pfp_type = 'PFP1A')
        AND COALESCE(p.pfp1a_proposition, '{}'::jsonb) ? v_previous_year
        AND COALESCE(p.pfp1a_proposition ->> v_previous_year, '') IS DISTINCT FROM COALESCE(p.pfp1a_proposition ->> p_target_year, '')
      ) AS c_pfp1a,
      (
        (p_pfp_type IS NULL OR p_pfp_type = 'PFP1B')
        AND COALESCE(p.pfp1b_proposition, '{}'::jsonb) ? v_previous_year
        AND COALESCE(p.pfp1b_proposition ->> v_previous_year, '') IS DISTINCT FROM COALESCE(p.pfp1b_proposition ->> p_target_year, '')
      ) AS c_pfp1b,
      (
        (p_pfp_type IS NULL OR p_pfp_type = 'PFP2')
        AND COALESCE(p.pfp2_proposition, '{}'::jsonb) ? v_previous_year
        AND COALESCE(p.pfp2_proposition ->> v_previous_year, '') IS DISTINCT FROM COALESCE(p.pfp2_proposition ->> p_target_year, '')
      ) AS c_pfp2,
      (
        (p_pfp_type IS NULL OR p_pfp_type = 'PFP3')
        AND COALESCE(p.pfp3_proposition, '{}'::jsonb) ? v_previous_year
        AND COALESCE(p.pfp3_proposition ->> v_previous_year, '') IS DISTINCT FROM COALESCE(p.pfp3_proposition ->> p_target_year, '')
      ) AS c_pfp3,
      (
        (p_pfp_type IS NULL OR p_pfp_type = 'PFP4')
        AND COALESCE(p.pfp4_proposition, '{}'::jsonb) ? v_previous_year
        AND COALESCE(p.pfp4_proposition ->> v_previous_year, '') IS DISTINCT FROM COALESCE(p.pfp4_proposition ->> p_target_year, '')
      ) AS c_pfp4
    FROM public.places p
  ),
  to_update AS (
    SELECT *
    FROM candidates c
    WHERE c.c_pfp1a OR c.c_pfp1b OR c.c_pfp2 OR c.c_pfp3 OR c.c_pfp4
  ),
  updated AS (
    UPDATE public.places p
    SET
      pfp1a_proposition = CASE
        WHEN u.c_pfp1a THEN jsonb_set(COALESCE(p.pfp1a_proposition, '{}'::jsonb), ARRAY[p_target_year], COALESCE(p.pfp1a_proposition -> v_previous_year, 'null'::jsonb), true)
        ELSE p.pfp1a_proposition
      END,
      pfp1b_proposition = CASE
        WHEN u.c_pfp1b THEN jsonb_set(COALESCE(p.pfp1b_proposition, '{}'::jsonb), ARRAY[p_target_year], COALESCE(p.pfp1b_proposition -> v_previous_year, 'null'::jsonb), true)
        ELSE p.pfp1b_proposition
      END,
      pfp2_proposition = CASE
        WHEN u.c_pfp2 THEN jsonb_set(COALESCE(p.pfp2_proposition, '{}'::jsonb), ARRAY[p_target_year], COALESCE(p.pfp2_proposition -> v_previous_year, 'null'::jsonb), true)
        ELSE p.pfp2_proposition
      END,
      pfp3_proposition = CASE
        WHEN u.c_pfp3 THEN jsonb_set(COALESCE(p.pfp3_proposition, '{}'::jsonb), ARRAY[p_target_year], COALESCE(p.pfp3_proposition -> v_previous_year, 'null'::jsonb), true)
        ELSE p.pfp3_proposition
      END,
      pfp4_proposition = CASE
        WHEN u.c_pfp4 THEN jsonb_set(COALESCE(p.pfp4_proposition, '{}'::jsonb), ARRAY[p_target_year], COALESCE(p.pfp4_proposition -> v_previous_year, 'null'::jsonb), true)
        ELSE p.pfp4_proposition
      END
    FROM to_update u
    WHERE p."PlaceId" = u."PlaceId"
    RETURNING u.c_pfp1a, u.c_pfp1b, u.c_pfp2, u.c_pfp3, u.c_pfp4
  )
  SELECT
    COUNT(*)::integer AS updated_places,
    COALESCE(SUM((c_pfp1a::int + c_pfp1b::int + c_pfp2::int + c_pfp3::int + c_pfp4::int)), 0)::integer AS updated_fields
  FROM updated;
END;
$_$;


--
-- Name: count_votes(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.count_votes(p_pfp_type text, p_year text) RETURNS integer
    LANGUAGE sql STABLE
    AS $$
  SELECT COUNT(*)::integer
  FROM public.student_votes
  WHERE pfp_type = p_pfp_type
    AND year = p_year;
$$;


--
-- Name: create_capsule_with_modules(jsonb, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_capsule_with_modules(p_capsule_data jsonb, p_learning_objectives jsonb DEFAULT '[]'::jsonb, p_modules jsonb DEFAULT '[]'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_capsule_id UUID;
  v_objective JSONB;
  v_module JSONB;
  v_result JSONB;
BEGIN
  -- Créer la capsule principale
  INSERT INTO capsules (
    title, description, category, difficulty, duration,
    author_id, author_name, author_role,
    tags, is_public, allow_comments, track_progress, status
  ) VALUES (
    p_capsule_data->>'title',
    p_capsule_data->>'description',
    p_capsule_data->>'category',
    p_capsule_data->>'difficulty',
    (p_capsule_data->>'duration')::INTEGER,
    auth.uid(),
    p_capsule_data->>'author_name',
    p_capsule_data->>'author_role',
    ARRAY(SELECT jsonb_array_elements_text(p_capsule_data->'tags')),
    COALESCE((p_capsule_data->>'is_public')::BOOLEAN, true),
    COALESCE((p_capsule_data->>'allow_comments')::BOOLEAN, true),
    COALESCE((p_capsule_data->>'track_progress')::BOOLEAN, true),
    COALESCE(p_capsule_data->>'status', 'draft')
  )
  RETURNING id INTO v_capsule_id;

  -- Créer les objectifs pédagogiques
  FOR v_objective IN SELECT * FROM jsonb_array_elements(p_learning_objectives)
  LOOP
    INSERT INTO capsule_learning_objectives (
      capsule_id, description, bloom_level, assessment_criteria, order_index
    ) VALUES (
      v_capsule_id,
      v_objective->>'description',
      v_objective->>'bloom_level',
      v_objective->>'assessment_criteria',
      COALESCE((v_objective->>'order_index')::INTEGER, 0)
    );
  END LOOP;

  -- Créer les modules
  FOR v_module IN SELECT * FROM jsonb_array_elements(p_modules)
  LOOP
    INSERT INTO capsule_modules (
      capsule_id, order_index, title, module_type,
      is_mandatory, duration, content, completion_criteria, unlock_conditions
    ) VALUES (
      v_capsule_id,
      (v_module->>'order_index')::INTEGER,
      v_module->>'title',
      v_module->>'module_type',
      COALESCE((v_module->>'is_mandatory')::BOOLEAN, true),
      (v_module->>'duration')::INTEGER,
      v_module->'content',
      COALESCE(v_module->'completion_criteria', '{"type": "view"}'::jsonb),
      COALESCE(v_module->'unlock_conditions', '{}'::jsonb)
    );
  END LOOP;

  -- Retourner le résultat
  SELECT jsonb_build_object(
    'success', true,
    'capsule_id', v_capsule_id,
    'message', 'Capsule créée avec succès'
  ) INTO v_result;

  RETURN v_result;
END;
$$;


--
-- Name: delete_capsule(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_capsule(p_capsule_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  DELETE FROM capsules
  WHERE id = p_capsule_id
    AND (author_id = auth.uid() OR EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'AdminPhysio', 'AdminSoins')
    ));

  IF FOUND THEN
    v_result = jsonb_build_object('success', true, 'message', 'Capsule supprimée');
  ELSE
    v_result = jsonb_build_object('success', false, 'message', 'Capsule non trouvée ou permission refusée');
  END IF;

  RETURN v_result;
END;
$$;


--
-- Name: delete_student_vote(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_student_vote(p_user_id uuid, p_pfp_type text, p_year text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Vérifier que l'utilisateur est authentifié et correspond à p_user_id
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Non autorisé: vous devez être authentifié et supprimer votre propre vote';
  END IF;

  DELETE FROM public.student_votes
  WHERE user_id = p_user_id
    AND pfp_type = p_pfp_type
    AND year = p_year;

  RETURN FOUND;
END;
$$;


--
-- Name: delete_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_user(user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE public.user_profiles.user_id = auth.uid()::text
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can delete users';
  END IF;

  DELETE FROM public.user_profiles WHERE public.user_profiles.user_id = delete_user.user_id::text;
  DELETE FROM auth.users WHERE id = delete_user.user_id;
END;
$$;


--
-- Name: duplicate_capsule(uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.duplicate_capsule(p_capsule_id uuid, p_new_title character varying DEFAULT NULL::character varying) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_new_capsule_id UUID;
  v_result JSONB;
BEGIN
  -- Dupliquer la capsule
  INSERT INTO capsules (
    title, description, category, difficulty, duration,
    author_id, author_name, author_role,
    tags, is_public, allow_comments, track_progress, status
  )
  SELECT
    COALESCE(p_new_title, title || ' (Copie)'),
    description, category, difficulty, duration,
    auth.uid(), author_name, author_role,
    tags, is_public, allow_comments, track_progress, 'draft'
  FROM capsules
  WHERE id = p_capsule_id
  RETURNING id INTO v_new_capsule_id;

  -- Dupliquer les objectifs
  INSERT INTO capsule_learning_objectives (capsule_id, description, bloom_level, assessment_criteria, order_index)
  SELECT v_new_capsule_id, description, bloom_level, assessment_criteria, order_index
  FROM capsule_learning_objectives
  WHERE capsule_id = p_capsule_id;

  -- Dupliquer les modules
  INSERT INTO capsule_modules (
    capsule_id, order_index, title, module_type,
    is_mandatory, duration, content, completion_criteria, unlock_conditions
  )
  SELECT
    v_new_capsule_id, order_index, title, module_type,
    is_mandatory, duration, content, completion_criteria, unlock_conditions
  FROM capsule_modules
  WHERE capsule_id = p_capsule_id;

  -- Dupliquer l'évaluation
  INSERT INTO capsule_evaluations (
    capsule_id, evaluation_type, passing_score,
    retake_allowed, max_attempts, delay_between_attempts,
    immediate_feedback, detailed_feedback, show_correct_answers
  )
  SELECT
    v_new_capsule_id, evaluation_type, passing_score,
    retake_allowed, max_attempts, delay_between_attempts,
    immediate_feedback, detailed_feedback, show_correct_answers
  FROM capsule_evaluations
  WHERE capsule_id = p_capsule_id;

  v_result = jsonb_build_object('success', true, 'new_capsule_id', v_new_capsule_id);
  RETURN v_result;
END;
$$;


--
-- Name: extract_family_name_from_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.extract_family_name_from_email(email text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  username TEXT;
  parts TEXT[];
BEGIN
  -- Extraire la partie avant @
  username := split_part(email, '@', 1);

  -- Séparer par point
  parts := string_to_array(username, '.');

  -- Si on a au moins 2 parties, prendre la deuxième et capitaliser
  IF array_length(parts, 1) >= 2 THEN
    RETURN initcap(parts[2]);
  ELSE
    -- Sinon retourner vide
    RETURN '';
  END IF;
END;
$$;


--
-- Name: extract_forname_from_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.extract_forname_from_email(email text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  username TEXT;
  parts TEXT[];
BEGIN
  -- Extraire la partie avant @
  username := split_part(email, '@', 1);

  -- Séparer par point
  parts := string_to_array(username, '.');

  -- Si on a au moins 2 parties, prendre la première et capitaliser
  IF array_length(parts, 1) >= 2 THEN
    RETURN initcap(parts[1]);
  ELSE
    -- Sinon retourner le username capitalisé
    RETURN initcap(username);
  END IF;
END;
$$;


--
-- Name: fill_student_result_vote_assigned_fields(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fill_student_result_vote_assigned_fields() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_nom_place text;
  v_inst_name text;
  v_inst_id text;
begin
  -- Si pas de place assignée -> vider les champs dérivés
  if new.assigned_place_id is null or new.assigned_place_id = '' then
    new.assigned_place_name := null;
    new.assigned_institution_name := null;
    return new;
  end if;

  -- Récupérer NomPlace + InstitutionName (+ InstitutionId si besoin)
  select p."NomPlace", p."InstitutionName", p."InstitutionId"
    into v_nom_place, v_inst_name, v_inst_id
  from public.places p
  where p."PlaceId" = new.assigned_place_id
  limit 1;

  -- Remplir place name
  new.assigned_place_name := v_nom_place;

  -- Remplir institution name : priorité à places.InstitutionName
  if v_inst_name is not null and v_inst_name <> '' then
    new.assigned_institution_name := v_inst_name;
  else
    -- Fallback: institutions.Name si InstitutionId existe
    if v_inst_id is not null and v_inst_id <> '' then
      select i."Name"
        into v_inst_name
      from public.institutions i
      where i."InstitutionId" = v_inst_id
      limit 1;

      new.assigned_institution_name := v_inst_name;
    else
      new.assigned_institution_name := null;
    end if;
  end if;

  return new;
end;
$$;


--
-- Name: fill_student_result_vote_assigned_institution_name(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fill_student_result_vote_assigned_institution_name() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_name text;
begin
  if nullif(btrim(new.assigned_institution_name), '') is null
     and nullif(btrim(new.assigned_place_id), '') is not null
  then
    select i."Name"
      into v_name
    from public.institutions i
    where i."InstitutionId" = new.assigned_place_id
    limit 1;

    if v_name is not null then
      new.assigned_institution_name := v_name;
    end if;
  end if;

  return new;
end;
$$;


--
-- Name: find_user_email_by_name(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_user_email_by_name(p_name text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF p_name IS NULL OR p_name = '' THEN
    RETURN NULL;
  END IF;

  -- Chercher par nom complet (forname + family_name)
  SELECT email INTO v_email
  FROM user_profiles
  WHERE LOWER(CONCAT(forname, ' ', family_name)) = LOWER(p_name)
     OR LOWER(display_name) = LOWER(p_name)
  LIMIT 1;

  RETURN v_email;
END;
$$;


--
-- Name: generate_display_name(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_display_name(p_forname text, p_family_name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  RETURN TRIM(CONCAT(
    COALESCE(INITCAP(p_forname), ''),
    CASE
      WHEN p_forname IS NOT NULL AND p_family_name IS NOT NULL THEN ' '
      ELSE ''
    END,
    COALESCE(INITCAP(p_family_name), '')
  ));
END;
$$;


--
-- Name: get_active_routes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_active_routes() RETURNS TABLE(id uuid, path text, name text, component_path text, requires_auth boolean, need jsonb, props boolean, menu_order integer, menu_section text, menu_label text, menu_icon text)
    LANGUAGE sql SECURITY DEFINER
    AS $$
  select
    id, path, name, component_path, requires_auth, need, props,
    menu_order, menu_section, menu_label, menu_icon
  from public.dynamic_routes
  where is_active = true
  order by menu_order, path;
$$;


--
-- Name: get_algorithm_results(text, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_algorithm_results(p_pfp_type text, p_year text, p_algorithm_run_id uuid DEFAULT NULL::uuid) RETURNS TABLE(id uuid, user_id uuid, student_name text, student_classe text, pfp_type text, year text, assigned_place_id text, assigned_place_name text, assigned_institution_name text, assigned_rank integer, algorithm_run_id uuid, status text, priority_score numeric, assigned_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: get_all_gamification_users(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_all_gamification_users() RETURNS SETOF public.gamification_data
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
begin
  if not (select public.app_is_privileged()) then raise exception 'Insufficient privileges'; end if;
  return query select * from public.gamification_data;
end;
$$;


--
-- Name: get_all_student_votes(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_all_student_votes(p_user_id uuid) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  SELECT jsonb_agg(to_jsonb(sv.*) ORDER BY sv.updated_at DESC)
  FROM public.student_votes sv
  WHERE sv.user_id = p_user_id;
$$;


--
-- Name: get_capsule_analytics(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_capsule_analytics(p_capsule_id uuid) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_analytics JSON;
  v_total_xp INTEGER;
  v_level INTEGER;
  v_house_id UUID;
  v_house_name TEXT;
  v_member_count INTEGER;
  v_house_rank INTEGER;
  v_house_total_xp INTEGER;
BEGIN
  -- 1. Récupérer les données de base de la capsule
  SELECT
    gd.total_xp,
    gd.current_level,
    gd.house_id,
    h.name,
    h.total_xp
  INTO v_total_xp, v_level, v_house_id, v_house_name, v_house_total_xp
  FROM gamification_data gd
  LEFT JOIN houses h ON gd.house_id = h.id
  WHERE gd.id = p_capsule_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Capsule not found'
    );
  END IF;

  -- 2. Compter les membres de la maison
  SELECT COUNT(*)
  INTO v_member_count
  FROM gamification_data gd2
  WHERE gd2.house_id = v_house_id;

  -- 3. Calculer le rang de la maison
  SELECT COUNT(*) + 1
  INTO v_house_rank
  FROM houses h2
  WHERE h2.total_xp > v_house_total_xp;

  -- 4. Construire le JSON de réponse
  v_analytics := json_build_object(
    'success', true,
    'capsule_id', p_capsule_id,
    'user_stats', json_build_object(
      'total_xp', v_total_xp,
      'current_level', v_level
    ),
    'house_stats', json_build_object(
      'house_id', v_house_id,
      'house_name', v_house_name,
      'house_total_xp', v_house_total_xp,
      'member_count', v_member_count,
      'house_rank', v_house_rank
    ),
    'generated_at', NOW()
  );

  RETURN v_analytics;
END;
$$;


--
-- Name: get_capsule_complete(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_capsule_complete(p_capsule_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'capsule', row_to_json(c.*),
    'learning_objectives', (
      SELECT COALESCE(jsonb_agg(row_to_json(lo.*) ORDER BY lo.order_index), '[]'::jsonb)
      FROM capsule_learning_objectives lo
      WHERE lo.capsule_id = p_capsule_id
    ),
    'prerequisites', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', cp.id,
          'prerequisite_capsule_id', cp.prerequisite_capsule_id,
          'is_mandatory', cp.is_mandatory,
          'prerequisite_title', pc.title
        )
      ), '[]'::jsonb)
      FROM capsule_prerequisites cp
      JOIN capsules pc ON cp.prerequisite_capsule_id = pc.id
      WHERE cp.capsule_id = p_capsule_id
    ),
    'modules', (
      SELECT COALESCE(jsonb_agg(row_to_json(cm.*) ORDER BY cm.order_index), '[]'::jsonb)
      FROM capsule_modules cm
      WHERE cm.capsule_id = p_capsule_id
    ),
    'evaluation', (
      SELECT row_to_json(ce.*)
      FROM capsule_evaluations ce
      WHERE ce.capsule_id = p_capsule_id
    ),
    'stats', (
      SELECT jsonb_build_object(
        'views_count', c.views_count,
        'completions_count', c.completions_count,
        'average_score', c.average_score,
        'unique_students', COUNT(DISTINCT scp.student_id),
        'avg_rating', AVG(cf.rating)
      )
      FROM capsules c
      LEFT JOIN student_capsule_progress scp ON c.id = scp.capsule_id
      LEFT JOIN capsule_feedback cf ON c.id = cf.capsule_id
      WHERE c.id = p_capsule_id
      GROUP BY c.id, c.views_count, c.completions_count, c.average_score
    )
  ) INTO v_result
  FROM capsules c
  WHERE c.id = p_capsule_id;

  RETURN v_result;
END;
$$;


--
-- Name: get_daily_wheel_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_daily_wheel_status() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
declare current_user_id uuid := (select auth.uid()); last_spin record;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select * into last_spin from public.daily_wheel_spins
    where user_id = current_user_id and spin_date = current_date;
  return jsonb_build_object('can_spin', last_spin is null, 'last_result', case when last_spin is null then null else last_spin.prize_details end);
end;
$$;


--
-- Name: get_leaderboard(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_leaderboard(p_house_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 10) RETURNS TABLE(user_id uuid, email text, display_name text, total_xp integer, current_level integer, house_id uuid, house_name text, house_color text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id::UUID,
    up.email::TEXT,
    up.display_name::TEXT,
    gd.total_xp::INTEGER,
    gd.current_level::INTEGER,
    gd.house_id::UUID,
    h.name::TEXT as house_name,
    h.color::TEXT as house_color
  FROM user_profiles up
  INNER JOIN gamification_data gd ON up.user_id = gd.user_id
  INNER JOIN houses h ON gd.house_id = h.id
  WHERE
    (p_house_id IS NULL OR gd.house_id = p_house_id)
  ORDER BY gd.total_xp DESC, gd.current_level DESC
  LIMIT p_limit;
END;
$$;


--
-- Name: get_module_video_count(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_module_video_count(p_module_id integer) RETURNS integer
    LANGUAGE sql STABLE
    AS $$
  SELECT COUNT(*)::INTEGER
  FROM video_library
  WHERE module_id::TEXT = p_module_id::TEXT;
$$;


--
-- Name: get_module_video_count(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_module_video_count(p_module_id uuid) RETURNS integer
    LANGUAGE sql STABLE
    AS $$
  SELECT COUNT(*)::INTEGER
  FROM video_library
  WHERE module_id = p_module_id;
$$;


--
-- Name: get_modules_with_video_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_modules_with_video_count() RETURNS TABLE(id integer, title text, description text, video_count bigint)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    m.id,
    m.title,
    m.description,
    COUNT(v.id) as video_count
  FROM modules m
  LEFT JOIN video_library v ON v.module_id::TEXT = m.id::TEXT
  GROUP BY m.id, m.title, m.description
  ORDER BY m.title;
$$;


--
-- Name: get_student_progress(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_student_progress(p_capsule_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'progress', row_to_json(scp.*),
    'capsule', jsonb_build_object(
      'id', c.id,
      'title', c.title,
      'total_modules', (SELECT COUNT(*) FROM capsule_modules WHERE capsule_id = c.id)
    ),
    'completed_modules', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'module_id', cm.id,
          'title', cm.title,
          'score', smr.score,
          'completed_at', smr.created_at
        )
      ), '[]'::jsonb)
      FROM capsule_modules cm
      JOIN student_module_responses smr ON cm.id = smr.module_id
      WHERE cm.capsule_id = p_capsule_id
        AND smr.student_id = auth.uid()
        AND smr.progress_id = scp.id
    )
  ) INTO v_result
  FROM student_capsule_progress scp
  JOIN capsules c ON scp.capsule_id = c.id
  WHERE scp.capsule_id = p_capsule_id
    AND scp.student_id = auth.uid()
  ORDER BY scp.created_at DESC
  LIMIT 1;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;


--
-- Name: student_result_vote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_result_vote (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    pfp_type text NOT NULL,
    year text NOT NULL,
    assigned_place_id text,
    assigned_place_name text,
    assigned_institution_name text,
    assigned_rank integer,
    algorithm_run_id uuid,
    algorithm_version text DEFAULT '1.0'::text,
    status text DEFAULT 'assigned'::text,
    original_choices jsonb,
    notes text,
    priority_score numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_praticien_id bigint,
    repondant_hes text,
    signataire_hes text,
    lieu_signature text,
    is_validated boolean DEFAULT false,
    commentaire_arret text,
    pfp_validee boolean DEFAULT false,
    pfp_echec boolean DEFAULT false,
    pfp_arret boolean DEFAULT false,
    remarques text,
    CONSTRAINT student_result_vote_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'assigned'::text])))
);


--
-- Name: get_student_result(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_student_result(p_user_id uuid, p_pfp_type text, p_year text) RETURNS public.student_result_vote
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
declare result public.student_result_vote;
begin
  if coalesce((select auth.jwt() ->> 'role'), '') <> 'service_role'
     and ((select auth.uid()) is null or ((select auth.uid()) <> p_user_id and not (select public.app_is_privileged()))) then
    raise exception 'Insufficient privileges';
  end if;
  select * into result from public.student_result_vote vote
  where vote.user_id = p_user_id and vote.pfp_type = p_pfp_type and vote.year = p_year;
  return result;
end;
$$;


--
-- Name: get_student_vote(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_student_vote(p_user_id uuid, p_pfp_type text, p_year text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
declare result jsonb;
begin
  if (select auth.uid()) is null or ((select auth.uid()) <> p_user_id and not (select public.app_is_privileged())) then
    raise exception 'Insufficient privileges';
  end if;
  select to_jsonb(vote.*) into result from public.student_votes vote
  where vote.user_id = p_user_id and vote.pfp_type = p_pfp_type and vote.year = p_year;
  return result;
end;
$$;


--
-- Name: get_top_voted_places(text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_top_voted_places(p_pfp_type text, p_year text, p_rank integer DEFAULT 1, p_limit integer DEFAULT 10) RETURNS TABLE(place_id text, place_name text, institution_name text, vote_count bigint, rank integer)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    vpa.place_id,
    vpa.place_name,
    vpa.institution_name,
    vpa.vote_count,
    vpa.rank
  FROM vote_place_aggregation vpa
  WHERE vpa.pfp_type = p_pfp_type
    AND vpa.year = p_year
    AND vpa.rank = p_rank
  ORDER BY vpa.vote_count DESC
  LIMIT p_limit;
$$;


--
-- Name: get_user_permissions(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_permissions(uid text) RETURNS text[]
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  user_permissions JSONB;
  permissions_array TEXT[];
BEGIN
  -- D'abord essayer de récupérer depuis user_profiles
  SELECT permissions INTO user_permissions
  FROM public.user_profiles
  WHERE user_id = uid;

  -- Si trouvé et non null, convertir JSONB en TEXT[]
  IF user_permissions IS NOT NULL THEN
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(user_permissions)
    ) INTO permissions_array;
    RETURN permissions_array;
  END IF;

  -- Sinon, essayer depuis auth.users metadata
  BEGIN
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(
        (raw_app_meta_data->'permissions')::jsonb
      )
    ) INTO permissions_array
    FROM auth.users
    WHERE id::text = uid;

    RETURN COALESCE(permissions_array, '{}');
  EXCEPTION WHEN OTHERS THEN
    RETURN '{}';
  END;
END;
$$;


--
-- Name: get_user_tracks(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_tracks() RETURNS TABLE(track_id text, roles text[])
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  -- Si SuperAdmin, retourne toutes les filières actives
  SELECT t.id AS track_id, ARRAY['SUPER_ADMIN']::TEXT[] AS roles
  FROM tracks t
  WHERE t.is_active = true
  AND is_super_admin()

  UNION

  -- Sinon, retourne les filières où l'utilisateur a des rôles
  SELECT
    utr.track_id,
    ARRAY_AGG(DISTINCT utr.role::TEXT) AS roles
  FROM user_track_roles utr
  WHERE utr.user_id = auth.uid()
  AND utr.is_active = true
  AND utr.track_id IS NOT NULL
  AND (utr.expires_at IS NULL OR utr.expires_at > NOW())
  GROUP BY utr.track_id;
$$;


--
-- Name: get_video_library_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_video_library_stats() RETURNS json
    LANGUAGE sql STABLE
    AS $$
  SELECT json_build_object(
    'total_videos', COUNT(*),
    'total_duration_minutes', COALESCE(SUM(duration), 0),
    'videos_by_type', (
      SELECT json_object_agg(type, count)
      FROM (
        SELECT type, COUNT(*) as count
        FROM video_library
        GROUP BY type
      ) type_counts
    ),
    'unique_modules', COUNT(DISTINCT module_id),
    'unique_years', COUNT(DISTINCT year_id)
  )
  FROM video_library;
$$;


--
-- Name: get_year_video_count(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_year_video_count(p_year_id uuid) RETURNS integer
    LANGUAGE sql STABLE
    AS $$
  SELECT COUNT(*)::INTEGER
  FROM video_library
  WHERE year_id = p_year_id;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, role, preferences)
  VALUES (
    NEW.id::text, -- Conversion explicite UUID -> TEXT pour éviter l'erreur
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: has_any_track_role(text, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_any_track_role(p_track_id text, p_roles text[]) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND track_id = p_track_id
    AND role::TEXT = ANY(p_roles)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;


--
-- Name: has_perm(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_perm(p text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  select exists(
    select 1 from public.current_user_permissions where perm = p
  );
$$;


--
-- Name: has_student_voted(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_student_voted(p_user_id uuid, p_pfp_type text, p_year text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_votes
    WHERE user_id = p_user_id
      AND pfp_type = p_pfp_type
      AND year = p_year
  );
$$;


--
-- Name: has_track_access(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_track_access(p_track_id character varying) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT is_global_admin() OR EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND track_id = p_track_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;


--
-- Name: has_track_access_level(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_track_access_level(p_track_id text, p_min_role text) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_role_order INTEGER;
  v_min_order INTEGER;
  v_user_roles TEXT[];
BEGIN
  -- Définir l'ordre des rôles (plus petit = plus de droits)
  v_min_order := CASE p_min_role
    WHEN 'SUPER_ADMIN' THEN 1
    WHEN 'SECRETARIAT' THEN 2
    WHEN 'RF' THEN 3
    WHEN 'ADMIN' THEN 4
    WHEN 'RM' THEN 5
    WHEN 'TEACHER' THEN 6
    WHEN 'STUDENT' THEN 7
    ELSE 99
  END;

  -- SuperAdmin a toujours accès
  IF is_super_admin() THEN
    RETURN TRUE;
  END IF;

  -- Vérifier les rôles de l'utilisateur pour cette filière
  SELECT ARRAY_AGG(role::TEXT) INTO v_user_roles
  FROM user_track_roles
  WHERE user_id = auth.uid()
  AND track_id = p_track_id
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW());

  IF v_user_roles IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Vérifier si au moins un rôle a le niveau requis
  RETURN EXISTS (
    SELECT 1 FROM unnest(v_user_roles) AS r
    WHERE CASE r
      WHEN 'SUPER_ADMIN' THEN 1
      WHEN 'SECRETARIAT' THEN 2
      WHEN 'RF' THEN 3
      WHEN 'ADMIN' THEN 4
      WHEN 'RM' THEN 5
      WHEN 'TEACHER' THEN 6
      WHEN 'STUDENT' THEN 7
      ELSE 99
    END <= v_min_order
  );
END;
$$;


--
-- Name: has_track_role(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_track_role(p_track_id text, p_role text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND track_id = p_track_id
    AND role::TEXT = p_role
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;


--
-- Name: has_track_role(character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_track_role(p_track_id character varying, p_role character varying) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND track_id = p_track_id
    AND role = p_role
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;


--
-- Name: initialize_user_gamification(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_user_gamification(p_user_id uuid, p_house_name text) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_house_id UUID;
    v_result JSON;
BEGIN
    -- Récupérer l'ID de la maison
    SELECT id INTO v_house_id FROM houses WHERE name = p_house_name;

    IF v_house_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Maison non trouvée');
    END IF;

    -- Mettre à jour le profil utilisateur
    UPDATE user_profiles
    SET
        house_id = v_house_id,
        total_xp = COALESCE(total_xp, 0),
        current_level = COALESCE(current_level, 1)
    WHERE user_id = p_user_id;

    -- Mettre à jour le compteur de membres de la maison
    UPDATE houses
    SET member_count = (
        SELECT COUNT(*) FROM user_profiles WHERE house_id = v_house_id
    )
    WHERE id = v_house_id;

    -- Ajouter XP pour avoir complété le quiz
    v_result := add_user_xp(p_user_id, 'QUIZ_COMPLETE', 50, 'quiz', NULL, 'Quiz de sélection de maison terminé');

    RETURN json_build_object(
        'success', true,
        'house_id', v_house_id,
        'house_name', p_house_name,
        'xp_result', v_result
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


--
-- Name: insert_spin_v2(uuid, text, jsonb, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insert_spin_v2(p_user_id uuid, p_result_type text, p_prize_details jsonb, p_xp_gain integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- 1. Insérer le spin
    INSERT INTO public.daily_wheel_spins (user_id, result_type, prize_details)
    VALUES (p_user_id, p_result_type, p_prize_details);

    -- 2. Mettre à jour l'XP
    IF p_xp_gain > 0 THEN
        INSERT INTO public.gamification_data (user_id, xp, level)
        VALUES (p_user_id, p_xp_gain, 1)
        ON CONFLICT (user_id)
        DO UPDATE SET xp = gamification_data.xp + p_xp_gain, updated_at = NOW();
    END IF;

    RETURN jsonb_build_object('status', 'success');
END;
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND r.slug IN ('admin','AdminSoins','AdminPhysio')
  );
$$;


--
-- Name: is_admin(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(email_param text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_email = email_param
    AND role = 'admin'
  );
END;
$$;


--
-- Name: is_alpinphysio_admin(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_alpinphysio_admin(user_uid text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM alpinphysio_members
    WHERE user_id = user_uid AND role = 'admin' AND is_active = true
  );
END;
$$;


--
-- Name: is_alpinphysio_member(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_alpinphysio_member(user_uid text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM alpinphysio_members
    WHERE user_id = user_uid AND is_active = true
  );
END;
$$;


--
-- Name: is_global_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_global_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND role = 'SUPER_ADMIN'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  )
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (
      role IN ('admin', 'super.all')
      OR (permissions IS NOT NULL AND permissions ? 'admin')
      OR (permissions IS NOT NULL AND permissions ? 'super.all')
    )
  );
$$;


--
-- Name: is_module_owner(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_module_owner(user_email text, module_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM modules
    WHERE id = module_id
    AND responsable_email = user_email
  ) OR is_admin(user_email);
END;
$$;


--
-- Name: is_rm_for_module(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_rm_for_module(p_module_id integer) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM modules m
    WHERE m.id = p_module_id
    AND m.responsable_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
$$;


--
-- Name: is_super_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_track_roles
    WHERE user_id = auth.uid()
    AND role = 'SUPER_ADMIN'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;


--
-- Name: is_superadmin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_superadmin() RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  select exists(
    select 1 from public.current_user_permissions where perm = 'super.all'
  );
$$;


--
-- Name: list_capsules(jsonb, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.list_capsules(p_filters jsonb DEFAULT '{}'::jsonb, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_query TEXT;
  v_result JSONB;
BEGIN
  WITH filtered_capsules AS (
    SELECT c.*,
      COUNT(*) OVER() as total_count,
      jsonb_build_object(
        'modules_count', (SELECT COUNT(*) FROM capsule_modules WHERE capsule_id = c.id),
        'students_count', (SELECT COUNT(DISTINCT student_id) FROM student_capsule_progress WHERE capsule_id = c.id)
      ) as metadata
    FROM capsules c
    WHERE
      (p_filters->>'status' IS NULL OR c.status = p_filters->>'status')
      AND (p_filters->>'category' IS NULL OR c.category = p_filters->>'category')
      AND (p_filters->>'difficulty' IS NULL OR c.difficulty = p_filters->>'difficulty')
      AND (p_filters->>'author_id' IS NULL OR c.author_id = (p_filters->>'author_id')::UUID)
      AND (p_filters->>'search' IS NULL OR c.title ILIKE '%' || (p_filters->>'search') || '%')
    ORDER BY c.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_build_object(
    'capsules', COALESCE(jsonb_agg(row_to_json(fc.*)), '[]'::jsonb),
    'total', COALESCE(MAX(total_count), 0),
    'limit', p_limit,
    'offset', p_offset
  ) INTO v_result
  FROM filtered_capsules fc;

  RETURN v_result;
END;
$$;


--
-- Name: log_planning_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_planning_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_action text;
  v_changes text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_changes := 'Création du créneau';
    INSERT INTO public.planning_history (slot_id, module_code, action, old_data, new_data, changes_summary)
    VALUES (NEW.id, NEW.module_code, v_action, NULL, to_jsonb(NEW), v_changes);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_changes := '';
    IF OLD.day != NEW.day THEN v_changes := v_changes || 'Jour: ' || OLD.day || ' → ' || NEW.day || '; '; END IF;
    IF OLD.start_time != NEW.start_time THEN v_changes := v_changes || 'Début: ' || OLD.start_time || ' → ' || NEW.start_time || '; '; END IF;
    IF OLD.end_time != NEW.end_time THEN v_changes := v_changes || 'Fin: ' || OLD.end_time || ' → ' || NEW.end_time || '; '; END IF;
    IF OLD.room IS DISTINCT FROM NEW.room THEN v_changes := v_changes || 'Salle: ' || COALESCE(OLD.room, '-') || ' → ' || COALESCE(NEW.room, '-') || '; '; END IF;
    IF OLD.teachers::text IS DISTINCT FROM NEW.teachers::text THEN v_changes := v_changes || 'Enseignants modifiés; '; END IF;
    IF v_changes = '' THEN v_changes := 'Modification mineure'; END IF;
    INSERT INTO public.planning_history (slot_id, module_code, action, old_data, new_data, changes_summary)
    VALUES (NEW.id, NEW.module_code, v_action, to_jsonb(OLD), to_jsonb(NEW), v_changes);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_changes := 'Suppression du créneau S' || OLD.week_number || ' ' || OLD.day;
    INSERT INTO public.planning_history (slot_id, module_code, action, old_data, new_data, changes_summary)
    VALUES (OLD.id, OLD.module_code, v_action, to_jsonb(OLD), NULL, v_changes);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: promote_user_to_admin(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.promote_user_to_admin(user_email text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE profiles
  SET role = 'admin'
  WHERE email = user_email;

  RAISE NOTICE 'Utilisateur % promu au rôle admin', user_email;
END;
$$;


--
-- Name: propagate_institution_name_to_places(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.propagate_institution_name_to_places() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      begin
        if new."Name" is distinct from old."Name" then
          update public.places p
          set "InstitutionName" = new."Name",
              "UpdatedAt" = now()
          where p."InstitutionId" = new."InstitutionId";
        end if;

        return new;
      end;
      $$;


--
-- Name: set_created_by_on_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_created_by_on_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Si created_by n'est pas fourni, utiliser l'utilisateur actuel
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: set_current_timestamp_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new."UpdatedAt" = now();
  return new;
end;
$$;


--
-- Name: set_timestamp_praticiens_formateurs(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_timestamp_praticiens_formateurs() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    user_id uuid NOT NULL,
    avatar_url text,
    updated_at timestamp with time zone DEFAULT now(),
    house_id uuid,
    last_login timestamp without time zone,
    login_streak integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    email text,
    forname text,
    family_name text,
    display_name character varying(200),
    bio text,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    role character varying(50) DEFAULT 'user'::character varying,
    phone character varying(20),
    city character varying(100),
    permissions jsonb DEFAULT '[]'::jsonb,
    preferences jsonb DEFAULT '{}'::jsonb,
    firebase_id text,
    classe text,
    metadata jsonb DEFAULT '{}'::jsonb,
    pfp_cohort text,
    primary_track_id character varying(10),
    CONSTRAINT check_pfp_cohort_values CHECK (((pfp_cohort IS NULL) OR (pfp_cohort = ANY (ARRAY['PFP1A'::text, 'PFP1B'::text]))))
);


--
-- Name: set_user_profile_rbac(text, text, boolean, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_user_profile_rbac(_email text, _role text, _is_active boolean, _permissions jsonb DEFAULT '[]'::jsonb) RETURNS SETOF public.user_profiles
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_user_id uuid;
begin
  select u.id into v_user_id
  from auth.users u
  where u.email = _email
  limit 1;

  if v_user_id is null then
    raise exception 'User not found for email: %', _email using errcode = 'P0001';
  end if;

  return query
  insert into public.user_profiles (user_id, email, role, is_active, permissions, updated_at)
  values (v_user_id, _email, _role, _is_active, coalesce(_permissions, '[]'::jsonb), now())
  on conflict (user_id) do update
  set role = excluded.role,
      is_active = excluded.is_active,
      permissions = excluded.permissions,
      email = excluded.email,
      updated_at = now()
  returning *;
end;
$$;


--
-- Name: spin_daily_wheel(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.spin_daily_wheel() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public'
    AS $$
declare
  current_user_id uuid := (select auth.uid()); random_value integer;
  result_type text; prize_details jsonb; xp_bonus integer := 0;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.daily_wheel_spins where user_id = current_user_id and spin_date = current_date) then
    raise exception 'ALREADY_SPUN_TODAY';
  end if;
  random_value := floor(random() * 100 + 1);
  if random_value <= 35 then result_type := 'QUIZ_EASY'; xp_bonus := 2; prize_details := '{"xp":10,"difficulty":"easy","label":"Quiz Facile"}'::jsonb;
  elsif random_value <= 60 then result_type := 'XP_BONUS'; xp_bonus := 5; prize_details := '{"xp":5,"label":"Bonus +5 XP"}'::jsonb;
  elsif random_value <= 75 then result_type := 'QUIZ_HARD'; xp_bonus := 5; prize_details := '{"xp":20,"difficulty":"hard","label":"Quiz Difficile"}'::jsonb;
  elsif random_value <= 90 then result_type := 'HELP_CHALLENGE'; prize_details := '{"xp":15,"mission":"help","label":"D?fi Entraide"}'::jsonb;
  else result_type := 'REROLL'; prize_details := '{"token":1,"label":"Jeton Rejouer"}'::jsonb;
  end if;
  insert into public.daily_wheel_spins (user_id, result_type, prize_details) values (current_user_id, result_type, prize_details);
  insert into public.gamification_data (user_id, email, total_xp, current_level)
    values (current_user_id, coalesce((select auth.jwt() ->> 'email'), ''), xp_bonus, 1)
    on conflict (user_id) do update set total_xp = public.gamification_data.total_xp + xp_bonus, updated_at = now();
  return jsonb_build_object('result_type', result_type, 'prize_details', prize_details, 'xp_added', xp_bonus, 'status', 'SUCCESS');
end;
$$;


--
-- Name: sync_module_responsable_email(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_module_responsable_email() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Si responsable_email est NULL et responsable est défini
  IF NEW.responsable_email IS NULL AND NEW.responsable IS NOT NULL AND NEW.responsable != '' THEN
    NEW.responsable_email := find_user_email_by_name(NEW.responsable);
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: sync_places_institution_name(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_places_institution_name() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      declare
        inst_name text;
      begin
        if new."InstitutionId" is null or new."InstitutionId" = '' then
          new."InstitutionName" := null;
          return new;
        end if;

        select i."Name"
          into inst_name
        from public.institutions i
        where i."InstitutionId" = new."InstitutionId"
        limit 1;

        new."InstitutionName" := inst_name;
        return new;
      end;
      $$;


--
-- Name: update_academic_tickets_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_academic_tickets_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_capsule(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_capsule(p_capsule_id uuid, p_updates jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE capsules SET
    title = COALESCE(p_updates->>'title', title),
    description = COALESCE(p_updates->>'description', description),
    category = COALESCE(p_updates->>'category', category),
    difficulty = COALESCE(p_updates->>'difficulty', difficulty),
    duration = COALESCE((p_updates->>'duration')::INTEGER, duration),
    tags = COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_updates->'tags')), tags),
    is_public = COALESCE((p_updates->>'is_public')::BOOLEAN, is_public),
    allow_comments = COALESCE((p_updates->>'allow_comments')::BOOLEAN, allow_comments),
    status = COALESCE(p_updates->>'status', status),
    updated_at = NOW()
  WHERE id = p_capsule_id
    AND (author_id = auth.uid() OR EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'AdminPhysio', 'AdminSoins')
    ));

  IF FOUND THEN
    v_result = jsonb_build_object('success', true, 'message', 'Capsule mise à jour');
  ELSE
    v_result = jsonb_build_object('success', false, 'message', 'Capsule non trouvée ou permission refusée');
  END IF;

  RETURN v_result;
END;
$$;


--
-- Name: update_challenge_progress(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_challenge_progress(p_user_id uuid, p_action text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_challenge RECORD;
BEGIN
    -- Parcourir les défis actifs correspondant à l'action
    FOR v_challenge IN
        SELECT c.* FROM challenges c
        WHERE c.is_active = true
        AND c.action_type = p_action
        AND (c.start_date IS NULL OR c.start_date <= CURRENT_DATE)
        AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)
    LOOP
        -- Insérer ou mettre à jour la progression
        INSERT INTO user_challenge_progress (user_id, challenge_id, current_value)
        VALUES (p_user_id, v_challenge.id, 1)
        ON CONFLICT (user_id, challenge_id)
        DO UPDATE SET
            current_value = user_challenge_progress.current_value + 1,
            completed = CASE
                WHEN user_challenge_progress.current_value + 1 >= v_challenge.target_value
                THEN true
                ELSE false
            END,
            completed_at = CASE
                WHEN user_challenge_progress.current_value + 1 >= v_challenge.target_value
                THEN NOW()
                ELSE NULL
            END;

        -- Si le défi est complété, ajouter les récompenses
        IF (SELECT current_value FROM user_challenge_progress
            WHERE user_id = p_user_id AND challenge_id = v_challenge.id) >= v_challenge.target_value THEN

            -- Ajouter XP de récompense
            IF v_challenge.xp_reward > 0 THEN
                PERFORM add_user_xp(
                    p_user_id,
                    'CHALLENGE_COMPLETE',
                    v_challenge.xp_reward,
                    'challenge',
                    v_challenge.id,
                    'Défi complété: ' || v_challenge.name
                );
            END IF;

            -- Débloquer badge de récompense si applicable
            IF v_challenge.badge_reward IS NOT NULL THEN
                INSERT INTO user_badges (user_id, badge_id, earned_at)
                VALUES (p_user_id, v_challenge.badge_reward, NOW())
                ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;
END;
$$;


--
-- Name: update_dynamic_routes_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_dynamic_routes_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: update_house_level(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_house_level() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.level = GREATEST(1, FLOOR(SQRT(NEW.total_xp / 10000.0)) + 1);
  RETURN NEW;
END;
$$;


--
-- Name: update_house_points_history_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_house_points_history_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_house_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_house_stats() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: update_level_from_xp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_level_from_xp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Calculer le nouveau niveau basé sur l'XP total
    NEW.current_level = calculate_level_from_xp(NEW.total_xp);

    -- Mettre à jour l'historique des niveaux si le niveau a changé
    IF OLD.current_level IS NULL OR NEW.current_level > OLD.current_level THEN
        NEW.level_history = COALESCE(NEW.level_history, '[]'::jsonb) ||
            jsonb_build_object(
                'level', NEW.current_level,
                'reached_at', NOW(),
                'total_xp', NEW.total_xp
            );
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: update_places_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_places_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW."UpdatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


--
-- Name: update_planning_cells_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_planning_cells_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_recap_cpt_evaluation_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_recap_cpt_evaluation_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_student_documents_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_student_documents_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_student_progress(uuid, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_student_progress(p_capsule_id uuid, p_module_id uuid DEFAULT NULL::uuid, p_progress_data jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_progress_id UUID;
  v_student_id UUID;
  v_result JSONB;
BEGIN
  v_student_id := auth.uid();

  -- Upsert progression
  INSERT INTO student_capsule_progress (
    capsule_id, student_id, status, current_module_id,
    progress_percentage, started_at, last_accessed_at
  ) VALUES (
    p_capsule_id,
    v_student_id,
    COALESCE(p_progress_data->>'status', 'in_progress'),
    p_module_id,
    COALESCE((p_progress_data->>'progress_percentage')::INTEGER, 0),
    NOW(),
    NOW()
  )
  ON CONFLICT (capsule_id, student_id, attempt_number)
  DO UPDATE SET
    status = COALESCE(EXCLUDED.status, student_capsule_progress.status),
    current_module_id = COALESCE(EXCLUDED.current_module_id, student_capsule_progress.current_module_id),
    progress_percentage = COALESCE(EXCLUDED.progress_percentage, student_capsule_progress.progress_percentage),
    last_accessed_at = NOW(),
    completed_at = CASE WHEN EXCLUDED.status = 'completed' THEN NOW() ELSE student_capsule_progress.completed_at END
  RETURNING id INTO v_progress_id;

  v_result = jsonb_build_object('success', true, 'progress_id', v_progress_id);
  RETURN v_result;
END;
$$;


--
-- Name: update_student_result_vote_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_student_result_vote_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_student_votes_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_student_votes_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


--
-- Name: update_suivi_cas_particuliers_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_suivi_cas_particuliers_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_tracks_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_tracks_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_permissions(text, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_permissions(target_user_id text, new_permissions text[]) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  calling_user_id TEXT;
  calling_user_role TEXT;
  permissions_jsonb JSONB;
BEGIN
  -- Récupérer l'ID de l'utilisateur qui fait l'appel
  calling_user_id := auth.uid()::text;

  -- Vérifier que l'utilisateur est connecté
  IF calling_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Non authentifié'
    );
  END IF;

  -- Récupérer le rôle de l'utilisateur qui fait l'appel
  SELECT role INTO calling_user_role
  FROM public.user_profiles
  WHERE user_id = calling_user_id;

  -- Vérifier que l'utilisateur a les permissions d'admin
  IF calling_user_role NOT IN ('admin', 'AdminSoins', 'AdminPhysio') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Permissions insuffisantes'
    );
  END IF;

  -- Convertir TEXT[] en JSONB
  permissions_jsonb := to_jsonb(new_permissions);

  -- Mettre à jour les permissions dans user_profiles (JSONB)
  UPDATE public.user_profiles
  SET
    permissions = permissions_jsonb,
    updated_at = NOW()
  WHERE user_id = target_user_id;

  -- Vérifier que la mise à jour a fonctionné
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;

  -- Mettre à jour les métadonnées dans auth.users (user_metadata pour que roleStore puisse les lire)
  BEGIN
    UPDATE auth.users
    SET
      raw_user_meta_data =
        COALESCE(raw_user_meta_data, '{}'::jsonb) ||
        jsonb_build_object('permissions', permissions_jsonb),
      raw_app_meta_data =
        COALESCE(raw_app_meta_data, '{}'::jsonb) ||
        jsonb_build_object('permissions', permissions_jsonb)
    WHERE id::text = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Impossible de mettre à jour auth.users metadata: %', SQLERRM;
  END;

  RETURN json_build_object(
    'success', true,
    'message', 'Permissions mises à jour avec succès',
    'user_id', target_user_id,
    'permissions', new_permissions
  );
END;
$$;


--
-- Name: update_user_permissions(uuid, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_permissions(p_user_id uuid, p_permissions text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Supprimer les anciennes permissions
    DELETE FROM user_permissions WHERE user_id = p_user_id;

    -- Insérer les nouvelles permissions
    INSERT INTO user_permissions (user_id, permission)
    SELECT p_user_id, unnest(p_permissions);
END;
$$;


--
-- Name: update_user_track_roles_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_track_roles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: upsert_dynamic_routes(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_dynamic_routes(payload jsonb) RETURNS TABLE(ret_path text, ret_name text, updated boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  rec jsonb;
  v_need jsonb;
  v_path text;
  v_name text;
  v_component_path text;
begin
  if payload is null or jsonb_typeof(payload) <> 'array' then
    raise exception 'Payload must be a JSON array';
  end if;

  for rec in select * from jsonb_array_elements(payload)
  loop
    v_need := public._normalize_need(rec->'need');
    v_path := rec->>'path';
    v_name := coalesce(rec->>'name', replace(v_path, '/', '_'));
    v_component_path := nullif(rec->>'component_path','');
    if v_component_path is null then
      -- Fallback to an existing component to satisfy NOT NULL constraint
      v_component_path := '@/components/common/utils/Error404.vue';
    end if;

    -- Ensure name is unique: if another row already uses this name for a different path, tweak it
    if exists (
      select 1
      from public.dynamic_routes d
      where d.name = v_name
        and d.path is distinct from v_path
    ) then
      -- sanitize path into a short suffix
      v_name := v_name || '__' || left(regexp_replace(v_path, '[^a-zA-Z0-9]+', '_', 'g'), 24);
    end if;

    insert into public.dynamic_routes
      (path, name, component_path, requires_auth, need, props, menu_order, menu_section, menu_label, menu_icon, is_active, description)
    values
      (
        v_path,
        v_name,
        v_component_path,
        coalesce((rec->>'requires_auth')::boolean, false),
        v_need,
        coalesce((rec->>'props')::boolean, false),
        coalesce((rec->>'menu_order')::int, 999),
        nullif(rec->>'menu_section',''),
        nullif(rec->>'menu_label',''),
        nullif(rec->>'menu_icon',''),
        coalesce((rec->>'is_active')::boolean, true),
        nullif(rec->>'description','')
      )
    on conflict (path) do update set
      name           = excluded.name,
      component_path = excluded.component_path,
      requires_auth  = excluded.requires_auth,
      need           = excluded.need,
      props          = excluded.props,
      menu_order     = excluded.menu_order,
      menu_section   = excluded.menu_section,
      menu_label     = excluded.menu_label,
      menu_icon      = excluded.menu_icon,
      is_active      = excluded.is_active,
      description    = excluded.description,
      updated_at     = now()
    returning path, name, (xmax <> 0) as updated
    into ret_path, ret_name, updated;

    return next;
  end loop;
end;
$$;


--
-- Name: upsert_module(uuid, jsonb, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_module(p_capsule_id uuid, p_module_data jsonb, p_module_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_module_id UUID;
  v_result JSONB;
BEGIN
  IF p_module_id IS NULL THEN
    -- Créer nouveau module
    INSERT INTO capsule_modules (
      capsule_id, order_index, title, module_type,
      is_mandatory, duration, content, completion_criteria, unlock_conditions
    ) VALUES (
      p_capsule_id,
      (p_module_data->>'order_index')::INTEGER,
      p_module_data->>'title',
      p_module_data->>'module_type',
      COALESCE((p_module_data->>'is_mandatory')::BOOLEAN, true),
      (p_module_data->>'duration')::INTEGER,
      p_module_data->'content',
      COALESCE(p_module_data->'completion_criteria', '{"type": "view"}'::jsonb),
      COALESCE(p_module_data->'unlock_conditions', '{}'::jsonb)
    )
    RETURNING id INTO v_module_id;

    v_result = jsonb_build_object('success', true, 'module_id', v_module_id, 'action', 'created');
  ELSE
    -- Mettre à jour module existant
    UPDATE capsule_modules SET
      order_index = COALESCE((p_module_data->>'order_index')::INTEGER, order_index),
      title = COALESCE(p_module_data->>'title', title),
      module_type = COALESCE(p_module_data->>'module_type', module_type),
      is_mandatory = COALESCE((p_module_data->>'is_mandatory')::BOOLEAN, is_mandatory),
      duration = COALESCE((p_module_data->>'duration')::INTEGER, duration),
      content = COALESCE(p_module_data->'content', content),
      completion_criteria = COALESCE(p_module_data->'completion_criteria', completion_criteria),
      unlock_conditions = COALESCE(p_module_data->'unlock_conditions', unlock_conditions),
      updated_at = NOW()
    WHERE id = p_module_id;

    v_result = jsonb_build_object('success', true, 'module_id', p_module_id, 'action', 'updated');
  END IF;

  RETURN v_result;
END;
$$;


--
-- Name: upsert_student_result(uuid, text, text, text, text, text, integer, uuid, jsonb, numeric, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_student_result(p_user_id uuid, p_pfp_type text, p_year text, p_assigned_place_id text, p_assigned_place_name text, p_assigned_institution_name text, p_assigned_rank integer, p_algorithm_run_id uuid, p_original_choices jsonb DEFAULT NULL::jsonb, p_priority_score numeric DEFAULT NULL::numeric, p_notes text DEFAULT NULL::text) RETURNS public.student_result_vote
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: upsert_student_vote(uuid, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_student_vote(p_user_id uuid, p_pfp_type text, p_year text, p_choices jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Vérifier que l'utilisateur est authentifié et correspond à p_user_id
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Non autorisé: vous devez être authentifié et voter pour vous-même';
  END IF;

  -- Vérifier que choices est un array
  IF jsonb_typeof(p_choices) != 'array' THEN
    RAISE EXCEPTION 'Le paramètre choices doit être un array JSON';
  END IF;

  -- Upsert le vote
  INSERT INTO public.student_votes (user_id, pfp_type, year, choices)
  VALUES (p_user_id, p_pfp_type, p_year, p_choices)
  ON CONFLICT (user_id, pfp_type, year)
  DO UPDATE SET
    choices = p_choices,
    updated_at = timezone('utc'::text, now())
  RETURNING to_jsonb(student_votes.*) INTO v_result;

  RETURN v_result;
END;
$$;


--
-- Name: user_has_permission(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_permission(user_uid text, required_permission text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  user_permissions JSONB;
BEGIN
  SELECT permissions INTO user_permissions
  FROM public.user_profiles
  WHERE user_id = user_uid;

  -- Vérifier si la permission existe dans le tableau JSONB
  IF user_permissions IS NOT NULL THEN
    RETURN user_permissions ? required_permission;
  END IF;

  RETURN FALSE;
END;
$$;


--
-- Name: whoami(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.whoami() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select jsonb_build_object(
    'db_user', current_user,
    'jwt_claims', coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb
  );
$$;


--
-- Name: xp_for_next_level(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.xp_for_next_level(current_level integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- XP requis pour atteindre le niveau suivant
    RETURN (current_level * current_level) * 100;
END;
$$;


--
-- Name: =; Type: OPERATOR; Schema: public; Owner: -
--

CREATE OPERATOR public.= (
    FUNCTION = auth.uuid_eq_text,
    LEFTARG = uuid,
    RIGHTARG = text
);


--
-- Name: RepondantPhysioHES; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RepondantPhysioHES" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: StudentsPhysio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StudentsPhysio" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    firebase_id text,
    aigu integer DEFAULT 0,
    ambu integer DEFAULT 0,
    msq integer DEFAULT 0,
    neuroger integer DEFAULT 0,
    rehab integer DEFAULT 0,
    sysint integer DEFAULT 0,
    sae integer DEFAULT 0,
    fr integer DEFAULT 0,
    de integer DEFAULT 0,
    it integer DEFAULT 0,
    eng integer DEFAULT 0,
    all_lang integer DEFAULT 0,
    class text,
    cas_particulier boolean DEFAULT false,
    lese boolean DEFAULT false,
    pfp1a text DEFAULT false,
    pf1b integer DEFAULT 0,
    pfp_valided jsonb DEFAULT '[]'::jsonb,
    pfp_2 jsonb DEFAULT '[]'::jsonb,
    pfpinfo jsonb DEFAULT '{}'::jsonb,
    repondant_hes text,
    repond_hes_id text,
    student_note text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    migrated_at timestamp with time zone,
    canton text,
    pfp2_place_id text,
    pfp2_data jsonb,
    year text NOT NULL,
    pfp1b text,
    pfp2 text,
    pfp3 text,
    pfp4 text,
    pfp1a_retake text,
    pfp1b_retake text,
    pfp2_retake text,
    pfp3_retake text,
    pfp4_retake text,
    pfp1a_absences numeric(4,1),
    pfp1b_absences numeric(4,1),
    pfp2_absences numeric(4,1),
    pfp3_absences numeric(4,1),
    pfp4_absences numeric(4,1),
    pfp1a_remarques text,
    pfp1b_remarques text,
    pfp2_remarques text,
    pfp3_remarques text,
    pfp4_remarques text,
    absences numeric(4,1) DEFAULT 0,
    remarques text,
    CONSTRAINT studentsphysio_year_format CHECK ((year ~ '^\d{4}$'::text))
);


--
-- Name: academic_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.academic_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'backlog'::character varying NOT NULL,
    priority character varying(20) DEFAULT 'normal'::character varying,
    order_index integer DEFAULT 0,
    module_id uuid,
    created_by uuid,
    assigned_to uuid,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    has_assets boolean DEFAULT false,
    notes text,
    vimeo_id character varying(100),
    vimeo_url text,
    published_at timestamp with time zone,
    CONSTRAINT academic_tickets_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT academic_tickets_status_check CHECK (((status)::text = ANY ((ARRAY['backlog'::character varying, 'todo'::character varying, 'in_progress'::character varying, 'validation'::character varying, 'problems'::character varying, 'done'::character varying])::text[]))),
    CONSTRAINT academic_tickets_type_check CHECK (((type)::text = ANY ((ARRAY['video'::character varying, 'development'::character varying, 'simulation'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: academic_tickets_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.academic_tickets_stats AS
 SELECT count(*) AS total_tickets,
    count(*) FILTER (WHERE ((academic_tickets.status)::text = 'backlog'::text)) AS backlog_count,
    count(*) FILTER (WHERE ((academic_tickets.status)::text = 'todo'::text)) AS todo_count,
    count(*) FILTER (WHERE ((academic_tickets.status)::text = 'in_progress'::text)) AS in_progress_count,
    count(*) FILTER (WHERE ((academic_tickets.status)::text = 'validation'::text)) AS validation_count,
    count(*) FILTER (WHERE ((academic_tickets.status)::text = 'problems'::text)) AS problems_count,
    count(*) FILTER (WHERE ((academic_tickets.status)::text = 'done'::text)) AS done_count,
    count(*) FILTER (WHERE ((academic_tickets.type)::text = 'video'::text)) AS video_count,
    count(*) FILTER (WHERE ((academic_tickets.type)::text = 'development'::text)) AS development_count,
    count(*) FILTER (WHERE ((academic_tickets.type)::text = 'simulation'::text)) AS simulation_count,
    count(*) FILTER (WHERE ((academic_tickets.type)::text = 'other'::text)) AS other_count,
    count(*) FILTER (WHERE ((academic_tickets.due_date < now()) AND ((academic_tickets.status)::text <> ALL ((ARRAY['done'::character varying, 'validation'::character varying])::text[])))) AS overdue_count
   FROM public.academic_tickets;


--
-- Name: academic_years; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.academic_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    autumn_start_week integer DEFAULT 38,
    autumn_end_week integer DEFAULT 7,
    spring_start_week integer DEFAULT 8,
    spring_end_week integer DEFAULT 37
);


--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    user_id uuid NOT NULL,
    note text
);


--
-- Name: ai_usage_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_usage_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    feature text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_usage_events_feature_check CHECK (((char_length(feature) >= 1) AND (char_length(feature) <= 80)))
);


--
-- Name: alpinphysio_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alpinphysio_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    role text DEFAULT 'member'::text,
    nom text,
    prenom text,
    email text,
    poste text,
    joined_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT alpinphysio_members_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text])))
);


--
-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    rarity public.badge_rarity DEFAULT 'common'::public.badge_rarity,
    xp_bonus integer DEFAULT 0,
    conditions jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: buckets; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.buckets AS
 SELECT buckets.id,
    buckets.name,
    buckets.owner,
    buckets.created_at,
    buckets.updated_at,
    buckets.public,
    buckets.avif_autodetection,
    buckets.file_size_limit,
    buckets.allowed_mime_types,
    buckets.owner_id
   FROM storage.buckets;


--
-- Name: calendar_cells; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_cells (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    day_of_week integer,
    week_number integer,
    semester_id uuid,
    type text DEFAULT 'libre'::text NOT NULL,
    module_id uuid,
    course_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT calendar_cells_day_of_week_check CHECK (((day_of_week >= 1) AND (day_of_week <= 7))),
    CONSTRAINT calendar_cells_type_check CHECK ((type = ANY (ARRAY['module'::text, 'vacances'::text, 'interruption'::text, 'examens'::text, 'formation_pratique'::text, 'asynchrone'::text, 'libre'::text])))
);


--
-- Name: capsule_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.capsule_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    capsule_id uuid NOT NULL,
    assigned_to_type character varying(50),
    group_identifier character varying(255),
    specific_student_ids uuid[],
    available_from timestamp with time zone,
    available_until timestamp with time zone,
    is_mandatory boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT capsule_assignments_assigned_to_type_check CHECK (((assigned_to_type)::text = ANY ((ARRAY['all_students'::character varying, 'specific_group'::character varying, 'specific_students'::character varying])::text[])))
);


--
-- Name: capsule_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.capsule_evaluations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    capsule_id uuid NOT NULL,
    evaluation_type character varying(50),
    passing_score integer DEFAULT 70,
    retake_allowed boolean DEFAULT true,
    max_attempts integer DEFAULT 3,
    delay_between_attempts integer,
    immediate_feedback boolean DEFAULT true,
    detailed_feedback boolean DEFAULT true,
    show_correct_answers boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT capsule_evaluations_evaluation_type_check CHECK (((evaluation_type)::text = ANY ((ARRAY['formative'::character varying, 'sommative'::character varying, 'diagnostic'::character varying])::text[])))
);


--
-- Name: capsule_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.capsule_feedback (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    capsule_id uuid NOT NULL,
    student_id uuid NOT NULL,
    rating integer,
    comment text,
    difficulty_perceived character varying(50),
    time_spent_vs_estimated character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT capsule_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: capsule_learning_objectives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.capsule_learning_objectives (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    capsule_id uuid NOT NULL,
    description text NOT NULL,
    bloom_level character varying(50),
    assessment_criteria text,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT capsule_learning_objectives_bloom_level_check CHECK (((bloom_level)::text = ANY ((ARRAY['remember'::character varying, 'understand'::character varying, 'apply'::character varying, 'analyze'::character varying, 'evaluate'::character varying, 'create'::character varying])::text[])))
);


--
-- Name: capsule_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.capsule_modules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    capsule_id uuid NOT NULL,
    order_index integer NOT NULL,
    title character varying(255) NOT NULL,
    module_type character varying(50) NOT NULL,
    is_mandatory boolean DEFAULT true,
    duration integer,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    completion_criteria jsonb DEFAULT '{"type": "view"}'::jsonb,
    unlock_conditions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT capsule_modules_module_type_check CHECK (((module_type)::text = ANY ((ARRAY['video'::character varying, 'quiz'::character varying, 'open_question'::character varying, 'text'::character varying, 'podcast'::character varying, 'flashcard'::character varying, 'seriousgame'::character varying])::text[])))
);


--
-- Name: capsule_prerequisites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.capsule_prerequisites (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    capsule_id uuid NOT NULL,
    prerequisite_capsule_id uuid NOT NULL,
    is_mandatory boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: capsules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.capsules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100),
    difficulty character varying(50),
    duration integer,
    author_id uuid,
    author_name character varying(255),
    author_role character varying(100),
    tags text[],
    is_public boolean DEFAULT true,
    allow_comments boolean DEFAULT true,
    track_progress boolean DEFAULT true,
    status character varying(50) DEFAULT 'draft'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone,
    views_count integer DEFAULT 0,
    completions_count integer DEFAULT 0,
    average_score numeric(5,2),
    average_time integer,
    student_feedback_avg numeric(3,2),
    CONSTRAINT capsules_difficulty_check CHECK (((difficulty)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying])::text[]))),
    CONSTRAINT capsules_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'review'::character varying, 'published'::character varying, 'archived'::character varying])::text[])))
);


--
-- Name: capsules_with_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.capsules_with_stats AS
SELECT
    NULL::uuid AS id,
    NULL::character varying(255) AS title,
    NULL::text AS description,
    NULL::character varying(100) AS category,
    NULL::character varying(50) AS difficulty,
    NULL::integer AS duration,
    NULL::uuid AS author_id,
    NULL::character varying(255) AS author_name,
    NULL::character varying(100) AS author_role,
    NULL::text[] AS tags,
    NULL::boolean AS is_public,
    NULL::boolean AS allow_comments,
    NULL::boolean AS track_progress,
    NULL::character varying(50) AS status,
    NULL::timestamp with time zone AS created_at,
    NULL::timestamp with time zone AS updated_at,
    NULL::timestamp with time zone AS published_at,
    NULL::integer AS views_count,
    NULL::integer AS completions_count,
    NULL::numeric(5,2) AS average_score,
    NULL::integer AS average_time,
    NULL::numeric(3,2) AS student_feedback_avg,
    NULL::bigint AS unique_students,
    NULL::bigint AS completed_students,
    NULL::numeric AS avg_rating,
    NULL::bigint AS module_count;


--
-- Name: cas_particuliers_historique; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cas_particuliers_historique (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    pfp_field text NOT NULL,
    type_evenement text DEFAULT 'note'::text NOT NULL,
    ancienne_date date,
    nouvelle_date date,
    description text,
    couleur text,
    created_by uuid,
    created_by_name text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cas_particuliers_historique_type_check CHECK ((type_evenement = ANY (ARRAY['changement_date'::text, 'changement_institution'::text, 'absence'::text, 'note'::text])))
);


--
-- Name: challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    target_value integer NOT NULL,
    action_type text NOT NULL,
    xp_reward integer DEFAULT 0,
    badge_reward uuid,
    week_number integer,
    year integer,
    start_date date,
    end_date date,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100),
    year_level integer NOT NULL,
    academic_year_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    modality character varying(20) DEFAULT 'temps_plein'::character varying,
    student_count integer DEFAULT 0,
    CONSTRAINT classes_modality_check CHECK (((modality)::text = ANY ((ARRAY['temps_plein'::character varying, 'temps_partiel'::character varying, 'en_emploi'::character varying])::text[])))
);


--
-- Name: cohorts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cohorts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100),
    year_level integer NOT NULL,
    academic_year_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: communities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.communities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: content_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_library (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    content_type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    content jsonb NOT NULL,
    author_id uuid,
    tags text[],
    is_public boolean DEFAULT false,
    usage_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT content_library_content_type_check CHECK (((content_type)::text = ANY ((ARRAY['video'::character varying, 'quiz'::character varying, 'question'::character varying, 'text'::character varying, 'podcast'::character varying, 'flashcard'::character varying, 'game'::character varying])::text[])))
);


--
-- Name: course_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_modules (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    module_number character varying(20),
    label text NOT NULL,
    color character varying(7) DEFAULT '#CCCCCC'::character varying,
    year_level integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: course_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.course_modules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: course_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.course_modules_id_seq OWNED BY public.course_modules.id;


--
-- Name: course_teachers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_teachers (
    course_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    hours numeric(6,2) DEFAULT 0 NOT NULL
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_id uuid,
    name text NOT NULL,
    description text,
    syllabus_url text,
    semester_id uuid,
    start_at timestamp with time zone,
    end_at timestamp with time zone,
    duration_hours numeric,
    schedule jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: daily_wheel_spins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_wheel_spins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    spin_date date DEFAULT CURRENT_DATE NOT NULL,
    result_type text NOT NULL,
    prize_details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: demo_ba00_seed_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demo_ba00_seed_users (
    user_id uuid NOT NULL,
    seeded_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dynamic_routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dynamic_routes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    path text NOT NULL,
    name text NOT NULL,
    component_path text NOT NULL,
    requires_auth boolean DEFAULT true,
    need jsonb,
    menu_order integer DEFAULT 999,
    menu_section text,
    menu_label text,
    menu_icon text,
    is_active boolean DEFAULT true,
    props boolean DEFAULT false,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: event_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_uid text NOT NULL,
    liked_at timestamp with time zone DEFAULT now()
);


--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_uid text NOT NULL,
    user_nom text,
    user_prenom text,
    user_photo_url text,
    registered_at timestamp with time zone DEFAULT now()
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    lieu text,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    type text DEFAULT 'public'::text NOT NULL,
    role text,
    admin_uid text NOT NULL,
    likes integer DEFAULT 0,
    image_url text,
    association_id text,
    CONSTRAINT events_type_check CHECK ((type = ANY (ARRAY['public'::text, 'private'::text, 'alpinphysio'::text])))
);


--
-- Name: events_with_counts; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.events_with_counts AS
 SELECT e.id,
    e.title,
    e.description,
    e.lieu,
    e.start_date,
    e.end_date,
    e.created_at,
    e.updated_at,
    e.type,
    e.role,
    e.admin_uid,
    e.likes,
    e.image_url,
    COALESCE(r.registration_count, (0)::bigint) AS registration_count,
    COALESCE(l.likes_count, (0)::bigint) AS likes_count
   FROM ((public.events e
     LEFT JOIN ( SELECT event_registrations.event_id,
            count(*) AS registration_count
           FROM public.event_registrations
          GROUP BY event_registrations.event_id) r ON ((e.id = r.event_id)))
     LEFT JOIN ( SELECT event_likes.event_id,
            count(*) AS likes_count
           FROM public.event_likes
          GROUP BY event_likes.event_id) l ON ((e.id = l.event_id)));


--
-- Name: extensions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extensions (
    id uuid NOT NULL,
    type text,
    settings jsonb,
    tenant_external_id text,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);


--
-- Name: feedbacka_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedbacka_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feedbacka_id uuid NOT NULL,
    student_id text NOT NULL,
    answer_text text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    ai_result jsonb,
    score numeric,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    evaluated_at timestamp with time zone,
    CONSTRAINT feedbacka_submissions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'done'::text, 'error'::text])))
);


--
-- Name: feedbackas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedbackas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    question text NOT NULL,
    context text,
    instructions text,
    correction_prompt text,
    expected_answer text,
    criteria jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'draft'::text NOT NULL,
    language text DEFAULT 'fr'::text,
    level text,
    expected_length text,
    scoring_enabled boolean DEFAULT false,
    max_score integer,
    tone text DEFAULT 'bienveillant'::text,
    course_id text,
    class_id text,
    author_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT feedbackas_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: file_physio_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_physio_files (
    id text NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    folder_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: file_physio_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_physio_folders (
    id text NOT NULL,
    name text NOT NULL,
    icon text,
    parent_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: firebase_supabase_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.firebase_supabase_mapping (
    id integer NOT NULL,
    firebase_user_id text NOT NULL,
    supabase_user_id uuid NOT NULL,
    email text,
    nom text,
    prenom text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: firebase_supabase_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.firebase_supabase_mapping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: firebase_supabase_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.firebase_supabase_mapping_id_seq OWNED BY public.firebase_supabase_mapping.id;


--
-- Name: function_backups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.function_backups (
    id bigint NOT NULL,
    function_name text NOT NULL,
    backup_at timestamp with time zone DEFAULT now() NOT NULL,
    function_definition text NOT NULL
);


--
-- Name: function_backups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.function_backups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: function_backups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.function_backups_id_seq OWNED BY public.function_backups.id;


--
-- Name: game_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_profiles (
    user_id uuid NOT NULL,
    house_id uuid,
    current_zone character varying(50) DEFAULT 'nexus_hub'::character varying,
    position_x double precision DEFAULT 0,
    position_y double precision DEFAULT 0,
    position_z double precision DEFAULT 0,
    energy integer DEFAULT 100,
    level integer DEFAULT 1,
    xp integer DEFAULT 0,
    last_daily_interaction timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: game_quest_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_quest_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    quest_id uuid,
    status character varying(20) DEFAULT 'active'::character varying,
    progress_data jsonb DEFAULT '{}'::jsonb,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT game_quest_progress_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: game_quests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_quests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(50),
    domain_tag character varying(50),
    min_level integer DEFAULT 1,
    rewards_json jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT game_quests_category_check CHECK (((category)::text = ANY ((ARRAY['exploration'::character varying, 'minigame'::character varying, 'social'::character varying, 'narrative'::character varying, 'daily'::character varying])::text[])))
);


--
-- Name: game_xp_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_xp_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    amount integer NOT NULL,
    source character varying(50) NOT NULL,
    source_id character varying(255),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: houses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.houses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    motto text,
    color text,
    description text,
    total_xp bigint DEFAULT 0,
    member_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    level integer DEFAULT 1
);


--
-- Name: house_leaderboard; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.house_leaderboard AS
 SELECT h.id,
    h.name,
    h.motto,
    h.color,
    h.member_count,
    h.total_xp,
    rank() OVER (ORDER BY h.total_xp DESC) AS rank,
    round(((h.total_xp)::numeric / (NULLIF(h.member_count, 0))::numeric), 2) AS avg_xp_per_member
   FROM public.houses h
  ORDER BY h.total_xp DESC;


--
-- Name: import_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_users (
    email text NOT NULL,
    forname text,
    family_name text
);


--
-- Name: institution_offer_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.institution_offer_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    institution_id text NOT NULL,
    year text NOT NULL,
    has_sent boolean DEFAULT false,
    notes text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: institutions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.institutions (
    "InstitutionId" text DEFAULT gen_random_uuid() NOT NULL,
    "AccordCadreDate" date,
    "AccordCadrePDF" text,
    "Address" text,
    "Canton" character varying(10),
    "Category" text,
    "ConventionDate" date,
    "ConventionPDF" text,
    "CyberleanURL" text,
    "Description" text,
    "IdResponsablePhysio" text,
    "ImageURL" jsonb,
    "Language" character varying(10),
    "Latitude" double precision,
    "Locality" text,
    "Longitude" double precision,
    "MailChef" text,
    "NPA" text,
    "Name" text,
    "NomChef" text,
    "Note" text,
    "PhoneChef" text,
    "CyberlearnURL" text,
    "URL" text,
    "UpdatedAt" timestamp with time zone DEFAULT now(),
    is_hidden boolean DEFAULT false NOT NULL
);


--
-- Name: module_hours_budget; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.module_hours_budget (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_code text NOT NULL,
    year text NOT NULL,
    planned_hours numeric(6,2) DEFAULT 0,
    lecture_hours numeric(6,2) DEFAULT 0,
    tp_hours numeric(6,2) DEFAULT 0,
    td_hours numeric(6,2) DEFAULT 0,
    exam_hours numeric(6,2) DEFAULT 0,
    other_hours numeric(6,2) DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    short_code character varying(20),
    number character varying(10),
    title text NOT NULL,
    responsable text,
    color character varying(7),
    description text,
    year integer,
    credits integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    responsable_email text,
    heures_contact integer,
    coordinateur text,
    track_id text
);


--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    slug text NOT NULL,
    description text
);


--
-- Name: places; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.places (
    "PlaceId" text NOT NULL,
    "NomPlace" text,
    "InstitutionId" text,
    "MSQ" boolean DEFAULT false,
    "SYSINT" boolean DEFAULT false,
    "AIGU" boolean DEFAULT false,
    "REHAB" boolean DEFAULT false,
    "AMBU" boolean DEFAULT false,
    "NEUROGER" boolean DEFAULT false,
    "FR" boolean DEFAULT false,
    "DE" boolean DEFAULT false,
    "IT" boolean DEFAULT false,
    "ENG" boolean DEFAULT false,
    "PFP1A" jsonb DEFAULT '{}'::jsonb,
    "PFP1B" jsonb DEFAULT '{}'::jsonb,
    "PFP2" jsonb DEFAULT '{}'::jsonb,
    "PFP3" jsonb DEFAULT '{}'::jsonb,
    "PFP4" jsonb DEFAULT '{}'::jsonb,
    "Remarques" jsonb DEFAULT '{}'::jsonb,
    "praticiensFormateurs" text[] DEFAULT ARRAY[]::text[],
    "InstitutionName" text,
    "AccordCadreDate" date,
    "Canton" text,
    "Categorie" text,
    "ConventionDate" date,
    "Lieu" text,
    "CreatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    id text,
    "InstitutionLegacyId" text,
    "LegacyId" text,
    "IDPlace" text,
    "Note" text,
    "selectedOut" boolean DEFAULT false NOT NULL,
    "OffrePFP1A" jsonb DEFAULT '{}'::jsonb,
    "OffrePFP1B" jsonb DEFAULT '{}'::jsonb,
    "OffrePFP2" jsonb DEFAULT '{}'::jsonb,
    "OffrePFP3" jsonb DEFAULT '{}'::jsonb,
    "OffrePFP4" jsonb DEFAULT '{}'::jsonb,
    fileurl text,
    filename text,
    pfp1a_proposition jsonb DEFAULT '{}'::jsonb,
    pfp1b_proposition jsonb DEFAULT '{}'::jsonb,
    pfp2_proposition jsonb DEFAULT '{}'::jsonb,
    pfp3_proposition jsonb DEFAULT '{}'::jsonb,
    pfp4_proposition jsonb DEFAULT '{}'::jsonb
);


--
-- Name: planning_cells; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planning_cells (
    id bigint NOT NULL,
    class_code character varying(20) NOT NULL,
    week_number integer NOT NULL,
    day character varying(10) NOT NULL,
    module_code character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT planning_cells_day_check CHECK (((day)::text = ANY ((ARRAY['lundi'::character varying, 'mardi'::character varying, 'mercredi'::character varying, 'jeudi'::character varying, 'vendredi'::character varying, 'samedi'::character varying, 'dimanche'::character varying, 'distance'::character varying])::text[])))
);


--
-- Name: planning_cells_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planning_cells_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: planning_cells_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planning_cells_id_seq OWNED BY public.planning_cells.id;


--
-- Name: planning_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planning_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slot_id integer NOT NULL,
    module_code text,
    action text NOT NULL,
    changed_by uuid,
    changed_by_name text,
    changed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changes_summary text,
    CONSTRAINT planning_history_action_check CHECK ((action = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text])))
);


--
-- Name: planning_slot_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planning_slot_votes (
    slot_id bigint NOT NULL,
    teacher_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: planning_time_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planning_time_slots (
    id bigint NOT NULL,
    class_code character varying(20) NOT NULL,
    week_number integer NOT NULL,
    day character varying(10) NOT NULL,
    day_index integer NOT NULL,
    date character varying(10),
    start_time character varying(5),
    end_time character varying(5),
    module_code character varying(50),
    course_title text,
    activity text,
    teachers text[] DEFAULT ARRAY[]::text[],
    room character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    class_codes_old text[],
    archived_at timestamp with time zone,
    class_codes_archive text[],
    class_codes text[],
    is_async boolean DEFAULT false NOT NULL,
    periods integer,
    activity_type character varying DEFAULT ((((chr(67) || chr(111)) || chr(117)) || chr(114)) || chr(115)),
    course_id uuid,
    CONSTRAINT check_class_codes_not_empty CHECK (((class_codes IS NULL) OR ((array_length(class_codes, 1) > 0) AND (class_codes <> '{}'::text[])))),
    CONSTRAINT check_planning_time_slots_periods_non_negative CHECK (((periods IS NULL) OR (periods >= 0))),
    CONSTRAINT planning_time_slots_day_check CHECK (((day)::text = ANY ((ARRAY['lundi'::character varying, 'mardi'::character varying, 'mercredi'::character varying, 'jeudi'::character varying, 'vendredi'::character varying, 'samedi'::character varying, 'dimanche'::character varying, 'distance'::character varying])::text[]))),
    CONSTRAINT planning_time_slots_day_index_check CHECK (((day_index >= 0) AND (day_index <= 6))),
    CONSTRAINT planning_time_slots_week_number_check CHECK (((week_number >= 0) AND (week_number <= 52)))
);


--
-- Name: planning_time_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planning_time_slots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: planning_time_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planning_time_slots_id_seq OWNED BY public.planning_time_slots.id;


--
-- Name: planning_validations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planning_validations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_code text NOT NULL,
    class_code text NOT NULL,
    year text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    validated_by uuid,
    validated_by_name text,
    validated_at timestamp with time zone,
    rejection_reason text,
    comments text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT planning_validations_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'validated'::text, 'rejected'::text])))
);


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    earned_at timestamp without time zone DEFAULT now(),
    notified boolean DEFAULT false
);


--
-- Name: popular_badges; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.popular_badges AS
 SELECT b.id,
    b.name,
    b.description,
    b.rarity,
    count(ub.user_id) AS earned_count,
    round((((count(ub.user_id))::numeric / (NULLIF(( SELECT count(*) AS count
           FROM public.user_profiles
          WHERE (user_profiles.house_id IS NOT NULL)), 0))::numeric) * (100)::numeric), 2) AS earn_percentage
   FROM (public.badges b
     LEFT JOIN public.user_badges ub ON ((b.id = ub.badge_id)))
  WHERE (b.is_active = true)
  GROUP BY b.id, b.name, b.description, b.rarity
  ORDER BY (count(ub.user_id)) DESC;


--
-- Name: post_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    url text NOT NULL,
    type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    author_name text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    hashtags jsonb DEFAULT '{}'::jsonb NOT NULL,
    mentions jsonb DEFAULT '{}'::jsonb NOT NULL,
    community_id uuid
);


--
-- Name: praticiens_formateurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.praticiens_formateurs (
    id bigint NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    mail text,
    institution text,
    localite text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: praticiens_formateurs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.praticiens_formateurs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: praticiens_formateurs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.praticiens_formateurs_id_seq OWNED BY public.praticiens_formateurs.id;


--
-- Name: praticiens_formateurs_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.praticiens_formateurs_new_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: praticiens_formateurs_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.praticiens_formateurs_new_id_seq OWNED BY public.praticiens_formateurs.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    name text,
    role text DEFAULT 'enseignant'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'rmodule'::text, 'enseignant'::text])))
);


--
-- Name: push_outbox; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_outbox (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title text NOT NULL,
    body text NOT NULL,
    url text DEFAULT '/'::text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_at timestamp with time zone,
    attempts integer DEFAULT 0 NOT NULL,
    last_error text,
    next_retry_at timestamp with time zone,
    sent_count integer DEFAULT 0 NOT NULL
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    platform text DEFAULT 'web'::text NOT NULL,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quest_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quest_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quest_id uuid NOT NULL,
    step_order integer NOT NULL,
    title text NOT NULL,
    description text,
    required boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: quests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    type text NOT NULL,
    difficulty text NOT NULL,
    points integer DEFAULT 50 NOT NULL,
    xp_reward integer DEFAULT 50 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    participants_count integer DEFAULT 0,
    completion_count integer DEFAULT 0,
    created_by uuid,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    icon text DEFAULT '🗺️'::text,
    duration integer,
    is_recurring boolean DEFAULT false,
    recurring_type text,
    min_level integer DEFAULT 1,
    max_level integer,
    target_houses text[],
    CONSTRAINT check_quest_dates CHECK (((end_date IS NULL) OR (start_date IS NULL) OR (end_date >= start_date)))
);


--
-- Name: recap_cpt_evaluation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recap_cpt_evaluation (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    annee character varying(10) NOT NULL,
    pfp1_cpt boolean,
    pfp1_cpt_comment text,
    pfp2_cpt boolean,
    pfp2_cpt_comment text,
    pfp3_cpt boolean,
    pfp3_cpt_comment text,
    pfp4_cpt boolean,
    pfp4_cpt_comment text,
    pfp1_eval boolean,
    pfp1_eval_comment text,
    pfp2_eval boolean,
    pfp2_eval_comment text,
    pfp3_eval boolean,
    pfp3_eval_comment text,
    pfp4_eval boolean,
    pfp4_eval_comment text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: recap_cpt_evaluation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recap_cpt_evaluation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recap_cpt_evaluation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recap_cpt_evaluation_id_seq OWNED BY public.recap_cpt_evaluation.id;


--
-- Name: responsable_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.responsable_stats AS
 SELECT modules.responsable_email,
    modules.responsable,
    count(*) AS total_modules,
    count(
        CASE
            WHEN (modules.year = 1) THEN 1
            ELSE NULL::integer
        END) AS modules_year_1,
    count(
        CASE
            WHEN (modules.year = 2) THEN 1
            ELSE NULL::integer
        END) AS modules_year_2,
    count(
        CASE
            WHEN (modules.year = 3) THEN 1
            ELSE NULL::integer
        END) AS modules_year_3,
    sum(modules.credits) AS total_credits,
    sum(modules.heures_contact) AS total_heures_contact
   FROM public.modules
  WHERE (modules.responsable_email IS NOT NULL)
  GROUP BY modules.responsable_email, modules.responsable;


--
-- Name: result_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.result_statistics AS
 SELECT student_result_vote.pfp_type,
    student_result_vote.year,
    student_result_vote.algorithm_run_id,
    count(*) AS total_assignments,
    count(DISTINCT student_result_vote.assigned_place_id) AS unique_places,
    count(
        CASE
            WHEN (student_result_vote.assigned_rank = 1) THEN 1
            ELSE NULL::integer
        END) AS first_choice_count,
    count(
        CASE
            WHEN (student_result_vote.assigned_rank = 2) THEN 1
            ELSE NULL::integer
        END) AS second_choice_count,
    count(
        CASE
            WHEN (student_result_vote.assigned_rank = 3) THEN 1
            ELSE NULL::integer
        END) AS third_choice_count,
    count(
        CASE
            WHEN (student_result_vote.assigned_rank > 3) THEN 1
            ELSE NULL::integer
        END) AS other_choice_count,
    round(avg(student_result_vote.assigned_rank), 2) AS average_rank,
    round(avg(student_result_vote.priority_score), 2) AS average_priority_score,
    count(
        CASE
            WHEN (student_result_vote.status = 'assigned'::text) THEN 1
            ELSE NULL::integer
        END) AS assigned_count,
    count(
        CASE
            WHEN (student_result_vote.status = 'confirmed'::text) THEN 1
            ELSE NULL::integer
        END) AS confirmed_count,
    max(student_result_vote.assigned_at) AS last_assignment_date
   FROM public.student_result_vote
  GROUP BY student_result_vote.pfp_type, student_result_vote.year, student_result_vote.algorithm_run_id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_slug text NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    label text NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(14) NOT NULL
);


--
-- Name: semesters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.semesters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    academic_year text NOT NULL,
    program_type text NOT NULL,
    start_week integer NOT NULL,
    end_week integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT semesters_program_type_check CHECK ((program_type = ANY (ARRAY['full_time'::text, 'part_time'::text])))
);


--
-- Name: structures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.structures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: student_capsule_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_capsule_notes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    capsule_id uuid NOT NULL,
    module_id uuid,
    student_id uuid NOT NULL,
    note_content text NOT NULL,
    timestamp_in_content integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: student_capsule_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_capsule_progress (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    capsule_id uuid NOT NULL,
    student_id uuid NOT NULL,
    status character varying(50) DEFAULT 'not_started'::character varying,
    current_module_id uuid,
    completed_modules uuid[],
    progress_percentage integer DEFAULT 0,
    overall_score numeric(5,2),
    module_scores jsonb DEFAULT '{}'::jsonb,
    time_spent integer DEFAULT 0,
    attempt_number integer DEFAULT 1,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    last_accessed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT student_capsule_progress_status_check CHECK (((status)::text = ANY ((ARRAY['not_started'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'abandoned'::character varying])::text[])))
);


--
-- Name: student_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    student_number text,
    program text,
    classe text,
    academic_year text,
    academic_status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: student_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_documents (
    id integer NOT NULL,
    user_id text NOT NULL,
    institution_id text NOT NULL,
    pfp_number integer NOT NULL,
    file_name text NOT NULL,
    document_url text NOT NULL,
    storage_path text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: student_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_documents_id_seq OWNED BY public.student_documents.id;


--
-- Name: student_module_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_module_responses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    progress_id uuid NOT NULL,
    module_id uuid NOT NULL,
    student_id uuid NOT NULL,
    response jsonb,
    score numeric(5,2),
    is_correct boolean,
    feedback text,
    time_spent integer,
    requires_review boolean DEFAULT false,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    reviewer_comments text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: student_progress_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.student_progress_details AS
 SELECT scp.id,
    scp.capsule_id,
    scp.student_id,
    scp.status,
    scp.current_module_id,
    scp.completed_modules,
    scp.progress_percentage,
    scp.overall_score,
    scp.module_scores,
    scp.time_spent,
    scp.attempt_number,
    scp.started_at,
    scp.completed_at,
    scp.last_accessed_at,
    scp.created_at,
    scp.updated_at,
    c.title AS capsule_title,
    c.category,
    u.email AS student_email,
    COALESCE(array_length(scp.completed_modules, 1), 0) AS completed_modules_count,
    ( SELECT count(*) AS count
           FROM public.capsule_modules
          WHERE (capsule_modules.capsule_id = scp.capsule_id)) AS total_modules
   FROM ((public.student_capsule_progress scp
     JOIN public.capsules c ON ((scp.capsule_id = c.id)))
     JOIN auth.users u ON ((scp.student_id = u.id)));


--
-- Name: student_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    pfp_type text NOT NULL,
    year text NOT NULL,
    choices jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT student_votes_pfp_type_check CHECK ((pfp_type = ANY (ARRAY['PFP1A'::text, 'PFP1B'::text, 'PFP2'::text, 'PFP3'::text, 'PFP4'::text]))),
    CONSTRAINT student_votes_year_check CHECK ((year ~ '^\d{4}$'::text))
);


--
-- Name: studentsphysio_with_profiles; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.studentsphysio_with_profiles AS
 SELECT s.id,
    s.user_id,
    s.firebase_id,
    s.aigu,
    s.ambu,
    s.msq,
    s.neuroger,
    s.rehab,
    s.sysint,
    s.sae,
    s.fr,
    s.de,
    s.it,
    s.eng,
    s.all_lang,
    s.class,
    s.cas_particulier,
    s.lese,
    s.pfp1a,
    s.pf1b,
    s.pfp_valided,
    s.pfp_2,
    s.pfpinfo,
    s.repondant_hes,
    s.repond_hes_id,
    s.student_note,
    s.created_at,
    s.updated_at,
    s.migrated_at,
    up.family_name AS nom,
    up.forname AS prenom,
    up.email AS mail,
    up.avatar_url AS photo_url,
    up.city AS ville,
    up.display_name,
    up.role,
    up.is_active
   FROM (public."StudentsPhysio" s
     LEFT JOIN public.user_profiles up ON ((up.user_id = s.user_id)));


--
-- Name: suivi_cas_particuliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suivi_cas_particuliers (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    pfp_field text NOT NULL,
    couleur text DEFAULT 'blanc'::text NOT NULL,
    commentaire text,
    visible boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT suivi_cas_particuliers_couleur_check CHECK ((couleur = ANY (ARRAY['blanc'::text, 'vert'::text, 'orange'::text, 'rouge'::text, 'noir'::text]))),
    CONSTRAINT suivi_cas_particuliers_pfp_field_check CHECK ((pfp_field = ANY (ARRAY['pfp1'::text, 'pfp1_prime'::text, 'pfp2'::text, 'pfp2_prime'::text, 'pfp3'::text, 'pfp3_prime'::text, 'pfp4'::text, 'pfp4_prime'::text, 'info_etudiant'::text, 'sae'::text])))
);


--
-- Name: suivi_cas_particuliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.suivi_cas_particuliers ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.suivi_cas_particuliers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: todos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.todos (
    id bigint NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    title text,
    description text
);


--
-- Name: todos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.todos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: todos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.todos_id_seq OWNED BY public.todos.id;


--
-- Name: tracks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tracks (
    id character varying(10) NOT NULL,
    label character varying(100) NOT NULL,
    label_short character varying(20),
    description text,
    color character varying(20) DEFAULT '#3b82f6'::character varying,
    icon character varying(50) DEFAULT 'pi-users'::character varying,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_challenge_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_challenge_progress (
    user_id uuid NOT NULL,
    challenge_id uuid NOT NULL,
    current_value integer DEFAULT 0,
    completed boolean DEFAULT false,
    completed_at timestamp without time zone
);


--
-- Name: user_communities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_communities (
    user_id uuid NOT NULL,
    community_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_daily_spins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_daily_spins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    spin_date date DEFAULT CURRENT_DATE NOT NULL,
    result_type text NOT NULL,
    prize_details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permissions (
    user_id uuid NOT NULL,
    permission_slug text NOT NULL
);


--
-- Name: user_quest_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_quest_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    quest_id uuid NOT NULL,
    status text DEFAULT 'not_started'::text NOT NULL,
    progress integer DEFAULT 0,
    current_step integer DEFAULT 0,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    user_email text NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_roles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'responsable_module'::text, 'enseignant'::text, 'etudiant'::text])))
);


--
-- Name: user_track_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_track_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    track_id character varying(10) NOT NULL,
    role character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    granted_by uuid,
    granted_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_track_roles_role_check CHECK (((role)::text = ANY ((ARRAY['SUPER_ADMIN'::character varying, 'SECRETARIAT'::character varying, 'RF'::character varying, 'ADMIN'::character varying, 'RM'::character varying, 'TEACHER'::character varying, 'STUDENT'::character varying, 'COORDINATOR'::character varying, 'PLANNER'::character varying])::text[])))
);


--
-- Name: v_role_permissions; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_role_permissions AS
 SELECT r.slug AS role,
    r.label AS role_label,
    p.slug AS permission
   FROM ((public.role_permissions rp
     JOIN public.roles r ON ((r.id = rp.role_id)))
     JOIN public.permissions p ON ((p.slug = rp.permission_slug)));


--
-- Name: video_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_library (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid,
    vimeo_url text NOT NULL,
    vimeo_id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    thumbnail_url text,
    duration integer,
    module_id integer,
    year_id integer,
    type character varying(50) DEFAULT 'cours'::character varying,
    person_filmed character varying(255),
    filming_date date,
    published_date timestamp with time zone DEFAULT now(),
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: votation_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.votation_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pfp_type text NOT NULL,
    year text NOT NULL,
    target_class text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    opened_at timestamp with time zone DEFAULT now(),
    closed_at timestamp with time zone,
    opened_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    is_priority boolean DEFAULT false,
    priority_user_ids jsonb,
    priority_reasons jsonb,
    pfp4_proposals jsonb,
    CONSTRAINT votation_sessions_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])))
);


--
-- Name: vote_place_aggregation; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vote_place_aggregation AS
 SELECT sv.pfp_type,
    sv.year,
    (choice.value ->> 'placeId'::text) AS place_id,
    (choice.value ->> 'placeName'::text) AS place_name,
    (choice.value ->> 'InstitutionName'::text) AS institution_name,
    ((choice.value ->> 'rank'::text))::integer AS rank,
    count(*) AS vote_count
   FROM public.student_votes sv,
    LATERAL jsonb_array_elements(sv.choices) choice(value)
  WHERE ((choice.value ->> 'placeId'::text) IS NOT NULL)
  GROUP BY sv.pfp_type, sv.year, (choice.value ->> 'placeId'::text), (choice.value ->> 'placeName'::text), (choice.value ->> 'InstitutionName'::text), ((choice.value ->> 'rank'::text))::integer
  ORDER BY sv.year DESC, sv.pfp_type, ((choice.value ->> 'rank'::text))::integer, (count(*)) DESC;


--
-- Name: vote_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vote_statistics AS
 SELECT student_votes.pfp_type,
    student_votes.year,
    count(DISTINCT student_votes.user_id) AS total_voters,
    count(*) AS total_votes,
    min(student_votes.created_at) AS first_vote_date,
    max(student_votes.updated_at) AS last_vote_date
   FROM public.student_votes
  GROUP BY student_votes.pfp_type, student_votes.year
  ORDER BY student_votes.year DESC, student_votes.pfp_type;


--
-- Name: xp_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.xp_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    amount integer NOT NULL,
    action text NOT NULL,
    description text,
    source_type text,
    source_id uuid,
    total_xp_after integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: course_modules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_modules ALTER COLUMN id SET DEFAULT nextval('public.course_modules_id_seq'::regclass);


--
-- Name: firebase_supabase_mapping id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firebase_supabase_mapping ALTER COLUMN id SET DEFAULT nextval('public.firebase_supabase_mapping_id_seq'::regclass);


--
-- Name: function_backups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.function_backups ALTER COLUMN id SET DEFAULT nextval('public.function_backups_id_seq'::regclass);


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: planning_cells id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_cells ALTER COLUMN id SET DEFAULT nextval('public.planning_cells_id_seq'::regclass);


--
-- Name: planning_time_slots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_time_slots ALTER COLUMN id SET DEFAULT nextval('public.planning_time_slots_id_seq'::regclass);


--
-- Name: praticiens_formateurs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.praticiens_formateurs ALTER COLUMN id SET DEFAULT nextval('public.praticiens_formateurs_id_seq'::regclass);


--
-- Name: recap_cpt_evaluation id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recap_cpt_evaluation ALTER COLUMN id SET DEFAULT nextval('public.recap_cpt_evaluation_id_seq'::regclass);


--
-- Name: student_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_documents ALTER COLUMN id SET DEFAULT nextval('public.student_documents_id_seq'::regclass);


--
-- Name: todos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.todos ALTER COLUMN id SET DEFAULT nextval('public.todos_id_seq'::regclass);


--
-- Name: StudentsPhysio StudentsPhysio_firebase_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentsPhysio"
    ADD CONSTRAINT "StudentsPhysio_firebase_id_key" UNIQUE (firebase_id);


--
-- Name: StudentsPhysio StudentsPhysio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentsPhysio"
    ADD CONSTRAINT "StudentsPhysio_pkey" PRIMARY KEY (id);


--
-- Name: academic_tickets academic_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_tickets
    ADD CONSTRAINT academic_tickets_pkey PRIMARY KEY (id);


--
-- Name: academic_years academic_years_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_name_key UNIQUE (name);


--
-- Name: academic_years academic_years_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (user_id);


--
-- Name: ai_usage_events ai_usage_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_events
    ADD CONSTRAINT ai_usage_events_pkey PRIMARY KEY (id);


--
-- Name: alpinphysio_members alpinphysio_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alpinphysio_members
    ADD CONSTRAINT alpinphysio_members_pkey PRIMARY KEY (id);


--
-- Name: alpinphysio_members alpinphysio_members_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alpinphysio_members
    ADD CONSTRAINT alpinphysio_members_user_id_key UNIQUE (user_id);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: calendar_cells calendar_cells_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_cells
    ADD CONSTRAINT calendar_cells_pkey PRIMARY KEY (id);


--
-- Name: capsule_assignments capsule_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_assignments
    ADD CONSTRAINT capsule_assignments_pkey PRIMARY KEY (id);


--
-- Name: capsule_evaluations capsule_evaluations_capsule_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_evaluations
    ADD CONSTRAINT capsule_evaluations_capsule_id_key UNIQUE (capsule_id);


--
-- Name: capsule_evaluations capsule_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_evaluations
    ADD CONSTRAINT capsule_evaluations_pkey PRIMARY KEY (id);


--
-- Name: capsule_feedback capsule_feedback_capsule_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_feedback
    ADD CONSTRAINT capsule_feedback_capsule_id_student_id_key UNIQUE (capsule_id, student_id);


--
-- Name: capsule_feedback capsule_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_feedback
    ADD CONSTRAINT capsule_feedback_pkey PRIMARY KEY (id);


--
-- Name: capsule_learning_objectives capsule_learning_objectives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_learning_objectives
    ADD CONSTRAINT capsule_learning_objectives_pkey PRIMARY KEY (id);


--
-- Name: capsule_modules capsule_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_modules
    ADD CONSTRAINT capsule_modules_pkey PRIMARY KEY (id);


--
-- Name: capsule_prerequisites capsule_prerequisites_capsule_id_prerequisite_capsule_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_prerequisites
    ADD CONSTRAINT capsule_prerequisites_capsule_id_prerequisite_capsule_id_key UNIQUE (capsule_id, prerequisite_capsule_id);


--
-- Name: capsule_prerequisites capsule_prerequisites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_prerequisites
    ADD CONSTRAINT capsule_prerequisites_pkey PRIMARY KEY (id);


--
-- Name: capsules capsules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsules
    ADD CONSTRAINT capsules_pkey PRIMARY KEY (id);


--
-- Name: cas_particuliers_historique cas_particuliers_historique_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cas_particuliers_historique
    ADD CONSTRAINT cas_particuliers_historique_pkey PRIMARY KEY (id);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);


--
-- Name: classes classes_code_academic_year_modality_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_code_academic_year_modality_unique UNIQUE (code, academic_year_id, modality);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: cohorts cohorts_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_code_key UNIQUE (code);


--
-- Name: cohorts cohorts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_pkey PRIMARY KEY (id);


--
-- Name: communities communities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_pkey PRIMARY KEY (id);


--
-- Name: content_library content_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_library
    ADD CONSTRAINT content_library_pkey PRIMARY KEY (id);


--
-- Name: course_modules course_modules_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_code_key UNIQUE (code);


--
-- Name: course_modules course_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_pkey PRIMARY KEY (id);


--
-- Name: course_teachers course_teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_teachers
    ADD CONSTRAINT course_teachers_pkey PRIMARY KEY (course_id, teacher_id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: daily_wheel_spins daily_wheel_spins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_wheel_spins
    ADD CONSTRAINT daily_wheel_spins_pkey PRIMARY KEY (id);


--
-- Name: demo_ba00_seed_users demo_ba00_seed_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demo_ba00_seed_users
    ADD CONSTRAINT demo_ba00_seed_users_pkey PRIMARY KEY (user_id);


--
-- Name: dynamic_routes dynamic_routes_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamic_routes
    ADD CONSTRAINT dynamic_routes_name_key UNIQUE (name);


--
-- Name: dynamic_routes dynamic_routes_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamic_routes
    ADD CONSTRAINT dynamic_routes_path_key UNIQUE (path);


--
-- Name: dynamic_routes dynamic_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamic_routes
    ADD CONSTRAINT dynamic_routes_pkey PRIMARY KEY (id);


--
-- Name: event_likes event_likes_event_id_user_uid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_likes
    ADD CONSTRAINT event_likes_event_id_user_uid_key UNIQUE (event_id, user_uid);


--
-- Name: event_likes event_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_likes
    ADD CONSTRAINT event_likes_pkey PRIMARY KEY (id);


--
-- Name: event_registrations event_registrations_event_id_user_uid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_user_uid_key UNIQUE (event_id, user_uid);


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: extensions extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extensions
    ADD CONSTRAINT extensions_pkey PRIMARY KEY (id);


--
-- Name: feedbacka_submissions feedbacka_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacka_submissions
    ADD CONSTRAINT feedbacka_submissions_pkey PRIMARY KEY (id);


--
-- Name: feedbackas feedbackas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbackas
    ADD CONSTRAINT feedbackas_pkey PRIMARY KEY (id);


--
-- Name: file_physio_files file_physio_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_physio_files
    ADD CONSTRAINT file_physio_files_pkey PRIMARY KEY (id);


--
-- Name: file_physio_folders file_physio_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_physio_folders
    ADD CONSTRAINT file_physio_folders_pkey PRIMARY KEY (id);


--
-- Name: firebase_supabase_mapping firebase_supabase_mapping_firebase_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firebase_supabase_mapping
    ADD CONSTRAINT firebase_supabase_mapping_firebase_user_id_key UNIQUE (firebase_user_id);


--
-- Name: firebase_supabase_mapping firebase_supabase_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firebase_supabase_mapping
    ADD CONSTRAINT firebase_supabase_mapping_pkey PRIMARY KEY (id);


--
-- Name: function_backups function_backups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.function_backups
    ADD CONSTRAINT function_backups_pkey PRIMARY KEY (id);


--
-- Name: game_profiles game_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_profiles
    ADD CONSTRAINT game_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: game_quest_progress game_quest_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_quest_progress
    ADD CONSTRAINT game_quest_progress_pkey PRIMARY KEY (id);


--
-- Name: game_quest_progress game_quest_progress_user_id_quest_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_quest_progress
    ADD CONSTRAINT game_quest_progress_user_id_quest_id_key UNIQUE (user_id, quest_id);


--
-- Name: game_quests game_quests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_quests
    ADD CONSTRAINT game_quests_pkey PRIMARY KEY (id);


--
-- Name: game_xp_logs game_xp_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_xp_logs
    ADD CONSTRAINT game_xp_logs_pkey PRIMARY KEY (id);


--
-- Name: gamification_data gamification_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gamification_data
    ADD CONSTRAINT gamification_data_pkey PRIMARY KEY (id);


--
-- Name: gamification_data gamification_data_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gamification_data
    ADD CONSTRAINT gamification_data_user_id_key UNIQUE (user_id);


--
-- Name: houses houses_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.houses
    ADD CONSTRAINT houses_name_key UNIQUE (name);


--
-- Name: houses houses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.houses
    ADD CONSTRAINT houses_pkey PRIMARY KEY (id);


--
-- Name: import_users import_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_users
    ADD CONSTRAINT import_users_pkey PRIMARY KEY (email);


--
-- Name: institution_offer_tracking institution_offer_tracking_institution_id_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institution_offer_tracking
    ADD CONSTRAINT institution_offer_tracking_institution_id_year_key UNIQUE (institution_id, year);


--
-- Name: institution_offer_tracking institution_offer_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institution_offer_tracking
    ADD CONSTRAINT institution_offer_tracking_pkey PRIMARY KEY (id);


--
-- Name: institutions institutions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT institutions_pkey PRIMARY KEY ("InstitutionId");


--
-- Name: module_hours_budget module_hours_budget_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_hours_budget
    ADD CONSTRAINT module_hours_budget_pkey PRIMARY KEY (id);


--
-- Name: module_hours_budget module_hours_budget_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_hours_budget
    ADD CONSTRAINT module_hours_budget_unique UNIQUE (module_code, year);


--
-- Name: modules modules_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_code_key UNIQUE (code);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (slug);


--
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY ("PlaceId");


--
-- Name: planning_cells planning_cells_class_code_week_number_day_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_cells
    ADD CONSTRAINT planning_cells_class_code_week_number_day_key UNIQUE (class_code, week_number, day);


--
-- Name: planning_cells planning_cells_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_cells
    ADD CONSTRAINT planning_cells_pkey PRIMARY KEY (id);


--
-- Name: planning_history planning_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_history
    ADD CONSTRAINT planning_history_pkey PRIMARY KEY (id);


--
-- Name: planning_time_slots planning_time_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_time_slots
    ADD CONSTRAINT planning_time_slots_pkey PRIMARY KEY (id);


--
-- Name: planning_validations planning_validations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_validations
    ADD CONSTRAINT planning_validations_pkey PRIMARY KEY (id);


--
-- Name: planning_validations planning_validations_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_validations
    ADD CONSTRAINT planning_validations_unique UNIQUE (module_code, class_code, year);


--
-- Name: post_media post_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT post_media_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: praticiens_formateurs praticiens_formateurs_new_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.praticiens_formateurs
    ADD CONSTRAINT praticiens_formateurs_new_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: push_outbox push_outbox_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_outbox
    ADD CONSTRAINT push_outbox_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: quest_steps quest_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_steps
    ADD CONSTRAINT quest_steps_pkey PRIMARY KEY (id);


--
-- Name: quests quests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_pkey PRIMARY KEY (id);


--
-- Name: recap_cpt_evaluation recap_cpt_evaluation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recap_cpt_evaluation
    ADD CONSTRAINT recap_cpt_evaluation_pkey PRIMARY KEY (id);


--
-- Name: recap_cpt_evaluation recap_cpt_evaluation_user_id_annee_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recap_cpt_evaluation
    ADD CONSTRAINT recap_cpt_evaluation_user_id_annee_key UNIQUE (user_id, annee);


--
-- Name: RepondantPhysioHES repondant_physio_hes_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RepondantPhysioHES"
    ADD CONSTRAINT repondant_physio_hes_email_key UNIQUE (email);


--
-- Name: RepondantPhysioHES repondant_physio_hes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RepondantPhysioHES"
    ADD CONSTRAINT repondant_physio_hes_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_slug);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_slug_key UNIQUE (slug);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: semesters semesters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semesters
    ADD CONSTRAINT semesters_pkey PRIMARY KEY (id);


--
-- Name: structures structures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.structures
    ADD CONSTRAINT structures_pkey PRIMARY KEY (id);


--
-- Name: student_capsule_notes student_capsule_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_capsule_notes
    ADD CONSTRAINT student_capsule_notes_pkey PRIMARY KEY (id);


--
-- Name: student_capsule_progress student_capsule_progress_capsule_id_student_id_attempt_numb_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_capsule_progress
    ADD CONSTRAINT student_capsule_progress_capsule_id_student_id_attempt_numb_key UNIQUE (capsule_id, student_id, attempt_number);


--
-- Name: student_capsule_progress student_capsule_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_capsule_progress
    ADD CONSTRAINT student_capsule_progress_pkey PRIMARY KEY (id);


--
-- Name: student_data student_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_data
    ADD CONSTRAINT student_data_pkey PRIMARY KEY (id);


--
-- Name: student_data student_data_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_data
    ADD CONSTRAINT student_data_user_id_key UNIQUE (user_id);


--
-- Name: student_documents student_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_documents
    ADD CONSTRAINT student_documents_pkey PRIMARY KEY (id);


--
-- Name: student_module_responses student_module_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_module_responses
    ADD CONSTRAINT student_module_responses_pkey PRIMARY KEY (id);


--
-- Name: student_result_vote student_result_vote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_result_vote
    ADD CONSTRAINT student_result_vote_pkey PRIMARY KEY (id);


--
-- Name: student_result_vote student_result_vote_user_pfp_year_place_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_result_vote
    ADD CONSTRAINT student_result_vote_user_pfp_year_place_key UNIQUE (user_id, pfp_type, year, assigned_place_id);


--
-- Name: student_result_vote student_result_vote_user_pfp_year_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_result_vote
    ADD CONSTRAINT student_result_vote_user_pfp_year_unique UNIQUE (user_id, pfp_type, year);


--
-- Name: student_votes student_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_votes
    ADD CONSTRAINT student_votes_pkey PRIMARY KEY (id);


--
-- Name: student_votes student_votes_user_pfp_year_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_votes
    ADD CONSTRAINT student_votes_user_pfp_year_unique UNIQUE (user_id, pfp_type, year);


--
-- Name: suivi_cas_particuliers suivi_cas_particuliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suivi_cas_particuliers
    ADD CONSTRAINT suivi_cas_particuliers_pkey PRIMARY KEY (id);


--
-- Name: suivi_cas_particuliers suivi_cas_particuliers_user_id_pfp_field_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suivi_cas_particuliers
    ADD CONSTRAINT suivi_cas_particuliers_user_id_pfp_field_key UNIQUE (user_id, pfp_field);


--
-- Name: todos todos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_pkey PRIMARY KEY (id);


--
-- Name: tracks tracks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracks
    ADD CONSTRAINT tracks_pkey PRIMARY KEY (id);


--
-- Name: video_library unique_vimeo_url; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_library
    ADD CONSTRAINT unique_vimeo_url UNIQUE (vimeo_url);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (user_id, badge_id);


--
-- Name: user_challenge_progress user_challenge_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenge_progress
    ADD CONSTRAINT user_challenge_progress_pkey PRIMARY KEY (user_id, challenge_id);


--
-- Name: user_communities user_communities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_communities
    ADD CONSTRAINT user_communities_pkey PRIMARY KEY (user_id, community_id);


--
-- Name: user_daily_spins user_daily_spins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_spins
    ADD CONSTRAINT user_daily_spins_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (user_id, permission_slug);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: user_quest_progress user_quest_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quest_progress
    ADD CONSTRAINT user_quest_progress_pkey PRIMARY KEY (id);


--
-- Name: user_quest_progress user_quest_progress_user_id_quest_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quest_progress
    ADD CONSTRAINT user_quest_progress_user_id_quest_id_key UNIQUE (user_id, quest_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_track_roles user_track_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_track_roles
    ADD CONSTRAINT user_track_roles_pkey PRIMARY KEY (id);


--
-- Name: user_track_roles user_track_roles_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_track_roles
    ADD CONSTRAINT user_track_roles_unique UNIQUE (user_id, track_id, role);


--
-- Name: video_library video_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_library
    ADD CONSTRAINT video_library_pkey PRIMARY KEY (id);


--
-- Name: votation_sessions votation_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votation_sessions
    ADD CONSTRAINT votation_sessions_pkey PRIMARY KEY (id);


--
-- Name: xp_history xp_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_history
    ADD CONSTRAINT xp_history_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_events_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_usage_events_user_created_idx ON public.ai_usage_events USING btree (user_id, created_at DESC);


--
-- Name: course_teachers_course_teacher_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX course_teachers_course_teacher_uniq ON public.course_teachers USING btree (course_id, teacher_id);


--
-- Name: extensions_tenant_external_id_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX extensions_tenant_external_id_type_index ON public.extensions USING btree (tenant_external_id, type);


--
-- Name: file_physio_files_folder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_physio_files_folder_idx ON public.file_physio_files USING btree (folder_id);


--
-- Name: file_physio_files_url_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX file_physio_files_url_key ON public.file_physio_files USING btree (url);


--
-- Name: file_physio_folders_parent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_physio_folders_parent_idx ON public.file_physio_folders USING btree (parent_id);


--
-- Name: idx_academic_tickets_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_academic_tickets_assigned_to ON public.academic_tickets USING btree (assigned_to);


--
-- Name: idx_academic_tickets_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_academic_tickets_created_at ON public.academic_tickets USING btree (created_at DESC);


--
-- Name: idx_academic_tickets_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_academic_tickets_created_by ON public.academic_tickets USING btree (created_by);


--
-- Name: idx_academic_tickets_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_academic_tickets_due_date ON public.academic_tickets USING btree (due_date);


--
-- Name: idx_academic_tickets_metadata; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_academic_tickets_metadata ON public.academic_tickets USING gin (metadata);


--
-- Name: idx_academic_tickets_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_academic_tickets_module ON public.academic_tickets USING btree (module_id);


--
-- Name: idx_academic_tickets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_academic_tickets_status ON public.academic_tickets USING btree (status);


--
-- Name: idx_academic_tickets_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_academic_tickets_type ON public.academic_tickets USING btree (type);


--
-- Name: idx_academic_years_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_academic_years_active ON public.academic_years USING btree (is_active);


--
-- Name: idx_alpinphysio_members_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alpinphysio_members_active ON public.alpinphysio_members USING btree (is_active);


--
-- Name: idx_alpinphysio_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alpinphysio_members_user_id ON public.alpinphysio_members USING btree (user_id);


--
-- Name: idx_assignments_capsule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_capsule ON public.capsule_assignments USING btree (capsule_id);


--
-- Name: idx_assignments_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_group ON public.capsule_assignments USING btree (group_identifier);


--
-- Name: idx_capsules_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_capsules_author ON public.capsules USING btree (author_id);


--
-- Name: idx_capsules_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_capsules_category ON public.capsules USING btree (category);


--
-- Name: idx_capsules_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_capsules_created_at ON public.capsules USING btree (created_at DESC);


--
-- Name: idx_capsules_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_capsules_status ON public.capsules USING btree (status);


--
-- Name: idx_capsules_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_capsules_tags ON public.capsules USING gin (tags);


--
-- Name: idx_cas_historique_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cas_historique_created_at ON public.cas_particuliers_historique USING btree (created_at DESC);


--
-- Name: idx_cas_historique_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cas_historique_user ON public.cas_particuliers_historique USING btree (user_id);


--
-- Name: idx_cas_historique_user_field; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cas_historique_user_field ON public.cas_particuliers_historique USING btree (user_id, pfp_field);


--
-- Name: idx_challenges_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_challenges_active ON public.challenges USING btree (is_active, start_date, end_date);


--
-- Name: idx_challenges_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_challenges_is_active ON public.challenges USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_classes_academic_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_academic_year ON public.classes USING btree (academic_year_id);


--
-- Name: idx_classes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_code ON public.classes USING btree (code);


--
-- Name: idx_cohorts_academic_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cohorts_academic_year ON public.cohorts USING btree (academic_year_id);


--
-- Name: idx_cohorts_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cohorts_code ON public.cohorts USING btree (code);


--
-- Name: idx_course_modules_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_modules_code ON public.course_modules USING btree (code);


--
-- Name: idx_daily_wheel_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_wheel_user_date ON public.daily_wheel_spins USING btree (user_id, spin_date);


--
-- Name: idx_dynamic_routes_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dynamic_routes_active ON public.dynamic_routes USING btree (is_active);


--
-- Name: idx_dynamic_routes_menu_section; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dynamic_routes_menu_section ON public.dynamic_routes USING btree (menu_section);


--
-- Name: idx_dynamic_routes_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dynamic_routes_path ON public.dynamic_routes USING btree (path);


--
-- Name: idx_evaluations_capsule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evaluations_capsule ON public.capsule_evaluations USING btree (capsule_id);


--
-- Name: idx_event_likes_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_likes_event ON public.event_likes USING btree (event_id);


--
-- Name: idx_event_likes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_likes_user ON public.event_likes USING btree (user_uid);


--
-- Name: idx_event_registrations_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registrations_event ON public.event_registrations USING btree (event_id);


--
-- Name: idx_event_registrations_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_registrations_user ON public.event_registrations USING btree (user_uid);


--
-- Name: idx_events_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_admin ON public.events USING btree (admin_uid);


--
-- Name: idx_events_start_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_start_date ON public.events USING btree (start_date);


--
-- Name: idx_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_type ON public.events USING btree (type);


--
-- Name: idx_feedback_capsule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_capsule ON public.capsule_feedback USING btree (capsule_id);


--
-- Name: idx_feedback_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_rating ON public.capsule_feedback USING btree (rating);


--
-- Name: idx_feedbacka_submissions_feedbacka; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedbacka_submissions_feedbacka ON public.feedbacka_submissions USING btree (feedbacka_id);


--
-- Name: idx_feedbacka_submissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedbacka_submissions_status ON public.feedbacka_submissions USING btree (status);


--
-- Name: idx_feedbacka_submissions_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedbacka_submissions_student ON public.feedbacka_submissions USING btree (student_id);


--
-- Name: idx_feedbackas_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedbackas_author ON public.feedbackas USING btree (author_id);


--
-- Name: idx_feedbackas_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedbackas_course ON public.feedbackas USING btree (course_id);


--
-- Name: idx_feedbackas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedbackas_status ON public.feedbackas USING btree (status);


--
-- Name: idx_firebase_mapping_firebase_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_firebase_mapping_firebase_id ON public.firebase_supabase_mapping USING btree (firebase_user_id);


--
-- Name: idx_firebase_mapping_supabase_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_firebase_mapping_supabase_id ON public.firebase_supabase_mapping USING btree (supabase_user_id);


--
-- Name: idx_gamification_house; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gamification_house ON public.gamification_data USING btree (house_id);


--
-- Name: idx_gamification_leaderboard; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gamification_leaderboard ON public.gamification_data USING btree (house_id, total_xp DESC, current_level DESC);


--
-- Name: idx_gamification_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gamification_user ON public.gamification_data USING btree (user_id);


--
-- Name: idx_houses_leaderboard; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_houses_leaderboard ON public.houses USING btree (total_xp DESC, level DESC);


--
-- Name: idx_houses_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_houses_name ON public.houses USING btree (name);


--
-- Name: idx_library_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_library_author ON public.content_library USING btree (author_id);


--
-- Name: idx_library_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_library_tags ON public.content_library USING gin (tags);


--
-- Name: idx_library_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_library_type ON public.content_library USING btree (content_type);


--
-- Name: idx_module_hours_budget_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_module_hours_budget_module ON public.module_hours_budget USING btree (module_code);


--
-- Name: idx_modules_capsule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_capsule ON public.capsule_modules USING btree (capsule_id);


--
-- Name: idx_modules_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_code ON public.modules USING btree (code);


--
-- Name: idx_modules_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_order ON public.capsule_modules USING btree (capsule_id, order_index);


--
-- Name: idx_modules_responsable_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_responsable_email ON public.modules USING btree (responsable_email);


--
-- Name: idx_modules_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_title ON public.modules USING btree (title);


--
-- Name: idx_modules_track; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_track ON public.modules USING btree (track_id);


--
-- Name: idx_modules_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_type ON public.capsule_modules USING btree (module_type);


--
-- Name: idx_modules_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_year ON public.modules USING btree (year);


--
-- Name: idx_notes_capsule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_capsule ON public.student_capsule_notes USING btree (capsule_id);


--
-- Name: idx_notes_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_student ON public.student_capsule_notes USING btree (student_id);


--
-- Name: idx_objectives_capsule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_objectives_capsule ON public.capsule_learning_objectives USING btree (capsule_id);


--
-- Name: idx_offer_tracking_institution; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offer_tracking_institution ON public.institution_offer_tracking USING btree (institution_id);


--
-- Name: idx_offer_tracking_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offer_tracking_year ON public.institution_offer_tracking USING btree (year);


--
-- Name: idx_places_canton; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_canton ON public.places USING btree ("Canton");


--
-- Name: idx_places_institution_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_institution_id ON public.places USING btree ("InstitutionId");


--
-- Name: idx_places_langues; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_langues ON public.places USING btree ("FR", "DE", "IT", "ENG");


--
-- Name: idx_places_nom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_nom ON public.places USING btree ("NomPlace");


--
-- Name: idx_places_offrepfp1a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_offrepfp1a ON public.places USING gin ("OffrePFP1A");


--
-- Name: idx_places_offrepfp1b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_offrepfp1b ON public.places USING gin ("OffrePFP1B");


--
-- Name: idx_places_offrepfp2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_offrepfp2 ON public.places USING gin ("OffrePFP2");


--
-- Name: idx_places_offrepfp3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_offrepfp3 ON public.places USING gin ("OffrePFP3");


--
-- Name: idx_places_offrepfp4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_offrepfp4 ON public.places USING gin ("OffrePFP4");


--
-- Name: idx_places_pfp1a_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_pfp1a_gin ON public.places USING gin ("PFP1A");


--
-- Name: idx_places_pfp2_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_pfp2_gin ON public.places USING gin ("PFP2");


--
-- Name: idx_places_specialites; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_specialites ON public.places USING btree ("MSQ", "SYSINT", "AIGU", "REHAB", "AMBU", "NEUROGER");


--
-- Name: idx_planning_cells_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_cells_class ON public.planning_cells USING btree (class_code);


--
-- Name: idx_planning_cells_class_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_cells_class_week ON public.planning_cells USING btree (class_code, week_number);


--
-- Name: idx_planning_cells_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_cells_module ON public.planning_cells USING btree (module_code);


--
-- Name: idx_planning_cells_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_cells_week ON public.planning_cells USING btree (week_number);


--
-- Name: idx_planning_history_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_history_date ON public.planning_history USING btree (changed_at DESC);


--
-- Name: idx_planning_history_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_history_module ON public.planning_history USING btree (module_code);


--
-- Name: idx_planning_history_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_history_slot ON public.planning_history USING btree (slot_id);


--
-- Name: idx_planning_history_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_history_user ON public.planning_history USING btree (changed_by);


--
-- Name: idx_planning_slots_class_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_slots_class_week ON public.planning_time_slots USING btree (class_code, week_number);


--
-- Name: idx_planning_slots_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_slots_day ON public.planning_time_slots USING btree (day_index);


--
-- Name: idx_planning_slots_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_slots_module ON public.planning_time_slots USING btree (module_code);


--
-- Name: idx_planning_time_slots_class_codes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_time_slots_class_codes ON public.planning_time_slots USING gin (class_codes_old);


--
-- Name: idx_planning_time_slots_class_codes_archive; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_time_slots_class_codes_archive ON public.planning_time_slots USING gin (class_codes_archive);


--
-- Name: idx_planning_time_slots_is_async; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_time_slots_is_async ON public.planning_time_slots USING btree (is_async) WHERE (is_async = true);


--
-- Name: idx_planning_time_slots_is_async_true; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_time_slots_is_async_true ON public.planning_time_slots USING btree (id) WHERE (is_async = true);


--
-- Name: idx_planning_validations_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_validations_module ON public.planning_validations USING btree (module_code);


--
-- Name: idx_planning_validations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planning_validations_status ON public.planning_validations USING btree (status);


--
-- Name: idx_post_media_post; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_media_post ON public.post_media USING btree (post_id);


--
-- Name: idx_posts_community; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_community ON public.posts USING btree (community_id);


--
-- Name: idx_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at);


--
-- Name: idx_posts_hashtags_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_hashtags_gin ON public.posts USING gin (hashtags);


--
-- Name: idx_posts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_user ON public.posts USING btree (user_id);


--
-- Name: idx_praticiens_mail; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_praticiens_mail ON public.praticiens_formateurs USING btree (mail);


--
-- Name: idx_praticiens_nom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_praticiens_nom ON public.praticiens_formateurs USING btree (nom);


--
-- Name: idx_praticiens_prenom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_praticiens_prenom ON public.praticiens_formateurs USING btree (prenom);


--
-- Name: idx_prerequisites_capsule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prerequisites_capsule ON public.capsule_prerequisites USING btree (capsule_id);


--
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);


--
-- Name: idx_progress_capsule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progress_capsule ON public.student_capsule_progress USING btree (capsule_id);


--
-- Name: idx_progress_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progress_status ON public.student_capsule_progress USING btree (status);


--
-- Name: idx_progress_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progress_student ON public.student_capsule_progress USING btree (student_id);


--
-- Name: idx_push_outbox_status_nextretry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_push_outbox_status_nextretry ON public.push_outbox USING btree (status, next_retry_at);


--
-- Name: idx_quests_active_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quests_active_period ON public.quests USING btree (start_date, end_date, status) WHERE ((status = 'active'::text) AND (start_date IS NOT NULL));


--
-- Name: idx_quests_end_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quests_end_date ON public.quests USING btree (end_date) WHERE (end_date IS NOT NULL);


--
-- Name: idx_quests_start_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quests_start_date ON public.quests USING btree (start_date) WHERE (start_date IS NOT NULL);


--
-- Name: idx_recap_cpt_evaluation_annee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recap_cpt_evaluation_annee ON public.recap_cpt_evaluation USING btree (annee);


--
-- Name: idx_recap_cpt_evaluation_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recap_cpt_evaluation_user_id ON public.recap_cpt_evaluation USING btree (user_id);


--
-- Name: idx_repondant_physio_hes_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repondant_physio_hes_email ON public."RepondantPhysioHES" USING btree (email);


--
-- Name: idx_repondant_physio_hes_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repondant_physio_hes_is_active ON public."RepondantPhysioHES" USING btree (is_active);


--
-- Name: idx_repondant_physio_hes_last_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repondant_physio_hes_last_name ON public."RepondantPhysioHES" USING btree (last_name);


--
-- Name: idx_repondant_physio_hes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repondant_physio_hes_user_id ON public."RepondantPhysioHES" USING btree (user_id);


--
-- Name: idx_responses_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_responses_module ON public.student_module_responses USING btree (module_id);


--
-- Name: idx_responses_progress; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_responses_progress ON public.student_module_responses USING btree (progress_id);


--
-- Name: idx_responses_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_responses_review ON public.student_module_responses USING btree (requires_review) WHERE (requires_review = true);


--
-- Name: idx_responses_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_responses_student ON public.student_module_responses USING btree (student_id);


--
-- Name: idx_student_documents_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_documents_created ON public.student_documents USING btree (created_at DESC);


--
-- Name: idx_student_documents_institution; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_documents_institution ON public.student_documents USING btree (institution_id);


--
-- Name: idx_student_documents_pfp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_documents_pfp ON public.student_documents USING btree (pfp_number);


--
-- Name: idx_student_documents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_documents_user_id ON public.student_documents USING btree (user_id);


--
-- Name: idx_student_result_vote_algorithm_run; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_algorithm_run ON public.student_result_vote USING btree (algorithm_run_id);


--
-- Name: idx_student_result_vote_assigned_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_assigned_at ON public.student_result_vote USING btree (assigned_at DESC);


--
-- Name: idx_student_result_vote_is_validated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_is_validated ON public.student_result_vote USING btree (is_validated);


--
-- Name: idx_student_result_vote_original_choices; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_original_choices ON public.student_result_vote USING gin (original_choices);


--
-- Name: idx_student_result_vote_pfp_arret; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_pfp_arret ON public.student_result_vote USING btree (pfp_arret);


--
-- Name: idx_student_result_vote_pfp_echec; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_pfp_echec ON public.student_result_vote USING btree (pfp_echec);


--
-- Name: idx_student_result_vote_pfp_validee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_pfp_validee ON public.student_result_vote USING btree (pfp_validee);


--
-- Name: idx_student_result_vote_pfp_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_pfp_year ON public.student_result_vote USING btree (pfp_type, year);


--
-- Name: idx_student_result_vote_pfp_year_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_pfp_year_status ON public.student_result_vote USING btree (pfp_type, year, status);


--
-- Name: idx_student_result_vote_place; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_place ON public.student_result_vote USING btree (assigned_place_id);


--
-- Name: idx_student_result_vote_place_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_place_year ON public.student_result_vote USING btree (assigned_place_id, year) WHERE (assigned_place_id IS NOT NULL);


--
-- Name: idx_student_result_vote_praticien; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_praticien ON public.student_result_vote USING btree (assigned_praticien_id);


--
-- Name: idx_student_result_vote_rank; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_rank ON public.student_result_vote USING btree (assigned_rank) WHERE (assigned_rank IS NOT NULL);


--
-- Name: idx_student_result_vote_repondant_hes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_repondant_hes ON public.student_result_vote USING btree (repondant_hes);


--
-- Name: idx_student_result_vote_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_status ON public.student_result_vote USING btree (status);


--
-- Name: idx_student_result_vote_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_user_id ON public.student_result_vote USING btree (user_id);


--
-- Name: idx_student_result_vote_user_pfp_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_user_pfp_year ON public.student_result_vote USING btree (user_id, pfp_type, year);


--
-- Name: idx_student_result_vote_user_pfp_year_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_result_vote_user_pfp_year_status ON public.student_result_vote USING btree (user_id, pfp_type, year, status);


--
-- Name: idx_student_votes_pfp_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_votes_pfp_year ON public.student_votes USING btree (pfp_type, year);


--
-- Name: idx_student_votes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_votes_user_id ON public.student_votes USING btree (user_id);


--
-- Name: idx_studentsphysio_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studentsphysio_class ON public."StudentsPhysio" USING btree (class);


--
-- Name: idx_studentsphysio_firebase_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studentsphysio_firebase_id ON public."StudentsPhysio" USING btree (firebase_id);


--
-- Name: idx_studentsphysio_pfp1a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studentsphysio_pfp1a ON public."StudentsPhysio" USING btree (pfp1a);


--
-- Name: idx_studentsphysio_pfp_valided; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studentsphysio_pfp_valided ON public."StudentsPhysio" USING gin (pfp_valided);


--
-- Name: idx_studentsphysio_pfpinfo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studentsphysio_pfpinfo ON public."StudentsPhysio" USING gin (pfpinfo);


--
-- Name: idx_studentsphysio_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_studentsphysio_user_id ON public."StudentsPhysio" USING btree (user_id);


--
-- Name: idx_suivi_cas_pfp_field; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suivi_cas_pfp_field ON public.suivi_cas_particuliers USING btree (pfp_field);


--
-- Name: idx_suivi_cas_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suivi_cas_user_id ON public.suivi_cas_particuliers USING btree (user_id);


--
-- Name: idx_suivi_cas_visible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suivi_cas_visible ON public.suivi_cas_particuliers USING btree (visible);


--
-- Name: idx_tracks_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tracks_active ON public.tracks USING btree (is_active);


--
-- Name: idx_user_badges_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_badges_user_id ON public.user_badges USING btree (user_id);


--
-- Name: idx_user_challenge_progress_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_challenge_progress_user_id ON public.user_challenge_progress USING btree (user_id);


--
-- Name: idx_user_communities_comm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_communities_comm ON public.user_communities USING btree (community_id);


--
-- Name: idx_user_communities_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_communities_user ON public.user_communities USING btree (user_id);


--
-- Name: idx_user_daily_spins_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_daily_spins_user_date ON public.user_daily_spins USING btree (user_id, spin_date);


--
-- Name: idx_user_profiles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_active ON public.user_profiles USING btree (is_active);


--
-- Name: idx_user_profiles_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_created_at ON public.user_profiles USING btree (created_at);


--
-- Name: idx_user_profiles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_email ON public.user_profiles USING btree (email);


--
-- Name: idx_user_profiles_family_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_family_name ON public.user_profiles USING btree (family_name);


--
-- Name: idx_user_profiles_firebase_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_firebase_id ON public.user_profiles USING btree (firebase_id);


--
-- Name: idx_user_profiles_forname; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_forname ON public.user_profiles USING btree (forname);


--
-- Name: idx_user_profiles_house; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_house ON public.user_profiles USING btree (house_id) WHERE (house_id IS NOT NULL);


--
-- Name: idx_user_profiles_permissions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_permissions ON public.user_profiles USING gin (permissions);


--
-- Name: idx_user_profiles_pfp_cohort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_pfp_cohort ON public.user_profiles USING btree (pfp_cohort) WHERE (pfp_cohort IS NOT NULL);


--
-- Name: idx_user_profiles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_role ON public.user_profiles USING btree (role);


--
-- Name: idx_user_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);


--
-- Name: idx_user_roles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_email ON public.user_roles USING btree (user_email);


--
-- Name: idx_user_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_user_track_roles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_track_roles_active ON public.user_track_roles USING btree (user_id, track_id) WHERE (is_active = true);


--
-- Name: idx_user_track_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_track_roles_role ON public.user_track_roles USING btree (role);


--
-- Name: idx_user_track_roles_track; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_track_roles_track ON public.user_track_roles USING btree (track_id);


--
-- Name: idx_user_track_roles_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_track_roles_user ON public.user_track_roles USING btree (user_id);


--
-- Name: idx_user_track_roles_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_track_roles_user_active ON public.user_track_roles USING btree (user_id, is_active);


--
-- Name: idx_video_library_module_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_library_module_id ON public.video_library USING btree (module_id);


--
-- Name: idx_video_library_published_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_library_published_date ON public.video_library USING btree (published_date DESC);


--
-- Name: idx_video_library_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_library_tags ON public.video_library USING gin (tags);


--
-- Name: idx_video_library_ticket_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_library_ticket_id ON public.video_library USING btree (ticket_id);


--
-- Name: idx_video_library_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_library_type ON public.video_library USING btree (type);


--
-- Name: idx_video_library_vimeo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_library_vimeo_id ON public.video_library USING btree (vimeo_id);


--
-- Name: idx_video_library_year_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_library_year_id ON public.video_library USING btree (year_id);


--
-- Name: idx_votation_sessions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_votation_sessions_active ON public.votation_sessions USING btree (pfp_type, year, status) WHERE (status = 'open'::text);


--
-- Name: idx_votation_sessions_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_votation_sessions_class ON public.votation_sessions USING btree (target_class, status) WHERE (status = 'open'::text);


--
-- Name: idx_votation_sessions_is_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_votation_sessions_is_priority ON public.votation_sessions USING btree (is_priority) WHERE (is_priority = true);


--
-- Name: idx_xp_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_xp_history_created_at ON public.xp_history USING btree (created_at DESC);


--
-- Name: idx_xp_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_xp_history_user_id ON public.xp_history USING btree (user_id);


--
-- Name: planning_slot_votes_slot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX planning_slot_votes_slot_idx ON public.planning_slot_votes USING btree (slot_id);


--
-- Name: planning_slot_votes_slot_teacher_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX planning_slot_votes_slot_teacher_uniq ON public.planning_slot_votes USING btree (slot_id, teacher_id);


--
-- Name: planning_slot_votes_teacher_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX planning_slot_votes_teacher_idx ON public.planning_slot_votes USING btree (teacher_id);


--
-- Name: schema_migrations_version_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX schema_migrations_version_idx ON public.schema_migrations USING btree (version);


--
-- Name: studentsphysio_user_year_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX studentsphysio_user_year_key ON public."StudentsPhysio" USING btree (user_id, year);


--
-- Name: ux_places_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_places_id ON public.places USING btree (id);


--
-- Name: capsules_with_stats _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.capsules_with_stats AS
 SELECT c.id,
    c.title,
    c.description,
    c.category,
    c.difficulty,
    c.duration,
    c.author_id,
    c.author_name,
    c.author_role,
    c.tags,
    c.is_public,
    c.allow_comments,
    c.track_progress,
    c.status,
    c.created_at,
    c.updated_at,
    c.published_at,
    c.views_count,
    c.completions_count,
    c.average_score,
    c.average_time,
    c.student_feedback_avg,
    count(DISTINCT scp.student_id) AS unique_students,
    count(DISTINCT
        CASE
            WHEN ((scp.status)::text = 'completed'::text) THEN scp.student_id
            ELSE NULL::uuid
        END) AS completed_students,
    avg(cf.rating) AS avg_rating,
    count(cm.id) AS module_count
   FROM (((public.capsules c
     LEFT JOIN public.student_capsule_progress scp ON ((c.id = scp.capsule_id)))
     LEFT JOIN public.capsule_feedback cf ON ((c.id = cf.capsule_id)))
     LEFT JOIN public.capsule_modules cm ON ((c.id = cm.capsule_id)))
  GROUP BY c.id;


--
-- Name: dynamic_routes dynamic_routes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER dynamic_routes_updated_at BEFORE UPDATE ON public.dynamic_routes FOR EACH ROW EXECUTE FUNCTION public.update_dynamic_routes_updated_at();


--
-- Name: user_profiles handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: institutions institutions_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER institutions_set_updated_at BEFORE UPDATE ON public.institutions FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: gamification_data on_gamification_change_update_house_stats; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_gamification_change_update_house_stats AFTER INSERT OR DELETE OR UPDATE ON public.gamification_data FOR EACH ROW EXECUTE FUNCTION public.update_house_stats();


--
-- Name: places places_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER places_updated_at BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION public.update_places_updated_at();


--
-- Name: planning_time_slots planning_time_slots_history_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER planning_time_slots_history_trigger AFTER INSERT OR DELETE OR UPDATE ON public.planning_time_slots FOR EACH ROW EXECUTE FUNCTION public.log_planning_changes();


--
-- Name: student_votes set_student_votes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_student_votes_updated_at BEFORE UPDATE ON public.student_votes FOR EACH ROW EXECUTE FUNCTION public.update_student_votes_updated_at();


--
-- Name: student_documents student_documents_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER student_documents_updated_at_trigger BEFORE UPDATE ON public.student_documents FOR EACH ROW EXECUTE FUNCTION public.update_student_documents_updated_at();


--
-- Name: gamification_data sync_house_stats; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_house_stats AFTER INSERT OR UPDATE ON public.gamification_data FOR EACH ROW EXECUTE FUNCTION public.update_house_stats();


--
-- Name: tracks tracks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tracks_updated_at BEFORE UPDATE ON public.tracks FOR EACH ROW EXECUTE FUNCTION public.update_tracks_updated_at();


--
-- Name: student_result_vote trg_fill_student_result_vote_assigned_fields; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fill_student_result_vote_assigned_fields BEFORE INSERT OR UPDATE OF assigned_place_id ON public.student_result_vote FOR EACH ROW EXECUTE FUNCTION public.fill_student_result_vote_assigned_fields();


--
-- Name: student_result_vote trg_fill_student_result_vote_assigned_institution_name; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fill_student_result_vote_assigned_institution_name BEFORE INSERT OR UPDATE OF assigned_place_id, assigned_institution_name ON public.student_result_vote FOR EACH ROW EXECUTE FUNCTION public.fill_student_result_vote_assigned_institution_name();


--
-- Name: institutions trg_institutions_propagate_name_to_places; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_institutions_propagate_name_to_places AFTER UPDATE OF "Name" ON public.institutions FOR EACH ROW EXECUTE FUNCTION public.propagate_institution_name_to_places();


--
-- Name: places trg_places_sync_institution_name; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_places_sync_institution_name BEFORE INSERT OR UPDATE OF "InstitutionId" ON public.places FOR EACH ROW EXECUTE FUNCTION public.sync_places_institution_name();


--
-- Name: modules trg_sync_module_responsable_email; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_module_responsable_email BEFORE INSERT OR UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.sync_module_responsable_email();


--
-- Name: gamification_data trigger_auto_create_user_profile; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_create_user_profile AFTER INSERT ON public.gamification_data FOR EACH ROW EXECUTE FUNCTION public.auto_create_user_profile();


--
-- Name: user_profiles trigger_auto_generate_display_name; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_generate_display_name BEFORE INSERT OR UPDATE OF forname, family_name, display_name ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.auto_generate_display_name();


--
-- Name: quests trigger_check_quest_expiration; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_check_quest_expiration BEFORE UPDATE ON public.quests FOR EACH ROW EXECUTE FUNCTION public.check_quest_expiration();


--
-- Name: planning_cells trigger_planning_cells_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_planning_cells_updated_at BEFORE UPDATE ON public.planning_cells FOR EACH ROW EXECUTE FUNCTION public.update_planning_cells_updated_at();


--
-- Name: academic_tickets trigger_set_created_by; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_created_by BEFORE INSERT ON public.academic_tickets FOR EACH ROW EXECUTE FUNCTION public.set_created_by_on_insert();


--
-- Name: academic_tickets trigger_update_academic_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_academic_tickets_updated_at BEFORE UPDATE ON public.academic_tickets FOR EACH ROW EXECUTE FUNCTION public.update_academic_tickets_updated_at();


--
-- Name: feedbackas trigger_update_feedbackas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_feedbackas_updated_at BEFORE UPDATE ON public.feedbackas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: houses trigger_update_house_level; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_house_level BEFORE UPDATE OF total_xp ON public.houses FOR EACH ROW EXECUTE FUNCTION public.update_house_level();


--
-- Name: recap_cpt_evaluation trigger_update_recap_cpt_evaluation_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_recap_cpt_evaluation_updated_at BEFORE UPDATE ON public.recap_cpt_evaluation FOR EACH ROW EXECUTE FUNCTION public.update_recap_cpt_evaluation_updated_at();


--
-- Name: student_result_vote trigger_update_student_result_vote_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_student_result_vote_updated_at BEFORE UPDATE ON public.student_result_vote FOR EACH ROW EXECUTE FUNCTION public.update_student_result_vote_updated_at();


--
-- Name: suivi_cas_particuliers trigger_update_suivi_cas_particuliers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_suivi_cas_particuliers_updated_at BEFORE UPDATE ON public.suivi_cas_particuliers FOR EACH ROW EXECUTE FUNCTION public.update_suivi_cas_particuliers_updated_at();


--
-- Name: academic_years update_academic_years_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON public.academic_years FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: capsules update_capsules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_capsules_updated_at BEFORE UPDATE ON public.capsules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: classes update_classes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cohorts update_cohorts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cohorts_updated_at BEFORE UPDATE ON public.cohorts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: course_modules update_course_modules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_course_modules_updated_at BEFORE UPDATE ON public.course_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: capsule_evaluations update_evaluations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.capsule_evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: content_library update_library_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_library_updated_at BEFORE UPDATE ON public.content_library FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: capsule_modules update_modules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.capsule_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: modules update_modules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: planning_time_slots update_planning_slots_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_planning_slots_updated_at BEFORE UPDATE ON public.planning_time_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: student_capsule_progress update_progress_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON public.student_capsule_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: RepondantPhysioHES update_repondant_physio_hes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_repondant_physio_hes_updated_at BEFORE UPDATE ON public."RepondantPhysioHES" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: StudentsPhysio update_studentsphysio_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_studentsphysio_updated_at BEFORE UPDATE ON public."StudentsPhysio" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_roles update_user_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_track_roles user_track_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER user_track_roles_updated_at BEFORE UPDATE ON public.user_track_roles FOR EACH ROW EXECUTE FUNCTION public.update_user_track_roles_updated_at();


--
-- Name: StudentsPhysio StudentsPhysio_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentsPhysio"
    ADD CONSTRAINT "StudentsPhysio_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: academic_tickets academic_tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_tickets
    ADD CONSTRAINT academic_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: academic_tickets academic_tickets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_tickets
    ADD CONSTRAINT academic_tickets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: admin_users admin_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_usage_events ai_usage_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_events
    ADD CONSTRAINT ai_usage_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: calendar_cells calendar_cells_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_cells
    ADD CONSTRAINT calendar_cells_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- Name: calendar_cells calendar_cells_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_cells
    ADD CONSTRAINT calendar_cells_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE SET NULL;


--
-- Name: capsule_assignments capsule_assignments_capsule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_assignments
    ADD CONSTRAINT capsule_assignments_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;


--
-- Name: capsule_assignments capsule_assignments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_assignments
    ADD CONSTRAINT capsule_assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: capsule_evaluations capsule_evaluations_capsule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_evaluations
    ADD CONSTRAINT capsule_evaluations_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;


--
-- Name: capsule_feedback capsule_feedback_capsule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_feedback
    ADD CONSTRAINT capsule_feedback_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;


--
-- Name: capsule_feedback capsule_feedback_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_feedback
    ADD CONSTRAINT capsule_feedback_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: capsule_learning_objectives capsule_learning_objectives_capsule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_learning_objectives
    ADD CONSTRAINT capsule_learning_objectives_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;


--
-- Name: capsule_modules capsule_modules_capsule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_modules
    ADD CONSTRAINT capsule_modules_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;


--
-- Name: capsule_prerequisites capsule_prerequisites_capsule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_prerequisites
    ADD CONSTRAINT capsule_prerequisites_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;


--
-- Name: capsule_prerequisites capsule_prerequisites_prerequisite_capsule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsule_prerequisites
    ADD CONSTRAINT capsule_prerequisites_prerequisite_capsule_id_fkey FOREIGN KEY (prerequisite_capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;


--
-- Name: capsules capsules_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.capsules
    ADD CONSTRAINT capsules_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: challenges challenges_badge_reward_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_badge_reward_fkey FOREIGN KEY (badge_reward) REFERENCES public.badges(id);


--
-- Name: classes classes_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- Name: cohorts cohorts_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- Name: content_library content_library_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_library
    ADD CONSTRAINT content_library_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id);


--
-- Name: course_teachers course_teachers_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_teachers
    ADD CONSTRAINT course_teachers_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_teachers course_teachers_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_teachers
    ADD CONSTRAINT course_teachers_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: courses courses_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE SET NULL;


--
-- Name: daily_wheel_spins daily_wheel_spins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_wheel_spins
    ADD CONSTRAINT daily_wheel_spins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: event_likes event_likes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_likes
    ADD CONSTRAINT event_likes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: feedbacka_submissions feedbacka_submissions_feedbacka_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacka_submissions
    ADD CONSTRAINT feedbacka_submissions_feedbacka_id_fkey FOREIGN KEY (feedbacka_id) REFERENCES public.feedbackas(id) ON DELETE CASCADE;


--
-- Name: file_physio_files file_physio_files_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_physio_files
    ADD CONSTRAINT file_physio_files_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.file_physio_folders(id) ON DELETE CASCADE;


--
-- Name: file_physio_folders file_physio_folders_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_physio_folders
    ADD CONSTRAINT file_physio_folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.file_physio_folders(id) ON DELETE CASCADE;


--
-- Name: firebase_supabase_mapping firebase_supabase_mapping_supabase_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firebase_supabase_mapping
    ADD CONSTRAINT firebase_supabase_mapping_supabase_user_id_fkey FOREIGN KEY (supabase_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles fk_user_profiles_house_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT fk_user_profiles_house_id FOREIGN KEY (house_id) REFERENCES public.houses(id);


--
-- Name: game_profiles game_profiles_house_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_profiles
    ADD CONSTRAINT game_profiles_house_id_fkey FOREIGN KEY (house_id) REFERENCES public.houses(id);


--
-- Name: game_profiles game_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_profiles
    ADD CONSTRAINT game_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: game_quest_progress game_quest_progress_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_quest_progress
    ADD CONSTRAINT game_quest_progress_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.game_quests(id) ON DELETE CASCADE;


--
-- Name: game_quest_progress game_quest_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_quest_progress
    ADD CONSTRAINT game_quest_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: game_xp_logs game_xp_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_xp_logs
    ADD CONSTRAINT game_xp_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: modules modules_track_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id);


--
-- Name: planning_history planning_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_history
    ADD CONSTRAINT planning_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);


--
-- Name: planning_validations planning_validations_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planning_validations
    ADD CONSTRAINT planning_validations_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES auth.users(id);


--
-- Name: post_media post_media_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT post_media_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: posts posts_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE SET NULL;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: push_outbox push_outbox_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_outbox
    ADD CONSTRAINT push_outbox_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quest_steps quest_steps_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_steps
    ADD CONSTRAINT quest_steps_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE;


--
-- Name: RepondantPhysioHES repondant_physio_hes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RepondantPhysioHES"
    ADD CONSTRAINT repondant_physio_hes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_slug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_slug_fkey FOREIGN KEY (permission_slug) REFERENCES public.permissions(slug) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: student_capsule_notes student_capsule_notes_capsule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_capsule_notes
    ADD CONSTRAINT student_capsule_notes_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;


--
-- Name: student_capsule_notes student_capsule_notes_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_capsule_notes
    ADD CONSTRAINT student_capsule_notes_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.capsule_modules(id) ON DELETE CASCADE;


--
-- Name: student_capsule_notes student_capsule_notes_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_capsule_notes
    ADD CONSTRAINT student_capsule_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: student_capsule_progress student_capsule_progress_capsule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_capsule_progress
    ADD CONSTRAINT student_capsule_progress_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;


--
-- Name: student_capsule_progress student_capsule_progress_current_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_capsule_progress
    ADD CONSTRAINT student_capsule_progress_current_module_id_fkey FOREIGN KEY (current_module_id) REFERENCES public.capsule_modules(id) ON DELETE SET NULL;


--
-- Name: student_capsule_progress student_capsule_progress_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_capsule_progress
    ADD CONSTRAINT student_capsule_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: student_module_responses student_module_responses_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_module_responses
    ADD CONSTRAINT student_module_responses_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.capsule_modules(id) ON DELETE CASCADE;


--
-- Name: student_module_responses student_module_responses_progress_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_module_responses
    ADD CONSTRAINT student_module_responses_progress_id_fkey FOREIGN KEY (progress_id) REFERENCES public.student_capsule_progress(id) ON DELETE CASCADE;


--
-- Name: student_module_responses student_module_responses_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_module_responses
    ADD CONSTRAINT student_module_responses_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: student_module_responses student_module_responses_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_module_responses
    ADD CONSTRAINT student_module_responses_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: student_votes student_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_votes
    ADD CONSTRAINT student_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;


--
-- Name: user_challenge_progress user_challenge_progress_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenge_progress
    ADD CONSTRAINT user_challenge_progress_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;


--
-- Name: user_challenge_progress user_challenge_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenge_progress
    ADD CONSTRAINT user_challenge_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;


--
-- Name: user_communities user_communities_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_communities
    ADD CONSTRAINT user_communities_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: user_communities user_communities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_communities
    ADD CONSTRAINT user_communities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_daily_spins user_daily_spins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_spins
    ADD CONSTRAINT user_daily_spins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: user_permissions user_permissions_permission_slug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_permission_slug_fkey FOREIGN KEY (permission_slug) REFERENCES public.permissions(slug) ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_primary_track_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_primary_track_id_fkey FOREIGN KEY (primary_track_id) REFERENCES public.tracks(id);


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_quest_progress user_quest_progress_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quest_progress
    ADD CONSTRAINT user_quest_progress_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_track_roles user_track_roles_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_track_roles
    ADD CONSTRAINT user_track_roles_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id);


--
-- Name: user_track_roles user_track_roles_track_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_track_roles
    ADD CONSTRAINT user_track_roles_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE;


--
-- Name: user_track_roles user_track_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_track_roles
    ADD CONSTRAINT user_track_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: video_library video_library_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_library
    ADD CONSTRAINT video_library_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: video_library video_library_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_library
    ADD CONSTRAINT video_library_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.academic_tickets(id) ON DELETE SET NULL;


--
-- Name: votation_sessions votation_sessions_opened_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votation_sessions
    ADD CONSTRAINT votation_sessions_opened_by_fkey FOREIGN KEY (opened_by) REFERENCES auth.users(id);


--
-- Name: xp_history xp_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_history
    ADD CONSTRAINT xp_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;


--
-- Name: events Admin can delete their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete their events" ON public.events FOR DELETE USING (((admin_uid)::uuid = auth.uid()));


--
-- Name: user_track_roles Admin can manage track roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage track roles" ON public.user_track_roles USING ((((role)::text <> 'SUPER_ADMIN'::text) AND (EXISTS ( SELECT 1
   FROM public.user_track_roles utr
  WHERE ((utr.user_id = auth.uid()) AND ((utr.track_id)::text = (user_track_roles.track_id)::text) AND ((utr.role)::text = ANY ((ARRAY['ADMIN'::character varying, 'SECRETARIAT'::character varying])::text[])) AND (utr.is_active = true) AND ((utr.expires_at IS NULL) OR (utr.expires_at > now())))))));


--
-- Name: student_result_vote Admin can update all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update all" ON public.student_result_vote FOR UPDATE TO authenticated USING (((auth.jwt() ->> 'role'::text) = 'admin'::text));


--
-- Name: events Admin can update their events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update their events" ON public.events FOR UPDATE USING (((admin_uid)::uuid = auth.uid()));


--
-- Name: user_track_roles Admin can view track roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view track roles" ON public.user_track_roles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_track_roles utr
  WHERE ((utr.user_id = auth.uid()) AND ((utr.track_id)::text = (user_track_roles.track_id)::text) AND ((utr.role)::text = ANY ((ARRAY['ADMIN'::character varying, 'SECRETARIAT'::character varying, 'RF'::character varying])::text[])) AND (utr.is_active = true) AND ((utr.expires_at IS NULL) OR (utr.expires_at > now()))))));


--
-- Name: student_votes Admins can delete any vote; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any vote" ON public.student_votes FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND ((user_profiles.role)::text = 'admin'::text)))));


--
-- Name: student_result_vote Admins can delete results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete results" ON public.student_result_vote FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND (((user_profiles.role)::text = 'admin'::text) OR ((user_profiles.role)::text = 'superadmin'::text))))));


--
-- Name: student_result_vote Admins can insert results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert results" ON public.student_result_vote FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND (((user_profiles.role)::text = 'admin'::text) OR ((user_profiles.role)::text = 'superadmin'::text))))));


--
-- Name: student_votes Admins can read all votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all votes" ON public.student_votes FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND ((user_profiles.role)::text = 'admin'::text)))) OR (user_id = auth.uid())));


--
-- Name: student_result_vote Admins can update results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update results" ON public.student_result_vote FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND (((user_profiles.role)::text = 'admin'::text) OR ((user_profiles.role)::text = 'superadmin'::text))))));


--
-- Name: student_result_vote Admins can view all results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all results" ON public.student_result_vote FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND (((user_profiles.role)::text = 'admin'::text) OR ((user_profiles.role)::text = 'superadmin'::text))))));


--
-- Name: capsules Admins et enseignants peuvent tout voir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins et enseignants peuvent tout voir" ON public.capsules FOR SELECT USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['admin'::text, 'EnseignantPhysio'::text, 'EnseignantSoins'::text, 'AdminPhysio'::text, 'AdminSoins'::text])))));


--
-- Name: capsules Admins peuvent tout modifier; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins peuvent tout modifier" ON public.capsules FOR UPDATE USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['admin'::text, 'AdminPhysio'::text, 'AdminSoins'::text])))));


--
-- Name: RepondantPhysioHES Allow all for service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all for service role" ON public."RepondantPhysioHES" TO service_role USING (true);


--
-- Name: modules Allow anyone to read modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anyone to read modules" ON public.modules FOR SELECT TO anon, authenticated USING (true);


--
-- Name: recap_cpt_evaluation Allow authenticated users to read recap_cpt_evaluation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to read recap_cpt_evaluation" ON public.recap_cpt_evaluation FOR SELECT TO authenticated USING (true);


--
-- Name: modules Allow authenticated users to view modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view modules" ON public.modules FOR SELECT TO authenticated USING (true);


--
-- Name: academic_years Allow public read access on academic_years; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on academic_years" ON public.academic_years FOR SELECT USING (true);


--
-- Name: classes Allow public read access on classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on classes" ON public.classes FOR SELECT USING (true);


--
-- Name: cohorts Allow public read access on cohorts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on cohorts" ON public.cohorts FOR SELECT USING (true);


--
-- Name: video_library Anyone authenticated can view videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone authenticated can view videos" ON public.video_library FOR SELECT TO authenticated USING (true);


--
-- Name: event_likes Anyone can view likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view likes" ON public.event_likes FOR SELECT USING (true);


--
-- Name: events Anyone can view public events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view public events" ON public.events FOR SELECT USING ((type = 'public'::text));


--
-- Name: event_registrations Anyone can view registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view registrations" ON public.event_registrations FOR SELECT USING (true);


--
-- Name: capsules Auteurs peuvent créer; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auteurs peuvent créer" ON public.capsules FOR INSERT WITH CHECK ((auth.uid() = author_id));


--
-- Name: capsules Auteurs peuvent modifier leurs capsules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auteurs peuvent modifier leurs capsules" ON public.capsules FOR UPDATE USING ((auth.uid() = author_id));


--
-- Name: events Authenticated users can create events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT WITH CHECK (((auth.role() = 'authenticated'::text) AND ((admin_uid)::uuid = auth.uid())));


--
-- Name: events Authenticated users can view private events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view private events" ON public.events FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: communities Communities are readable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Communities are readable by everyone" ON public.communities FOR SELECT USING (true);


--
-- Name: events Créateur peut modifier; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Créateur peut modifier" ON public.events FOR UPDATE TO authenticated USING (((auth.uid())::text = admin_uid)) WITH CHECK (((auth.uid())::text = admin_uid));


--
-- Name: events Créateur peut supprimer; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Créateur peut supprimer" ON public.events FOR DELETE TO authenticated USING (((auth.uid())::text = admin_uid));


--
-- Name: planning_time_slots Créneaux lisibles par tous; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Créneaux lisibles par tous" ON public.planning_time_slots FOR SELECT TO authenticated USING (true);


--
-- Name: user_profiles Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: student_capsule_progress Enseignants voient progression de leurs capsules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enseignants voient progression de leurs capsules" ON public.student_capsule_progress FOR SELECT USING ((capsule_id IN ( SELECT capsules.id
   FROM public.capsules
  WHERE (capsules.author_id = auth.uid()))));


--
-- Name: game_quests Everyone can view active quests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active quests" ON public.game_quests FOR SELECT USING ((is_active = true));


--
-- Name: houses Houses are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Houses are viewable by everyone" ON public.houses FOR SELECT USING (true);


--
-- Name: institutions Institutions delete service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Institutions delete service role" ON public.institutions FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: institutions Institutions insert service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Institutions insert service role" ON public.institutions FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: institutions Institutions read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Institutions read access" ON public.institutions FOR SELECT USING (true);


--
-- Name: institutions Institutions update service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Institutions update service role" ON public.institutions FOR UPDATE USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: alpinphysio_members Lecture membres actifs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture membres actifs" ON public.alpinphysio_members FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: events Lecture événements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture événements" ON public.events FOR SELECT TO authenticated USING (((type = ANY (ARRAY['public'::text, 'private'::text])) OR ((type = 'alpinphysio'::text) AND public.is_alpinphysio_member((auth.uid())::text))));


--
-- Name: events Modification événements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modification événements" ON public.events FOR UPDATE TO authenticated USING ((((auth.uid())::text = admin_uid) OR ((type = 'alpinphysio'::text) AND public.is_alpinphysio_admin((auth.uid())::text)))) WITH CHECK ((((auth.uid())::text = admin_uid) OR ((type = 'alpinphysio'::text) AND public.is_alpinphysio_admin((auth.uid())::text))));


--
-- Name: course_modules Modules lisibles par tous; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modules lisibles par tous" ON public.course_modules FOR SELECT TO authenticated USING (true);


--
-- Name: modules Modules visible par filière; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modules visible par filière" ON public.modules FOR SELECT USING ((public.is_global_admin() OR public.can_access_track(track_id) OR ((track_id IS NULL) AND (auth.uid() IS NOT NULL))));


--
-- Name: video_library Only admin and editor can insert videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admin and editor can insert videos" ON public.video_library FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: video_library Only admin and editor can update videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admin and editor can update videos" ON public.video_library FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'editor'::text]))))));


--
-- Name: video_library Only admin can delete videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admin can delete videos" ON public.video_library FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: places Places are viewable by authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Places are viewable by authenticated users" ON public.places FOR SELECT TO authenticated USING (true);


--
-- Name: places Places are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Places are viewable by everyone" ON public.places FOR SELECT TO anon USING (true);


--
-- Name: planning_cells Planning cells lisibles par tous; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Planning cells lisibles par tous" ON public.planning_cells FOR SELECT TO authenticated USING (true);


--
-- Name: post_media Post media are readable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Post media are readable by everyone" ON public.post_media FOR SELECT USING (true);


--
-- Name: posts Posts are readable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Posts are readable by everyone" ON public.posts FOR SELECT USING (true);


--
-- Name: RepondantPhysioHES; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."RepondantPhysioHES" ENABLE ROW LEVEL SECURITY;

--
-- Name: student_documents Service role can do everything; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can do everything" ON public.student_documents TO service_role USING (true) WITH CHECK (true);


--
-- Name: student_result_vote Student can select own published; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Student can select own published" ON public.student_result_vote FOR SELECT TO authenticated USING (((user_id = auth.uid()) AND (status = 'published'::text)));


--
-- Name: votation_sessions Students can read open sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can read open sessions" ON public.votation_sessions FOR SELECT USING ((status = 'open'::text));


--
-- Name: student_result_vote Students can view their own results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own results" ON public.student_result_vote FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: StudentsPhysio; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."StudentsPhysio" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_track_roles SuperAdmin can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin can manage all roles" ON public.user_track_roles USING ((EXISTS ( SELECT 1
   FROM public.user_track_roles utr
  WHERE ((utr.user_id = auth.uid()) AND ((utr.role)::text = 'SUPER_ADMIN'::text) AND (utr.is_active = true) AND ((utr.expires_at IS NULL) OR (utr.expires_at > now()))))));


--
-- Name: user_track_roles SuperAdmin can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "SuperAdmin can view all roles" ON public.user_track_roles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_track_roles utr
  WHERE ((utr.user_id = auth.uid()) AND ((utr.role)::text = 'SUPER_ADMIN'::text) AND (utr.is_active = true) AND ((utr.expires_at IS NULL) OR (utr.expires_at > now()))))));


--
-- Name: events Suppression événements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppression événements" ON public.events FOR DELETE TO authenticated USING ((((auth.uid())::text = admin_uid) OR ((type = 'alpinphysio'::text) AND public.is_alpinphysio_admin((auth.uid())::text))));


--
-- Name: events Tous peuvent lire les événements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tous peuvent lire les événements" ON public.events FOR SELECT TO authenticated USING (true);


--
-- Name: tracks Tracks visible par tous; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tracks visible par tous" ON public.tracks FOR SELECT USING (true);


--
-- Name: post_media Users can delete media for own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete media for own posts" ON public.post_media FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.posts p
  WHERE ((p.id = post_media.post_id) AND (p.user_id = auth.uid())))));


--
-- Name: student_documents Users can delete their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own documents" ON public.student_documents FOR DELETE USING (((auth.uid())::text = user_id));


--
-- Name: posts Users can delete their posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their posts" ON public.posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: post_media Users can insert media for own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert media for own posts" ON public.post_media FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.posts p
  WHERE ((p.id = post_media.post_id) AND (p.user_id = auth.uid())))));


--
-- Name: gamification_data Users can insert own gamification data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own gamification data" ON public.gamification_data FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: game_quest_progress Users can insert own quest progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own quest progress" ON public.game_quest_progress FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: student_documents Users can insert their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own documents" ON public.student_documents FOR INSERT WITH CHECK (((auth.uid())::text = user_id));


--
-- Name: student_votes Users can insert their own votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own votes" ON public.student_votes FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: posts Users can insert their posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their posts" ON public.posts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: event_likes Users can like events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can like events" ON public.event_likes FOR INSERT WITH CHECK ((auth.uid() OPERATOR(public.=) user_uid));


--
-- Name: event_registrations Users can register themselves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can register themselves" ON public.event_registrations FOR INSERT WITH CHECK ((auth.uid() OPERATOR(public.=) user_uid));


--
-- Name: event_likes Users can unlike events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unlike events" ON public.event_likes FOR DELETE USING ((auth.uid() OPERATOR(public.=) user_uid));


--
-- Name: event_registrations Users can unregister themselves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unregister themselves" ON public.event_registrations FOR DELETE USING ((auth.uid() OPERATOR(public.=) user_uid));


--
-- Name: post_media Users can update media for own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update media for own posts" ON public.post_media FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.posts p
  WHERE ((p.id = post_media.post_id) AND (p.user_id = auth.uid())))));


--
-- Name: game_profiles Users can update own game profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own game profile" ON public.game_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: gamification_data Users can update own gamification data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own gamification data" ON public.gamification_data FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: game_quest_progress Users can update own quest progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own quest progress" ON public.game_quest_progress FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: student_documents Users can update their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own documents" ON public.student_documents FOR UPDATE USING (((auth.uid())::text = user_id)) WITH CHECK (((auth.uid())::text = user_id));


--
-- Name: student_votes Users can update their own votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own votes" ON public.student_votes FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: posts Users can update their posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their posts" ON public.posts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: game_profiles Users can view own game profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own game profile" ON public.game_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: game_quest_progress Users can view own quest progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own quest progress" ON public.game_quest_progress FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_track_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_track_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: student_documents Users can view their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own documents" ON public.student_documents FOR SELECT USING (((auth.uid())::text = user_id));


--
-- Name: user_communities Users delete own memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users delete own memberships" ON public.user_communities FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_communities Users insert own memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own memberships" ON public.user_communities FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_communities Users read own memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own memberships" ON public.user_communities FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: academic_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.academic_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: academic_years; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

--
-- Name: praticiens_formateurs admin_delete_praticiens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_delete_praticiens ON public.praticiens_formateurs FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND ((user_profiles.role)::text = 'admin'::text) AND (user_profiles.is_active = true)))));


--
-- Name: admin_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_users admin_users_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_users_manage ON public.admin_users USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: admin_users admin_users_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_users_read ON public.admin_users FOR SELECT USING (public.is_admin());


--
-- Name: ai_usage_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_usage_events ai_usage_events_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_usage_events_own_select ON public.ai_usage_events FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: alpinphysio_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.alpinphysio_members ENABLE ROW LEVEL SECURITY;

--
-- Name: praticiens_formateurs authenticated_read_praticiens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_read_praticiens ON public.praticiens_formateurs FOR SELECT TO authenticated USING (true);


--
-- Name: badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

--
-- Name: calendar_cells; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_cells ENABLE ROW LEVEL SECURITY;

--
-- Name: capsule_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.capsule_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: capsule_evaluations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.capsule_evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: capsule_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.capsule_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: capsule_learning_objectives; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.capsule_learning_objectives ENABLE ROW LEVEL SECURITY;

--
-- Name: capsule_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.capsule_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: capsule_prerequisites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.capsule_prerequisites ENABLE ROW LEVEL SECURITY;

--
-- Name: capsules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.capsules ENABLE ROW LEVEL SECURITY;

--
-- Name: cas_particuliers_historique; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cas_particuliers_historique ENABLE ROW LEVEL SECURITY;

--
-- Name: cas_particuliers_historique cas_particuliers_historique_privileged; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cas_particuliers_historique_privileged ON public.cas_particuliers_historique TO authenticated USING (( SELECT public.app_can_manage_cases() AS app_can_manage_cases)) WITH CHECK (( SELECT public.app_can_manage_cases() AS app_can_manage_cases));


--
-- Name: challenges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

--
-- Name: cohorts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

--
-- Name: communities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

--
-- Name: communities communities_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY communities_select_auth ON public.communities FOR SELECT TO authenticated USING (true);


--
-- Name: content_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

--
-- Name: course_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: course_teachers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_teachers ENABLE ROW LEVEL SECURITY;

--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_wheel_spins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_wheel_spins ENABLE ROW LEVEL SECURITY;

--
-- Name: push_subscriptions delete own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "delete own subscriptions" ON public.push_subscriptions FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: push_outbox delete_own_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_own_notifications ON public.push_outbox FOR DELETE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: user_profiles delete_own_profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_own_profile ON public.user_profiles FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: demo_ba00_seed_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.demo_ba00_seed_users ENABLE ROW LEVEL SECURITY;

--
-- Name: dynamic_routes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dynamic_routes ENABLE ROW LEVEL SECURITY;

--
-- Name: dynamic_routes dynamic_routes_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dynamic_routes_manage ON public.dynamic_routes USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: dynamic_routes dynamic_routes_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dynamic_routes_read ON public.dynamic_routes FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: event_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: event_registrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: extensions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;

--
-- Name: feedbacka_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feedbacka_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: feedbacka_submissions feedbacka_submissions_student_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feedbacka_submissions_student_insert ON public.feedbacka_submissions FOR INSERT TO authenticated WITH CHECK ((student_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: feedbacka_submissions feedbacka_submissions_student_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feedbacka_submissions_student_select ON public.feedbacka_submissions FOR SELECT TO authenticated USING (((student_id = (( SELECT auth.uid() AS uid))::text) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: feedbackas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feedbackas ENABLE ROW LEVEL SECURITY;

--
-- Name: feedbackas feedbackas_author_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feedbackas_author_all ON public.feedbackas TO authenticated USING (((author_id = (( SELECT auth.uid() AS uid))::text) OR ( SELECT public.app_is_privileged() AS app_is_privileged))) WITH CHECK (((author_id = (( SELECT auth.uid() AS uid))::text) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: feedbackas feedbackas_select_published; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY feedbackas_select_published ON public.feedbackas FOR SELECT TO authenticated USING ((status = 'published'::text));


--
-- Name: file_physio_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.file_physio_files ENABLE ROW LEVEL SECURITY;

--
-- Name: file_physio_folders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.file_physio_folders ENABLE ROW LEVEL SECURITY;

--
-- Name: firebase_supabase_mapping; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.firebase_supabase_mapping ENABLE ROW LEVEL SECURITY;

--
-- Name: function_backups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.function_backups ENABLE ROW LEVEL SECURITY;

--
-- Name: game_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.game_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: game_quest_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.game_quest_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: game_quests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.game_quests ENABLE ROW LEVEL SECURITY;

--
-- Name: game_xp_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.game_xp_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: gamification_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gamification_data ENABLE ROW LEVEL SECURITY;

--
-- Name: houses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

--
-- Name: import_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.import_users ENABLE ROW LEVEL SECURITY;

--
-- Name: push_outbox insert guest push; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "insert guest push" ON public.push_outbox FOR INSERT TO anon WITH CHECK ((user_id IS NULL));


--
-- Name: push_subscriptions insert guest subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "insert guest subscription" ON public.push_subscriptions FOR INSERT TO anon WITH CHECK ((user_id IS NULL));


--
-- Name: push_outbox insert own push; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "insert own push" ON public.push_outbox FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: push_subscriptions insert own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "insert own subscription" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_profiles insert_own_profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_own_profile ON public.user_profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: institution_offer_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.institution_offer_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: institutions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

--
-- Name: push_subscriptions manage own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "manage own subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: module_hours_budget; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.module_hours_budget ENABLE ROW LEVEL SECURITY;

--
-- Name: module_hours_budget module_hours_budget_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY module_hours_budget_privileged_write ON public.module_hours_budget TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: module_hours_budget module_hours_budget_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY module_hours_budget_select_all ON public.module_hours_budget FOR SELECT TO authenticated USING (true);


--
-- Name: modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

--
-- Name: modules modules_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY modules_select_policy ON public.modules FOR SELECT USING ((public.is_global_admin() OR public.can_access_track(track_id) OR public.is_rm_for_module(id) OR ((track_id IS NULL) AND (auth.uid() IS NOT NULL))));


--
-- Name: academic_tickets p0_academic_tickets_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_academic_tickets_select ON public.academic_tickets FOR SELECT TO authenticated USING ((( SELECT public.app_is_privileged() AS app_is_privileged) OR (created_by = ( SELECT auth.uid() AS uid)) OR (assigned_to = ( SELECT auth.uid() AS uid))));


--
-- Name: academic_tickets p0_academic_tickets_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_academic_tickets_write ON public.academic_tickets TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: user_profiles p0_authenticated_profile_directory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_profile_directory ON public.user_profiles FOR SELECT TO authenticated USING (true);


--
-- Name: capsule_assignments p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.capsule_assignments FOR SELECT TO authenticated USING (true);


--
-- Name: capsule_evaluations p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.capsule_evaluations FOR SELECT TO authenticated USING (true);


--
-- Name: capsule_learning_objectives p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.capsule_learning_objectives FOR SELECT TO authenticated USING (true);


--
-- Name: capsule_modules p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.capsule_modules FOR SELECT TO authenticated USING (true);


--
-- Name: capsule_prerequisites p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.capsule_prerequisites FOR SELECT TO authenticated USING (true);


--
-- Name: capsules p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.capsules FOR SELECT TO authenticated USING (true);


--
-- Name: classes p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.classes FOR SELECT TO authenticated USING (true);


--
-- Name: course_modules p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.course_modules FOR SELECT TO authenticated USING (true);


--
-- Name: modules p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.modules FOR SELECT TO authenticated USING (true);


--
-- Name: planning_cells p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.planning_cells FOR SELECT TO authenticated USING (true);


--
-- Name: planning_time_slots p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.planning_time_slots FOR SELECT TO authenticated USING (true);


--
-- Name: praticiens_formateurs p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.praticiens_formateurs FOR SELECT TO authenticated USING (true);


--
-- Name: quests p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.quests FOR SELECT TO authenticated USING (true);


--
-- Name: votation_sessions p0_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_authenticated_read ON public.votation_sessions FOR SELECT TO authenticated USING (true);


--
-- Name: capsules p0_capsules_author_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_capsules_author_write ON public.capsules TO authenticated USING (((author_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged))) WITH CHECK (((author_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: content_library p0_content_library_author_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_content_library_author_write ON public.content_library TO authenticated USING (((author_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged))) WITH CHECK (((author_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: content_library p0_content_library_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_content_library_select ON public.content_library FOR SELECT TO authenticated USING ((is_public OR (author_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: events p0_events_owner_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_events_owner_write ON public.events TO authenticated USING (((admin_uid = (( SELECT auth.uid() AS uid))::text) OR ( SELECT public.app_is_privileged() AS app_is_privileged))) WITH CHECK (((admin_uid = (( SELECT auth.uid() AS uid))::text) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: gamification_data p0_gamification_privileged; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_gamification_privileged ON public.gamification_data TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: gamification_data p0_gamification_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_gamification_select ON public.gamification_data FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: daily_wheel_spins p0_identity_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_read ON public.daily_wheel_spins FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: firebase_supabase_mapping p0_identity_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_read ON public.firebase_supabase_mapping FOR SELECT TO authenticated USING (((supabase_user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: profiles p0_identity_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_read ON public.profiles FOR SELECT TO authenticated USING (((id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: student_data p0_identity_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_read ON public.student_data FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: student_documents p0_identity_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_read ON public.student_documents FOR SELECT TO authenticated USING (((user_id = (( SELECT auth.uid() AS uid))::text) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: user_badges p0_identity_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_read ON public.user_badges FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: user_challenge_progress p0_identity_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_read ON public.user_challenge_progress FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: user_daily_spins p0_identity_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_read ON public.user_daily_spins FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: xp_history p0_identity_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_read ON public.xp_history FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: daily_wheel_spins p0_identity_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_write ON public.daily_wheel_spins TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: firebase_supabase_mapping p0_identity_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_write ON public.firebase_supabase_mapping TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: profiles p0_identity_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_write ON public.profiles TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: student_data p0_identity_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_write ON public.student_data TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: student_documents p0_identity_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_write ON public.student_documents TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: user_badges p0_identity_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_write ON public.user_badges TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: user_challenge_progress p0_identity_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_write ON public.user_challenge_progress TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: user_daily_spins p0_identity_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_write ON public.user_daily_spins TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: xp_history p0_identity_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_identity_write ON public.xp_history TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: institution_offer_tracking p0_offer_tracking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_offer_tracking ON public.institution_offer_tracking TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: capsule_feedback p0_owner_or_privileged; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_owner_or_privileged ON public.capsule_feedback TO authenticated USING (((student_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged))) WITH CHECK (((student_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: planning_slot_votes p0_owner_or_privileged; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_owner_or_privileged ON public.planning_slot_votes TO authenticated USING (((teacher_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged))) WITH CHECK (((teacher_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: recap_cpt_evaluation p0_owner_or_privileged; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_owner_or_privileged ON public.recap_cpt_evaluation TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: student_capsule_notes p0_owner_or_privileged; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_owner_or_privileged ON public.student_capsule_notes TO authenticated USING (((student_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged))) WITH CHECK (((student_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: student_capsule_progress p0_owner_or_privileged; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_owner_or_privileged ON public.student_capsule_progress TO authenticated USING (((student_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged))) WITH CHECK (((student_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: student_module_responses p0_owner_or_privileged; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_owner_or_privileged ON public.student_module_responses TO authenticated USING (((student_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged))) WITH CHECK (((student_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: user_quest_progress p0_owner_or_privileged; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_owner_or_privileged ON public.user_quest_progress TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: academic_years p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.academic_years TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: alpinphysio_members p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.alpinphysio_members TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: capsule_assignments p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.capsule_assignments TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: capsule_evaluations p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.capsule_evaluations TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: capsule_learning_objectives p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.capsule_learning_objectives TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: capsule_modules p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.capsule_modules TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: capsule_prerequisites p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.capsule_prerequisites TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: classes p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.classes TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: communities p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.communities TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: course_modules p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.course_modules TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: institutions p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.institutions TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: modules p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.modules TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: places p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.places TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: planning_cells p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.planning_cells TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: planning_time_slots p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.planning_time_slots TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: praticiens_formateurs p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.praticiens_formateurs TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: quests p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.quests TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: todos p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.todos TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: votation_sessions p0_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_privileged_write ON public.votation_sessions TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: quest_steps p0_quest_steps_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_quest_steps_select ON public.quest_steps FOR SELECT TO authenticated USING (true);


--
-- Name: quest_steps p0_quest_steps_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_quest_steps_write ON public.quest_steps TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: badges p0_reference_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_read ON public.badges FOR SELECT TO authenticated USING (true);


--
-- Name: calendar_cells p0_reference_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_read ON public.calendar_cells FOR SELECT TO authenticated USING (true);


--
-- Name: challenges p0_reference_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_read ON public.challenges FOR SELECT TO authenticated USING (true);


--
-- Name: course_teachers p0_reference_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_read ON public.course_teachers FOR SELECT TO authenticated USING (true);


--
-- Name: courses p0_reference_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_read ON public.courses FOR SELECT TO authenticated USING (true);


--
-- Name: dynamic_routes p0_reference_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_read ON public.dynamic_routes FOR SELECT TO authenticated USING (true);


--
-- Name: file_physio_files p0_reference_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_read ON public.file_physio_files FOR SELECT TO authenticated USING (true);


--
-- Name: file_physio_folders p0_reference_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_read ON public.file_physio_folders FOR SELECT TO authenticated USING (true);


--
-- Name: permissions p0_reference_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_read ON public.permissions FOR SELECT TO authenticated USING (true);


--
-- Name: roles p0_reference_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_read ON public.roles FOR SELECT TO authenticated USING (true);


--
-- Name: semesters p0_reference_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_read ON public.semesters FOR SELECT TO authenticated USING (true);


--
-- Name: structures p0_reference_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_read ON public.structures FOR SELECT TO authenticated USING (true);


--
-- Name: badges p0_reference_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_write ON public.badges TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: calendar_cells p0_reference_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_write ON public.calendar_cells TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: challenges p0_reference_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_write ON public.challenges TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: course_teachers p0_reference_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_write ON public.course_teachers TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: courses p0_reference_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_write ON public.courses TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: dynamic_routes p0_reference_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_write ON public.dynamic_routes TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: file_physio_files p0_reference_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_write ON public.file_physio_files TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: file_physio_folders p0_reference_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_write ON public.file_physio_folders TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: permissions p0_reference_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_write ON public.permissions TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: roles p0_reference_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_write ON public.roles TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: semesters p0_reference_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_write ON public.semesters TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: structures p0_reference_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_reference_write ON public.structures TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: RepondantPhysioHES p0_respondents_own_or_privileged; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_respondents_own_or_privileged ON public."RepondantPhysioHES" FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: StudentsPhysio p0_students_own_or_privileged; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_students_own_or_privileged ON public."StudentsPhysio" TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT public.app_is_privileged() AS app_is_privileged))) WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: user_profiles p0_user_profiles_update_own_or_privileged; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_user_profiles_update_own_or_privileged ON public.user_profiles FOR UPDATE TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT public.app_is_privileged() AS app_is_privileged))) WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: user_roles p0_user_roles_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_user_roles_read ON public.user_roles FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.app_is_privileged() AS app_is_privileged)));


--
-- Name: user_roles p0_user_roles_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY p0_user_roles_write ON public.user_roles TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: permissions permissions_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY permissions_manage ON public.permissions USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: permissions permissions_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY permissions_read ON public.permissions FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: places; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

--
-- Name: planning_cells; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.planning_cells ENABLE ROW LEVEL SECURITY;

--
-- Name: planning_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.planning_history ENABLE ROW LEVEL SECURITY;

--
-- Name: planning_history planning_history_privileged_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY planning_history_privileged_insert ON public.planning_history FOR INSERT TO authenticated WITH CHECK ((( SELECT public.app_is_privileged() AS app_is_privileged) AND ((changed_by IS NULL) OR (changed_by = ( SELECT auth.uid() AS uid)))));


--
-- Name: planning_history planning_history_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY planning_history_select_all ON public.planning_history FOR SELECT TO authenticated USING (true);


--
-- Name: planning_slot_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.planning_slot_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: planning_slot_votes planning_slot_votes_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY planning_slot_votes_select_auth ON public.planning_slot_votes FOR SELECT TO authenticated USING (true);


--
-- Name: planning_time_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.planning_time_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: planning_validations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.planning_validations ENABLE ROW LEVEL SECURITY;

--
-- Name: planning_validations planning_validations_privileged_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY planning_validations_privileged_insert ON public.planning_validations FOR INSERT TO authenticated WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: planning_validations planning_validations_privileged_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY planning_validations_privileged_update ON public.planning_validations FOR UPDATE TO authenticated USING (( SELECT public.app_is_privileged() AS app_is_privileged)) WITH CHECK (( SELECT public.app_is_privileged() AS app_is_privileged));


--
-- Name: planning_validations planning_validations_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY planning_validations_select_all ON public.planning_validations FOR SELECT TO authenticated USING (true);


--
-- Name: post_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

--
-- Name: posts posts_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY posts_insert_auth ON public.posts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: posts posts_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY posts_select_auth ON public.posts FOR SELECT TO authenticated USING (true);


--
-- Name: praticiens_formateurs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.praticiens_formateurs ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: push_outbox; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.push_outbox ENABLE ROW LEVEL SECURITY;

--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: quest_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quest_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: quests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

--
-- Name: dynamic_routes read active routes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "read active routes" ON public.dynamic_routes FOR SELECT TO anon, authenticated USING ((is_active = true));


--
-- Name: push_outbox read_own_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY read_own_notifications ON public.push_outbox FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (user_id IS NULL)));


--
-- Name: recap_cpt_evaluation; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recap_cpt_evaluation ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions role_permissions_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY role_permissions_manage ON public.role_permissions USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: role_permissions role_permissions_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY role_permissions_read ON public.role_permissions FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: roles roles_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY roles_manage ON public.roles USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: roles roles_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY roles_read ON public.roles FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: push_outbox select own push; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "select own push" ON public.push_outbox FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: push_subscriptions select own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "select own subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: semesters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

--
-- Name: structures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.structures ENABLE ROW LEVEL SECURITY;

--
-- Name: student_capsule_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_capsule_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: student_capsule_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_capsule_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: student_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_data ENABLE ROW LEVEL SECURITY;

--
-- Name: student_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: student_module_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_module_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: student_result_vote; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_result_vote ENABLE ROW LEVEL SECURITY;

--
-- Name: student_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: student_votes student_votes_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_votes_delete_own ON public.student_votes FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: student_votes student_votes_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_votes_insert_own ON public.student_votes FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: student_votes student_votes_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_votes_select_own ON public.student_votes FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: student_votes student_votes_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_votes_update_own ON public.student_votes FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: suivi_cas_particuliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suivi_cas_particuliers ENABLE ROW LEVEL SECURITY;

--
-- Name: suivi_cas_particuliers suivi_cas_particuliers_privileged_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY suivi_cas_particuliers_privileged_select ON public.suivi_cas_particuliers FOR SELECT TO authenticated USING (( SELECT public.app_can_manage_cases() AS app_can_manage_cases));


--
-- Name: suivi_cas_particuliers suivi_cas_particuliers_privileged_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY suivi_cas_particuliers_privileged_write ON public.suivi_cas_particuliers TO authenticated USING (( SELECT public.app_can_manage_cases() AS app_can_manage_cases)) WITH CHECK (( SELECT public.app_can_manage_cases() AS app_can_manage_cases));


--
-- Name: todos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

--
-- Name: institutions todos_anon_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY todos_anon_read ON public.institutions FOR SELECT TO anon USING (true);


--
-- Name: todos todos_anon_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY todos_anon_read ON public.todos FOR SELECT TO anon USING (true);


--
-- Name: institutions todos_anon_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY todos_anon_select ON public.institutions FOR SELECT TO anon USING (true);


--
-- Name: todos todos_anon_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY todos_anon_select ON public.todos FOR SELECT TO anon USING (true);


--
-- Name: institutions todos_auth_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY todos_auth_read ON public.institutions FOR SELECT TO authenticated USING (true);


--
-- Name: todos todos_auth_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY todos_auth_read ON public.todos FOR SELECT TO authenticated USING (true);


--
-- Name: institutions todos_auth_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY todos_auth_select ON public.institutions FOR SELECT TO authenticated USING (true);


--
-- Name: todos todos_auth_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY todos_auth_select ON public.todos FOR SELECT TO authenticated USING (true);


--
-- Name: tracks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

--
-- Name: tracks tracks_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tracks_select_all ON public.tracks FOR SELECT USING (true);


--
-- Name: push_subscriptions update guest subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "update guest subscription" ON public.push_subscriptions FOR UPDATE TO anon USING ((user_id IS NULL)) WITH CHECK ((user_id IS NULL));


--
-- Name: push_subscriptions update own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "update own subscription" ON public.push_subscriptions FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: push_outbox update_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_notifications ON public.push_outbox FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR (user_id IS NULL)));


--
-- Name: user_badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

--
-- Name: user_challenge_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: user_communities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_communities ENABLE ROW LEVEL SECURITY;

--
-- Name: user_communities user_communities_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_communities_delete_own ON public.user_communities FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_communities user_communities_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_communities_insert_own ON public.user_communities FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_communities user_communities_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_communities_select_own ON public.user_communities FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_daily_spins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_daily_spins ENABLE ROW LEVEL SECURITY;

--
-- Name: user_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_permissions user_permissions_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_permissions_manage ON public.user_permissions USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: user_permissions user_permissions_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_permissions_read ON public.user_permissions FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_quest_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_track_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_track_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: video_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_library ENABLE ROW LEVEL SECURITY;

--
-- Name: votation_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.votation_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: xp_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;

--
-- Name: student_capsule_progress Étudiants créent leur progression; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Étudiants créent leur progression" ON public.student_capsule_progress FOR INSERT WITH CHECK ((auth.uid() = student_id));


--
-- Name: student_capsule_progress Étudiants modifient leur progression; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Étudiants modifient leur progression" ON public.student_capsule_progress FOR UPDATE USING ((auth.uid() = student_id));


--
-- Name: capsules Étudiants voient capsules publiées; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Étudiants voient capsules publiées" ON public.capsules FOR SELECT USING ((((status)::text = 'published'::text) AND (is_public = true)));


--
-- Name: student_capsule_progress Étudiants voient leur progression; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Étudiants voient leur progression" ON public.student_capsule_progress FOR SELECT USING ((auth.uid() = student_id));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION _create_profile_from_import(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public._create_profile_from_import() FROM PUBLIC;
GRANT ALL ON FUNCTION public._create_profile_from_import() TO service_role;


--
-- Name: FUNCTION admin_create_user(user_email text, user_password text, user_forname text, user_family_name text, user_role text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.admin_create_user(user_email text, user_password text, user_forname text, user_family_name text, user_role text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_create_user(user_email text, user_password text, user_forname text, user_family_name text, user_role text) TO service_role;


--
-- Name: FUNCTION api_my_permissions(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.api_my_permissions() FROM PUBLIC;
GRANT ALL ON FUNCTION public.api_my_permissions() TO service_role;
GRANT ALL ON FUNCTION public.api_my_permissions() TO authenticated;


--
-- Name: FUNCTION api_my_track_permissions(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.api_my_track_permissions() FROM PUBLIC;
GRANT ALL ON FUNCTION public.api_my_track_permissions() TO service_role;
GRANT ALL ON FUNCTION public.api_my_track_permissions() TO authenticated;


--
-- Name: FUNCTION api_my_track_roles(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.api_my_track_roles() FROM PUBLIC;
GRANT ALL ON FUNCTION public.api_my_track_roles() TO service_role;
GRANT ALL ON FUNCTION public.api_my_track_roles() TO authenticated;


--
-- Name: FUNCTION app_can_manage_cases(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.app_can_manage_cases() FROM PUBLIC;
GRANT ALL ON FUNCTION public.app_can_manage_cases() TO service_role;
GRANT ALL ON FUNCTION public.app_can_manage_cases() TO authenticated;


--
-- Name: FUNCTION app_is_privileged(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.app_is_privileged() FROM PUBLIC;
GRANT ALL ON FUNCTION public.app_is_privileged() TO service_role;
GRANT ALL ON FUNCTION public.app_is_privileged() TO authenticated;


--
-- Name: FUNCTION assign_game_master(user_email text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.assign_game_master(user_email text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.assign_game_master(user_email text) TO service_role;


--
-- Name: FUNCTION assign_house_coach(user_email text, house_name text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.assign_house_coach(user_email text, house_name text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.assign_house_coach(user_email text, house_name text) TO service_role;


--
-- Name: TABLE gamification_data; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.gamification_data TO anon;
GRANT ALL ON TABLE public.gamification_data TO authenticated;
GRANT ALL ON TABLE public.gamification_data TO service_role;


--
-- Name: FUNCTION assign_my_house(p_house_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.assign_my_house(p_house_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.assign_my_house(p_house_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.assign_my_house(p_house_id uuid) TO authenticated;


--
-- Name: FUNCTION assign_quest_to_all_users(p_quest_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.assign_quest_to_all_users(p_quest_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.assign_quest_to_all_users(p_quest_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.assign_quest_to_all_users(p_quest_id uuid) TO authenticated;


--
-- Name: FUNCTION batch_upsert_student_results(p_results jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.batch_upsert_student_results(p_results jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.batch_upsert_student_results(p_results jsonb) TO service_role;


--
-- Name: FUNCTION can_access_track(p_track_id text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.can_access_track(p_track_id text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.can_access_track(p_track_id text) TO service_role;
GRANT ALL ON FUNCTION public.can_access_track(p_track_id text) TO authenticated;


--
-- Name: FUNCTION copy_previous_year_place_propositions(p_target_year text, p_pfp_type text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.copy_previous_year_place_propositions(p_target_year text, p_pfp_type text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.copy_previous_year_place_propositions(p_target_year text, p_pfp_type text) TO service_role;
GRANT ALL ON FUNCTION public.copy_previous_year_place_propositions(p_target_year text, p_pfp_type text) TO authenticated;


--
-- Name: FUNCTION count_votes(p_pfp_type text, p_year text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.count_votes(p_pfp_type text, p_year text) TO authenticated;


--
-- Name: FUNCTION create_capsule_with_modules(p_capsule_data jsonb, p_learning_objectives jsonb, p_modules jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.create_capsule_with_modules(p_capsule_data jsonb, p_learning_objectives jsonb, p_modules jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_capsule_with_modules(p_capsule_data jsonb, p_learning_objectives jsonb, p_modules jsonb) TO service_role;


--
-- Name: FUNCTION delete_capsule(p_capsule_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.delete_capsule(p_capsule_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.delete_capsule(p_capsule_id uuid) TO service_role;


--
-- Name: FUNCTION delete_student_vote(p_user_id uuid, p_pfp_type text, p_year text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.delete_student_vote(p_user_id uuid, p_pfp_type text, p_year text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.delete_student_vote(p_user_id uuid, p_pfp_type text, p_year text) TO service_role;
GRANT ALL ON FUNCTION public.delete_student_vote(p_user_id uuid, p_pfp_type text, p_year text) TO authenticated;


--
-- Name: FUNCTION delete_user(user_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.delete_user(user_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.delete_user(user_id uuid) TO service_role;


--
-- Name: FUNCTION duplicate_capsule(p_capsule_id uuid, p_new_title character varying); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.duplicate_capsule(p_capsule_id uuid, p_new_title character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION public.duplicate_capsule(p_capsule_id uuid, p_new_title character varying) TO service_role;


--
-- Name: FUNCTION find_user_email_by_name(p_name text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.find_user_email_by_name(p_name text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.find_user_email_by_name(p_name text) TO service_role;


--
-- Name: FUNCTION get_active_routes(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_active_routes() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_active_routes() TO service_role;


--
-- Name: FUNCTION get_algorithm_results(p_pfp_type text, p_year text, p_algorithm_run_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_algorithm_results(p_pfp_type text, p_year text, p_algorithm_run_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_algorithm_results(p_pfp_type text, p_year text, p_algorithm_run_id uuid) TO service_role;


--
-- Name: FUNCTION get_all_gamification_users(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_all_gamification_users() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_all_gamification_users() TO service_role;
GRANT ALL ON FUNCTION public.get_all_gamification_users() TO authenticated;


--
-- Name: FUNCTION get_all_student_votes(p_user_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_all_student_votes(p_user_id uuid) TO authenticated;


--
-- Name: FUNCTION get_capsule_complete(p_capsule_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_capsule_complete(p_capsule_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_capsule_complete(p_capsule_id uuid) TO service_role;


--
-- Name: FUNCTION get_daily_wheel_status(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_daily_wheel_status() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_daily_wheel_status() TO service_role;
GRANT ALL ON FUNCTION public.get_daily_wheel_status() TO authenticated;


--
-- Name: FUNCTION get_student_progress(p_capsule_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_student_progress(p_capsule_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_student_progress(p_capsule_id uuid) TO service_role;


--
-- Name: TABLE student_result_vote; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_result_vote TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_result_vote TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_result_vote TO service_role;


--
-- Name: FUNCTION get_student_result(p_user_id uuid, p_pfp_type text, p_year text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_student_result(p_user_id uuid, p_pfp_type text, p_year text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_student_result(p_user_id uuid, p_pfp_type text, p_year text) TO service_role;
GRANT ALL ON FUNCTION public.get_student_result(p_user_id uuid, p_pfp_type text, p_year text) TO authenticated;


--
-- Name: FUNCTION get_student_vote(p_user_id uuid, p_pfp_type text, p_year text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_student_vote(p_user_id uuid, p_pfp_type text, p_year text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_student_vote(p_user_id uuid, p_pfp_type text, p_year text) TO service_role;
GRANT ALL ON FUNCTION public.get_student_vote(p_user_id uuid, p_pfp_type text, p_year text) TO authenticated;


--
-- Name: FUNCTION get_top_voted_places(p_pfp_type text, p_year text, p_rank integer, p_limit integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_top_voted_places(p_pfp_type text, p_year text, p_rank integer, p_limit integer) TO authenticated;


--
-- Name: FUNCTION get_user_permissions(uid text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_user_permissions(uid text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_user_permissions(uid text) TO service_role;


--
-- Name: FUNCTION get_user_tracks(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_user_tracks() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_user_tracks() TO service_role;
GRANT ALL ON FUNCTION public.get_user_tracks() TO authenticated;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION has_any_track_role(p_track_id text, p_roles text[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.has_any_track_role(p_track_id text, p_roles text[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.has_any_track_role(p_track_id text, p_roles text[]) TO service_role;
GRANT ALL ON FUNCTION public.has_any_track_role(p_track_id text, p_roles text[]) TO authenticated;


--
-- Name: FUNCTION has_student_voted(p_user_id uuid, p_pfp_type text, p_year text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.has_student_voted(p_user_id uuid, p_pfp_type text, p_year text) TO authenticated;


--
-- Name: FUNCTION has_track_access(p_track_id character varying); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.has_track_access(p_track_id character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION public.has_track_access(p_track_id character varying) TO service_role;


--
-- Name: FUNCTION has_track_access_level(p_track_id text, p_min_role text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.has_track_access_level(p_track_id text, p_min_role text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.has_track_access_level(p_track_id text, p_min_role text) TO service_role;
GRANT ALL ON FUNCTION public.has_track_access_level(p_track_id text, p_min_role text) TO authenticated;


--
-- Name: FUNCTION has_track_role(p_track_id text, p_role text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.has_track_role(p_track_id text, p_role text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.has_track_role(p_track_id text, p_role text) TO service_role;
GRANT ALL ON FUNCTION public.has_track_role(p_track_id text, p_role text) TO authenticated;


--
-- Name: FUNCTION has_track_role(p_track_id character varying, p_role character varying); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.has_track_role(p_track_id character varying, p_role character varying) FROM PUBLIC;
GRANT ALL ON FUNCTION public.has_track_role(p_track_id character varying, p_role character varying) TO service_role;


--
-- Name: FUNCTION insert_spin_v2(p_user_id uuid, p_result_type text, p_prize_details jsonb, p_xp_gain integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.insert_spin_v2(p_user_id uuid, p_result_type text, p_prize_details jsonb, p_xp_gain integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.insert_spin_v2(p_user_id uuid, p_result_type text, p_prize_details jsonb, p_xp_gain integer) TO service_role;


--
-- Name: FUNCTION is_admin(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_admin() TO service_role;
GRANT ALL ON FUNCTION public.is_admin() TO authenticated;


--
-- Name: FUNCTION is_admin(email_param text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_admin(email_param text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_admin(email_param text) TO service_role;


--
-- Name: FUNCTION is_alpinphysio_admin(user_uid text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_alpinphysio_admin(user_uid text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_alpinphysio_admin(user_uid text) TO service_role;


--
-- Name: FUNCTION is_alpinphysio_member(user_uid text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_alpinphysio_member(user_uid text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_alpinphysio_member(user_uid text) TO service_role;


--
-- Name: FUNCTION is_global_admin(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_global_admin() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_global_admin() TO service_role;
GRANT ALL ON FUNCTION public.is_global_admin() TO authenticated;


--
-- Name: FUNCTION is_module_owner(user_email text, module_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_module_owner(user_email text, module_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_module_owner(user_email text, module_id uuid) TO service_role;


--
-- Name: FUNCTION is_rm_for_module(p_module_id integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_rm_for_module(p_module_id integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_rm_for_module(p_module_id integer) TO service_role;


--
-- Name: FUNCTION is_super_admin(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_super_admin() TO service_role;
GRANT ALL ON FUNCTION public.is_super_admin() TO authenticated;


--
-- Name: FUNCTION list_capsules(p_filters jsonb, p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.list_capsules(p_filters jsonb, p_limit integer, p_offset integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.list_capsules(p_filters jsonb, p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION promote_user_to_admin(user_email text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.promote_user_to_admin(user_email text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.promote_user_to_admin(user_email text) TO service_role;


--
-- Name: FUNCTION set_created_by_on_insert(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.set_created_by_on_insert() FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_created_by_on_insert() TO service_role;


--
-- Name: TABLE user_profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_profiles TO anon;
GRANT ALL ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_profiles TO service_role;


--
-- Name: COLUMN user_profiles.permissions; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(permissions) ON TABLE public.user_profiles TO anon;
GRANT UPDATE(permissions) ON TABLE public.user_profiles TO authenticated;


--
-- Name: FUNCTION set_user_profile_rbac(_email text, _role text, _is_active boolean, _permissions jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.set_user_profile_rbac(_email text, _role text, _is_active boolean, _permissions jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_user_profile_rbac(_email text, _role text, _is_active boolean, _permissions jsonb) TO service_role;


--
-- Name: FUNCTION spin_daily_wheel(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.spin_daily_wheel() FROM PUBLIC;
GRANT ALL ON FUNCTION public.spin_daily_wheel() TO service_role;
GRANT ALL ON FUNCTION public.spin_daily_wheel() TO authenticated;


--
-- Name: FUNCTION sync_module_responsable_email(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_module_responsable_email() FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_module_responsable_email() TO service_role;


--
-- Name: FUNCTION update_capsule(p_capsule_id uuid, p_updates jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.update_capsule(p_capsule_id uuid, p_updates jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_capsule(p_capsule_id uuid, p_updates jsonb) TO service_role;


--
-- Name: FUNCTION update_house_stats(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.update_house_stats() FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_house_stats() TO service_role;


--
-- Name: FUNCTION update_student_progress(p_capsule_id uuid, p_module_id uuid, p_progress_data jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.update_student_progress(p_capsule_id uuid, p_module_id uuid, p_progress_data jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_student_progress(p_capsule_id uuid, p_module_id uuid, p_progress_data jsonb) TO service_role;


--
-- Name: FUNCTION update_user_permissions(target_user_id text, new_permissions text[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.update_user_permissions(target_user_id text, new_permissions text[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_user_permissions(target_user_id text, new_permissions text[]) TO service_role;


--
-- Name: FUNCTION update_user_permissions(p_user_id uuid, p_permissions text[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.update_user_permissions(p_user_id uuid, p_permissions text[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_user_permissions(p_user_id uuid, p_permissions text[]) TO service_role;


--
-- Name: FUNCTION upsert_dynamic_routes(payload jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.upsert_dynamic_routes(payload jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.upsert_dynamic_routes(payload jsonb) TO service_role;


--
-- Name: FUNCTION upsert_module(p_capsule_id uuid, p_module_data jsonb, p_module_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.upsert_module(p_capsule_id uuid, p_module_data jsonb, p_module_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.upsert_module(p_capsule_id uuid, p_module_data jsonb, p_module_id uuid) TO service_role;


--
-- Name: FUNCTION upsert_student_result(p_user_id uuid, p_pfp_type text, p_year text, p_assigned_place_id text, p_assigned_place_name text, p_assigned_institution_name text, p_assigned_rank integer, p_algorithm_run_id uuid, p_original_choices jsonb, p_priority_score numeric, p_notes text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.upsert_student_result(p_user_id uuid, p_pfp_type text, p_year text, p_assigned_place_id text, p_assigned_place_name text, p_assigned_institution_name text, p_assigned_rank integer, p_algorithm_run_id uuid, p_original_choices jsonb, p_priority_score numeric, p_notes text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.upsert_student_result(p_user_id uuid, p_pfp_type text, p_year text, p_assigned_place_id text, p_assigned_place_name text, p_assigned_institution_name text, p_assigned_rank integer, p_algorithm_run_id uuid, p_original_choices jsonb, p_priority_score numeric, p_notes text) TO service_role;


--
-- Name: FUNCTION upsert_student_vote(p_user_id uuid, p_pfp_type text, p_year text, p_choices jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.upsert_student_vote(p_user_id uuid, p_pfp_type text, p_year text, p_choices jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.upsert_student_vote(p_user_id uuid, p_pfp_type text, p_year text, p_choices jsonb) TO service_role;
GRANT ALL ON FUNCTION public.upsert_student_vote(p_user_id uuid, p_pfp_type text, p_year text, p_choices jsonb) TO authenticated;


--
-- Name: FUNCTION user_has_permission(user_uid text, required_permission text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.user_has_permission(user_uid text, required_permission text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.user_has_permission(user_uid text, required_permission text) TO service_role;


--
-- Name: TABLE "RepondantPhysioHES"; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."RepondantPhysioHES" TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."RepondantPhysioHES" TO authenticated;


--
-- Name: TABLE "StudentsPhysio"; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."StudentsPhysio" TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public."StudentsPhysio" TO authenticated;
GRANT ALL ON TABLE public."StudentsPhysio" TO service_role;


--
-- Name: TABLE academic_tickets; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.academic_tickets TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.academic_tickets TO authenticated;
GRANT ALL ON TABLE public.academic_tickets TO service_role;


--
-- Name: TABLE academic_tickets_stats; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.academic_tickets_stats TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.academic_tickets_stats TO authenticated;
GRANT ALL ON TABLE public.academic_tickets_stats TO service_role;


--
-- Name: TABLE academic_years; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.academic_years TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.academic_years TO authenticated;
GRANT ALL ON TABLE public.academic_years TO service_role;


--
-- Name: TABLE admin_users; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.admin_users TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.admin_users TO authenticated;
GRANT ALL ON TABLE public.admin_users TO service_role;


--
-- Name: TABLE ai_usage_events; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.ai_usage_events TO authenticated;
GRANT ALL ON TABLE public.ai_usage_events TO service_role;


--
-- Name: TABLE alpinphysio_members; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.alpinphysio_members TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.alpinphysio_members TO authenticated;
GRANT ALL ON TABLE public.alpinphysio_members TO service_role;


--
-- Name: TABLE badges; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.badges TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.badges TO authenticated;
GRANT ALL ON TABLE public.badges TO service_role;


--
-- Name: TABLE buckets; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.buckets TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.buckets TO authenticated;


--
-- Name: TABLE calendar_cells; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.calendar_cells TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.calendar_cells TO authenticated;
GRANT ALL ON TABLE public.calendar_cells TO service_role;


--
-- Name: TABLE capsule_assignments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsule_assignments TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsule_assignments TO authenticated;
GRANT ALL ON TABLE public.capsule_assignments TO service_role;


--
-- Name: TABLE capsule_evaluations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsule_evaluations TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsule_evaluations TO authenticated;
GRANT ALL ON TABLE public.capsule_evaluations TO service_role;


--
-- Name: TABLE capsule_feedback; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsule_feedback TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsule_feedback TO authenticated;
GRANT ALL ON TABLE public.capsule_feedback TO service_role;


--
-- Name: TABLE capsule_learning_objectives; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsule_learning_objectives TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsule_learning_objectives TO authenticated;
GRANT ALL ON TABLE public.capsule_learning_objectives TO service_role;


--
-- Name: TABLE capsule_modules; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsule_modules TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsule_modules TO authenticated;
GRANT ALL ON TABLE public.capsule_modules TO service_role;


--
-- Name: TABLE capsule_prerequisites; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsule_prerequisites TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsule_prerequisites TO authenticated;
GRANT ALL ON TABLE public.capsule_prerequisites TO service_role;


--
-- Name: TABLE capsules; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsules TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsules TO authenticated;
GRANT ALL ON TABLE public.capsules TO service_role;


--
-- Name: TABLE capsules_with_stats; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsules_with_stats TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.capsules_with_stats TO authenticated;
GRANT ALL ON TABLE public.capsules_with_stats TO service_role;


--
-- Name: TABLE cas_particuliers_historique; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.cas_particuliers_historique TO anon;
GRANT ALL ON TABLE public.cas_particuliers_historique TO authenticated;
GRANT ALL ON TABLE public.cas_particuliers_historique TO service_role;


--
-- Name: TABLE challenges; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.challenges TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.challenges TO authenticated;
GRANT ALL ON TABLE public.challenges TO service_role;


--
-- Name: TABLE classes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.classes TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.classes TO authenticated;
GRANT ALL ON TABLE public.classes TO service_role;


--
-- Name: TABLE cohorts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.cohorts TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.cohorts TO authenticated;
GRANT ALL ON TABLE public.cohorts TO service_role;


--
-- Name: TABLE communities; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.communities TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.communities TO authenticated;
GRANT ALL ON TABLE public.communities TO service_role;


--
-- Name: TABLE content_library; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.content_library TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.content_library TO authenticated;
GRANT ALL ON TABLE public.content_library TO service_role;


--
-- Name: TABLE course_modules; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.course_modules TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.course_modules TO authenticated;
GRANT ALL ON TABLE public.course_modules TO service_role;


--
-- Name: SEQUENCE course_modules_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.course_modules_id_seq TO anon;
GRANT SELECT,USAGE ON SEQUENCE public.course_modules_id_seq TO authenticated;
GRANT SELECT,USAGE ON SEQUENCE public.course_modules_id_seq TO service_role;


--
-- Name: TABLE course_teachers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.course_teachers TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.course_teachers TO authenticated;
GRANT ALL ON TABLE public.course_teachers TO service_role;


--
-- Name: TABLE courses; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.courses TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.courses TO authenticated;
GRANT ALL ON TABLE public.courses TO service_role;


--
-- Name: TABLE daily_wheel_spins; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.daily_wheel_spins TO anon;
GRANT ALL ON TABLE public.daily_wheel_spins TO authenticated;
GRANT ALL ON TABLE public.daily_wheel_spins TO service_role;


--
-- Name: TABLE dynamic_routes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.dynamic_routes TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.dynamic_routes TO authenticated;
GRANT ALL ON TABLE public.dynamic_routes TO service_role;


--
-- Name: TABLE event_likes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_likes TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_likes TO authenticated;
GRANT ALL ON TABLE public.event_likes TO service_role;


--
-- Name: TABLE event_registrations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_registrations TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_registrations TO authenticated;
GRANT ALL ON TABLE public.event_registrations TO service_role;


--
-- Name: TABLE events; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.events TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.events TO authenticated;
GRANT ALL ON TABLE public.events TO service_role;


--
-- Name: TABLE events_with_counts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.events_with_counts TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.events_with_counts TO authenticated;
GRANT ALL ON TABLE public.events_with_counts TO service_role;


--
-- Name: TABLE extensions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.extensions TO service_role;


--
-- Name: TABLE feedbacka_submissions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.feedbacka_submissions TO anon;
GRANT ALL ON TABLE public.feedbacka_submissions TO authenticated;
GRANT ALL ON TABLE public.feedbacka_submissions TO service_role;


--
-- Name: TABLE feedbackas; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.feedbackas TO anon;
GRANT ALL ON TABLE public.feedbackas TO authenticated;
GRANT ALL ON TABLE public.feedbackas TO service_role;


--
-- Name: TABLE file_physio_files; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.file_physio_files TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.file_physio_files TO authenticated;
GRANT ALL ON TABLE public.file_physio_files TO service_role;


--
-- Name: TABLE file_physio_folders; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.file_physio_folders TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.file_physio_folders TO authenticated;
GRANT ALL ON TABLE public.file_physio_folders TO service_role;


--
-- Name: TABLE firebase_supabase_mapping; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.firebase_supabase_mapping TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.firebase_supabase_mapping TO authenticated;
GRANT ALL ON TABLE public.firebase_supabase_mapping TO service_role;


--
-- Name: SEQUENCE firebase_supabase_mapping_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.firebase_supabase_mapping_id_seq TO anon;
GRANT SELECT,USAGE ON SEQUENCE public.firebase_supabase_mapping_id_seq TO service_role;


--
-- Name: SEQUENCE function_backups_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.function_backups_id_seq TO anon;


--
-- Name: TABLE game_profiles; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.game_profiles TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.game_profiles TO authenticated;


--
-- Name: TABLE game_quest_progress; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.game_quest_progress TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.game_quest_progress TO authenticated;


--
-- Name: TABLE game_quests; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.game_quests TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.game_quests TO authenticated;


--
-- Name: TABLE game_xp_logs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.game_xp_logs TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.game_xp_logs TO authenticated;


--
-- Name: TABLE houses; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.houses TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.houses TO authenticated;
GRANT ALL ON TABLE public.houses TO service_role;


--
-- Name: TABLE house_leaderboard; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.house_leaderboard TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.house_leaderboard TO authenticated;
GRANT ALL ON TABLE public.house_leaderboard TO service_role;


--
-- Name: TABLE import_users; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.import_users TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.import_users TO authenticated;
GRANT ALL ON TABLE public.import_users TO service_role;


--
-- Name: TABLE institution_offer_tracking; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.institution_offer_tracking TO anon;
GRANT ALL ON TABLE public.institution_offer_tracking TO authenticated;
GRANT ALL ON TABLE public.institution_offer_tracking TO service_role;


--
-- Name: TABLE institutions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.institutions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.institutions TO authenticated;
GRANT ALL ON TABLE public.institutions TO service_role;


--
-- Name: TABLE module_hours_budget; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.module_hours_budget TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.module_hours_budget TO authenticated;


--
-- Name: TABLE modules; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.modules TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.modules TO authenticated;
GRANT ALL ON TABLE public.modules TO service_role;


--
-- Name: SEQUENCE modules_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.modules_id_seq TO anon;
GRANT SELECT,USAGE ON SEQUENCE public.modules_id_seq TO authenticated;
GRANT SELECT,USAGE ON SEQUENCE public.modules_id_seq TO service_role;


--
-- Name: TABLE permissions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.permissions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.permissions TO authenticated;
GRANT ALL ON TABLE public.permissions TO service_role;


--
-- Name: TABLE places; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.places TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.places TO authenticated;
GRANT ALL ON TABLE public.places TO service_role;


--
-- Name: TABLE planning_cells; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.planning_cells TO anon;
GRANT ALL ON TABLE public.planning_cells TO authenticated;
GRANT ALL ON TABLE public.planning_cells TO service_role;


--
-- Name: SEQUENCE planning_cells_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.planning_cells_id_seq TO anon;
GRANT SELECT,USAGE ON SEQUENCE public.planning_cells_id_seq TO authenticated;
GRANT SELECT,USAGE ON SEQUENCE public.planning_cells_id_seq TO service_role;


--
-- Name: TABLE planning_history; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.planning_history TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.planning_history TO authenticated;
GRANT ALL ON TABLE public.planning_history TO service_role;


--
-- Name: TABLE planning_slot_votes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.planning_slot_votes TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.planning_slot_votes TO authenticated;
GRANT SELECT,INSERT ON TABLE public.planning_slot_votes TO service_role;


--
-- Name: TABLE planning_time_slots; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.planning_time_slots TO anon;
GRANT ALL ON TABLE public.planning_time_slots TO authenticated;
GRANT ALL ON TABLE public.planning_time_slots TO service_role;


--
-- Name: SEQUENCE planning_time_slots_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.planning_time_slots_id_seq TO anon;
GRANT SELECT,USAGE ON SEQUENCE public.planning_time_slots_id_seq TO authenticated;
GRANT SELECT,USAGE ON SEQUENCE public.planning_time_slots_id_seq TO service_role;


--
-- Name: TABLE planning_validations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.planning_validations TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.planning_validations TO authenticated;


--
-- Name: TABLE user_badges; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_badges TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_badges TO authenticated;
GRANT ALL ON TABLE public.user_badges TO service_role;


--
-- Name: TABLE popular_badges; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.popular_badges TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.popular_badges TO authenticated;
GRANT ALL ON TABLE public.popular_badges TO service_role;


--
-- Name: TABLE post_media; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.post_media TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.post_media TO authenticated;
GRANT ALL ON TABLE public.post_media TO service_role;


--
-- Name: TABLE posts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.posts TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.posts TO authenticated;
GRANT ALL ON TABLE public.posts TO service_role;


--
-- Name: TABLE praticiens_formateurs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.praticiens_formateurs TO anon;
GRANT ALL ON TABLE public.praticiens_formateurs TO authenticated;


--
-- Name: SEQUENCE praticiens_formateurs_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.praticiens_formateurs_id_seq TO anon;
GRANT SELECT,USAGE ON SEQUENCE public.praticiens_formateurs_id_seq TO authenticated;


--
-- Name: SEQUENCE praticiens_formateurs_new_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.praticiens_formateurs_new_id_seq TO anon;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.profiles TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE push_outbox; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.push_outbox TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.push_outbox TO authenticated;
GRANT ALL ON TABLE public.push_outbox TO service_role;


--
-- Name: TABLE push_subscriptions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.push_subscriptions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.push_subscriptions TO authenticated;
GRANT ALL ON TABLE public.push_subscriptions TO service_role;


--
-- Name: TABLE quest_steps; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.quest_steps TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.quest_steps TO authenticated;
GRANT ALL ON TABLE public.quest_steps TO service_role;


--
-- Name: TABLE quests; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.quests TO anon;
GRANT ALL ON TABLE public.quests TO authenticated;
GRANT ALL ON TABLE public.quests TO service_role;


--
-- Name: TABLE recap_cpt_evaluation; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.recap_cpt_evaluation TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.recap_cpt_evaluation TO authenticated;


--
-- Name: SEQUENCE recap_cpt_evaluation_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.recap_cpt_evaluation_id_seq TO anon;
GRANT SELECT,USAGE ON SEQUENCE public.recap_cpt_evaluation_id_seq TO authenticated;


--
-- Name: TABLE responsable_stats; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.responsable_stats TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.responsable_stats TO authenticated;


--
-- Name: TABLE result_statistics; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.result_statistics TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.result_statistics TO authenticated;


--
-- Name: TABLE role_permissions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.role_permissions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.role_permissions TO authenticated;
GRANT ALL ON TABLE public.role_permissions TO service_role;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.roles TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.roles TO authenticated;
GRANT ALL ON TABLE public.roles TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.schema_migrations TO service_role;


--
-- Name: TABLE semesters; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.semesters TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.semesters TO authenticated;
GRANT ALL ON TABLE public.semesters TO service_role;


--
-- Name: TABLE structures; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.structures TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.structures TO authenticated;
GRANT ALL ON TABLE public.structures TO service_role;


--
-- Name: TABLE student_capsule_notes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_capsule_notes TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_capsule_notes TO authenticated;
GRANT ALL ON TABLE public.student_capsule_notes TO service_role;


--
-- Name: TABLE student_capsule_progress; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_capsule_progress TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_capsule_progress TO authenticated;
GRANT ALL ON TABLE public.student_capsule_progress TO service_role;


--
-- Name: TABLE student_data; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_data TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_data TO authenticated;
GRANT ALL ON TABLE public.student_data TO service_role;


--
-- Name: TABLE student_documents; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_documents TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_documents TO authenticated;
GRANT ALL ON TABLE public.student_documents TO service_role;


--
-- Name: SEQUENCE student_documents_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.student_documents_id_seq TO anon;
GRANT SELECT,USAGE ON SEQUENCE public.student_documents_id_seq TO service_role;


--
-- Name: TABLE student_module_responses; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_module_responses TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_module_responses TO authenticated;
GRANT ALL ON TABLE public.student_module_responses TO service_role;


--
-- Name: TABLE student_progress_details; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_progress_details TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_progress_details TO authenticated;
GRANT ALL ON TABLE public.student_progress_details TO service_role;


--
-- Name: TABLE student_votes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_votes TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_votes TO authenticated;


--
-- Name: TABLE studentsphysio_with_profiles; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.studentsphysio_with_profiles TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.studentsphysio_with_profiles TO authenticated;


--
-- Name: TABLE suivi_cas_particuliers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.suivi_cas_particuliers TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.suivi_cas_particuliers TO authenticated;


--
-- Name: SEQUENCE suivi_cas_particuliers_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.suivi_cas_particuliers_id_seq TO anon;


--
-- Name: TABLE todos; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.todos TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.todos TO authenticated;
GRANT ALL ON TABLE public.todos TO service_role;


--
-- Name: SEQUENCE todos_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.todos_id_seq TO anon;
GRANT SELECT,USAGE ON SEQUENCE public.todos_id_seq TO authenticated;
GRANT SELECT,USAGE ON SEQUENCE public.todos_id_seq TO service_role;


--
-- Name: TABLE tracks; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.tracks TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.tracks TO authenticated;


--
-- Name: TABLE user_challenge_progress; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_challenge_progress TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_challenge_progress TO authenticated;
GRANT ALL ON TABLE public.user_challenge_progress TO service_role;


--
-- Name: TABLE user_communities; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_communities TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_communities TO authenticated;
GRANT ALL ON TABLE public.user_communities TO service_role;


--
-- Name: TABLE user_daily_spins; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_daily_spins TO anon;
GRANT ALL ON TABLE public.user_daily_spins TO authenticated;
GRANT ALL ON TABLE public.user_daily_spins TO service_role;


--
-- Name: TABLE user_permissions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_permissions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_permissions TO authenticated;
GRANT ALL ON TABLE public.user_permissions TO service_role;


--
-- Name: TABLE user_quest_progress; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_quest_progress TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_quest_progress TO authenticated;
GRANT ALL ON TABLE public.user_quest_progress TO service_role;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_roles TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_roles TO authenticated;


--
-- Name: TABLE user_track_roles; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_track_roles TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_track_roles TO authenticated;
GRANT SELECT ON TABLE public.user_track_roles TO service_role;


--
-- Name: TABLE v_role_permissions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.v_role_permissions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.v_role_permissions TO authenticated;
GRANT ALL ON TABLE public.v_role_permissions TO service_role;


--
-- Name: TABLE video_library; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.video_library TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.video_library TO authenticated;
GRANT ALL ON TABLE public.video_library TO service_role;


--
-- Name: TABLE votation_sessions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.votation_sessions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.votation_sessions TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.votation_sessions TO service_role;


--
-- Name: TABLE vote_place_aggregation; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vote_place_aggregation TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vote_place_aggregation TO authenticated;


--
-- Name: TABLE vote_statistics; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vote_statistics TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vote_statistics TO authenticated;


--
-- Name: TABLE xp_history; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.xp_history TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.xp_history TO authenticated;
GRANT ALL ON TABLE public.xp_history TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES  TO anon;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES  TO authenticated;


--
-- PostgreSQL database dump complete
--
