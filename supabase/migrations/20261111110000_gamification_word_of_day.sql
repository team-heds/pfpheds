-- Mot du jour physio : un terme de physiothérapie ou d'anatomie à deviner en 6 essais,
-- le même pour tous les joueurs chaque jour (fuseau Europe/Zurich).
--
-- Principes :
--   - la liste de mots, le mot du jour et les essais vivent dans gamification_private :
--     RLS activée, aucun droit pour le navigateur, aucune policy ;
--   - le navigateur n'appelle que deux fonctions : lire sa partie, proposer un essai ;
--     tant que la partie n'est pas terminée, il ne reçoit que la longueur du mot et les
--     indices de chaque essai (C = bien placée, P = mal placée, A = absente) ;
--   - le mot et sa définition ne sont renvoyés qu'une fois la partie terminée ;
--   - une seule partie par joueur et par jour, 6 essais au plus, essais enregistrés un à un
--     (la partie reprend où elle en était si on quitte la page) ;
--   - XP décidés ici : 10 XP si le mot est trouvé, +5 XP s'il l'est en 3 essais ou moins,
--     une seule fois par jour (clé d'événement unique), comptés aussi pour la maison comme
--     tous les gains (gamification_award_xp_internal) ;
--   - réservé aux joueurs (gamification_private.is_rollout_member).
--
-- Relecture pédagogique : la liste des mots et des définitions se trouve à la fin de ce
-- fichier (section « Liste des mots »). Pour retirer un mot plus tard : is_active = false.

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

create table if not exists gamification_private.word_of_day_words (
  id integer generated always as identity primary key,
  word text not null unique,
  display_word text not null,
  definition text not null,
  theme text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint word_of_day_words_word_check check (word ~ '^[A-Z]{5,9}$'),
  constraint word_of_day_words_display_check
    check (char_length(display_word) = char_length(word)),
  constraint word_of_day_words_definition_check
    check (char_length(btrim(definition)) between 10 and 300)
);

create table if not exists gamification_private.word_of_day_schedule (
  play_date date primary key,
  word_id integer not null
    references gamification_private.word_of_day_words(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists word_of_day_schedule_word_idx
  on gamification_private.word_of_day_schedule (word_id);

create table if not exists gamification_private.word_of_day_guesses (
  user_id uuid not null
    references public.user_profiles(user_id) on delete cascade,
  play_date date not null
    references gamification_private.word_of_day_schedule(play_date) on delete restrict,
  attempt_no smallint not null,
  guess text not null,
  feedback text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  primary key (user_id, play_date, attempt_no),
  constraint word_of_day_guesses_attempt_check check (attempt_no between 1 and 6),
  constraint word_of_day_guesses_guess_check check (guess ~ '^[A-Z]{5,9}$'),
  constraint word_of_day_guesses_feedback_check
    check (feedback ~ '^[CPA]{5,9}$' and char_length(feedback) = char_length(guess)),
  constraint word_of_day_guesses_correct_check
    check (is_correct = (feedback ~ '^C+$'))
);

alter table gamification_private.word_of_day_words enable row level security;
alter table gamification_private.word_of_day_schedule enable row level security;
alter table gamification_private.word_of_day_guesses enable row level security;
revoke all on gamification_private.word_of_day_words from public, anon, authenticated;
revoke all on gamification_private.word_of_day_schedule from public, anon, authenticated;
revoke all on gamification_private.word_of_day_guesses from public, anon, authenticated;

-- Jour de jeu : la date du calendrier à Zurich (le mot change à minuit, heure suisse).
create or replace function gamification_private.word_of_day_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Zurich')::date;
$$;

-- Indices d'un essai : C = lettre bien placée, P = présente ailleurs, A = absente.
-- Une lettre n'est signalée « présente » qu'autant de fois qu'elle reste à placer.
create or replace function gamification_private.word_of_day_feedback(p_target text, p_guess text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_length integer := char_length(p_target);
  v_marks text[] := '{}'::text[];
  v_remaining text := '';
  v_position integer;
begin
  if p_target is null or p_guess is null or char_length(p_guess) <> v_length then
    raise exception 'Invalid word of day comparison';
  end if;

  for i in 1..v_length loop
    if substr(p_guess, i, 1) = substr(p_target, i, 1) then
      v_marks[i] := 'C';
    else
      v_marks[i] := 'A';
      v_remaining := v_remaining || substr(p_target, i, 1);
    end if;
  end loop;

  for i in 1..v_length loop
    if v_marks[i] = 'A' then
      v_position := strpos(v_remaining, substr(p_guess, i, 1));
      if v_position > 0 then
        v_marks[i] := 'P';
        v_remaining := overlay(v_remaining placing '' from v_position for 1);
      end if;
    end if;
  end loop;

  return array_to_string(v_marks, '');
end;
$$;

-- Mot du jour : tiré au sort une seule fois par date, parmi les mots actifs les moins
-- récemment joués (aucune répétition tant que la liste n'est pas épuisée).
create or replace function gamification_private.word_of_day_ensure(p_date date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_word_id integer;
begin
  select s.word_id into v_word_id
  from gamification_private.word_of_day_schedule s
  where s.play_date = p_date;
  if v_word_id is not null then
    return v_word_id;
  end if;

  perform pg_advisory_xact_lock(hashtext('gamification:word-of-day:schedule'));

  select s.word_id into v_word_id
  from gamification_private.word_of_day_schedule s
  where s.play_date = p_date;
  if v_word_id is not null then
    return v_word_id;
  end if;

  select w.id into v_word_id
  from gamification_private.word_of_day_words w
  where w.is_active
  order by (
    select max(s.play_date)
    from gamification_private.word_of_day_schedule s
    where s.word_id = w.id
  ) nulls first, random()
  limit 1;

  if v_word_id is null then
    raise exception 'No word available';
  end if;

  insert into gamification_private.word_of_day_schedule (play_date, word_id)
  values (p_date, v_word_id);

  return v_word_id;
end;
$$;

-- État complet de la partie du jour pour un joueur. La solution n'y figure que si la
-- partie est terminée.
create or replace function gamification_private.word_of_day_state(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := gamification_private.word_of_day_today();
  v_word gamification_private.word_of_day_words%rowtype;
  v_attempts jsonb;
  v_attempt_count integer;
  v_won boolean;
  v_status text;
  v_xp integer;
  v_played integer;
  v_wins integer;
  v_best integer;
  v_streak integer := 0;
  v_cursor date;
begin
  select w.* into v_word
  from gamification_private.word_of_day_words w
  where w.id = gamification_private.word_of_day_ensure(v_today);

  select
    coalesce(jsonb_agg(jsonb_build_object('guess', g.guess, 'feedback', g.feedback)
      order by g.attempt_no), '[]'::jsonb),
    count(*),
    coalesce(bool_or(g.is_correct), false)
  into v_attempts, v_attempt_count, v_won
  from gamification_private.word_of_day_guesses g
  where g.user_id = p_user_id and g.play_date = v_today;

  v_status := case
    when v_won then 'won'
    when v_attempt_count >= 6 then 'lost'
    else 'in_progress'
  end;

  select coalesce(sum(xh.amount), 0) into v_xp
  from public.xp_history xh
  where xh.user_id = p_user_id
    and xh.event_key = 'word-of-day:' || v_today::text;

  -- Parties jouées : terminées (trouvé ou 6 essais) ou abandonnées un jour passé.
  with games as (
    select g.play_date, bool_or(g.is_correct) as won, count(*) as attempts
    from gamification_private.word_of_day_guesses g
    where g.user_id = p_user_id
    group by g.play_date
  ),
  finished as (
    select * from games gm
    where gm.won or gm.attempts >= 6 or gm.play_date < v_today
  ),
  islands as (
    select f.play_date,
           f.play_date - (row_number() over (order by f.play_date))::integer as island
    from finished f
    where f.won
  )
  select
    (select count(*) from finished),
    (select count(*) from finished f where f.won),
    coalesce((select max(i.days) from (
      select count(*) as days from islands group by island
    ) i), 0)
  into v_played, v_wins, v_best;

  -- Série en cours : jours consécutifs avec le mot trouvé, jusqu'à aujourd'hui, ou
  -- jusqu'à hier tant que la partie du jour n'est pas terminée.
  if v_status <> 'lost' then
    v_cursor := case when v_status = 'won' then v_today else v_today - 1 end;
    while exists (
      select 1 from gamification_private.word_of_day_guesses g
      where g.user_id = p_user_id and g.play_date = v_cursor and g.is_correct
    ) loop
      v_streak := v_streak + 1;
      v_cursor := v_cursor - 1;
    end loop;
  end if;

  return jsonb_build_object(
    'eligible', true,
    'play_date', v_today,
    'word_length', char_length(v_word.word),
    'max_attempts', 6,
    'attempts', v_attempts,
    'status', v_status,
    'xp_awarded', v_xp,
    'solution', case
      when v_status = 'in_progress' then null
      else jsonb_build_object(
        'word', v_word.display_word,
        'definition', v_word.definition,
        'theme', v_word.theme
      )
    end,
    'stats', jsonb_build_object(
      'played', v_played,
      'won', v_wins,
      'win_rate', case when v_played > 0 then round(100.0 * v_wins / v_played)::integer else 0 end,
      'current_streak', v_streak,
      'best_streak', greatest(v_best, v_streak)
    )
  );
end;
$$;

-- Lecture de sa partie du jour (reprise après avoir quitté la page).
create or replace function public.get_my_word_of_day()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not gamification_private.is_rollout_member(v_user_id) then
    return jsonb_build_object('eligible', false, 'reason', 'audience_restricted');
  end if;

  return gamification_private.word_of_day_state(v_user_id);
end;
$$;

-- Proposition d'un essai. Le serveur compare, enregistre, et attribue les XP si le mot
-- est trouvé. La réponse ne contient jamais le mot tant que la partie continue.
create or replace function public.submit_my_word_of_day_guess(p_guess text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_today date := gamification_private.word_of_day_today();
  v_target text;
  v_guess text;
  v_feedback text;
  v_attempt_count integer;
  v_won boolean;
  v_correct boolean;
  v_amount integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not gamification_private.is_rollout_member(v_user_id) then
    raise exception 'Word of day not open for this account';
  end if;

  select w.word into v_target
  from gamification_private.word_of_day_words w
  where w.id = gamification_private.word_of_day_ensure(v_today);

  v_guess := upper(translate(
    btrim(coalesce(p_guess, '')),
    'àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ',
    'aaaeeeeiioouuucAAAEEEEIIOOUUUC'
  ));
  if v_guess !~ '^[A-Z]+$' or char_length(v_guess) <> char_length(v_target) then
    raise exception 'Invalid guess';
  end if;

  -- Un essai à la fois par joueur : le compteur lu reste exact jusqu'à l'écriture.
  perform pg_advisory_xact_lock(hashtext('gamification:word-of-day:' || v_user_id::text));

  select count(*), coalesce(bool_or(g.is_correct), false)
  into v_attempt_count, v_won
  from gamification_private.word_of_day_guesses g
  where g.user_id = v_user_id and g.play_date = v_today;

  if v_won or v_attempt_count >= 6 then
    raise exception 'Word of day already finished';
  end if;

  v_feedback := gamification_private.word_of_day_feedback(v_target, v_guess);
  v_correct := v_guess = v_target;

  insert into gamification_private.word_of_day_guesses (
    user_id, play_date, attempt_no, guess, feedback, is_correct
  ) values (
    v_user_id, v_today, v_attempt_count + 1, v_guess, v_feedback, v_correct
  );

  if v_correct and coalesce((
    select rc.rewards_enabled
    from gamification_private.rollout_config rc
    where rc.singleton
  ), false) then
    v_amount := 10 + case when v_attempt_count + 1 <= 3 then 5 else 0 end;
    perform public.gamification_award_xp_internal(
      v_user_id,
      'WORD_OF_DAY',
      v_amount,
      'word-of-day:' || v_today::text,
      'word_of_day',
      null,
      case
        when v_attempt_count + 1 <= 3 then 'Mot du jour trouvé en 3 essais ou moins'
        else 'Mot du jour trouvé'
      end
    );
  end if;

  return gamification_private.word_of_day_state(v_user_id);
end;
$$;

revoke all on function gamification_private.word_of_day_today() from public, anon, authenticated;
revoke all on function gamification_private.word_of_day_feedback(text, text) from public, anon, authenticated;
revoke all on function gamification_private.word_of_day_ensure(date) from public, anon, authenticated;
revoke all on function gamification_private.word_of_day_state(uuid) from public, anon, authenticated;
revoke all on function public.get_my_word_of_day() from public, anon;
revoke all on function public.submit_my_word_of_day_guess(text) from public, anon;
grant execute on function public.get_my_word_of_day() to authenticated;
grant execute on function public.submit_my_word_of_day_guess(text) to authenticated;

-- ---------------------------------------------------------------------------------------
-- Liste des mots (relecture pédagogique)
-- Colonnes : mot saisi (sans accents), mot affiché, définition montrée en fin de partie, thème.
-- ---------------------------------------------------------------------------------------
insert into gamification_private.word_of_day_words (word, display_word, definition, theme)
values
  ('FEMUR', 'Fémur', 'Os de la cuisse, le plus long et le plus solide du corps humain.', 'Os et repères osseux'),
  ('TIBIA', 'Tibia', 'Os principal de la jambe, du côté médial, qui porte le poids du corps.', 'Os et repères osseux'),
  ('FIBULA', 'Fibula', 'Os fin et latéral de la jambe, anciennement péroné ; son extrémité forme la malléole latérale.', 'Os et repères osseux'),
  ('PATELLA', 'Patella', 'Os sésamoïde à l''avant du genou, dans le tendon du quadriceps ; anciennement rotule.', 'Os et repères osseux'),
  ('HUMERUS', 'Humérus', 'Os unique du bras, entre l''épaule et le coude.', 'Os et repères osseux'),
  ('RADIUS', 'Radius', 'Os latéral de l''avant-bras, du côté du pouce ; il tourne autour de l''ulna en prono-supination.', 'Os et repères osseux'),
  ('SCAPULA', 'Scapula', 'Os plat et triangulaire à l''arrière du thorax, anciennement omoplate.', 'Os et repères osseux'),
  ('STERNUM', 'Sternum', 'Os plat au milieu de la face antérieure du thorax, où s''articulent les clavicules et les côtes.', 'Os et repères osseux'),
  ('SACRUM', 'Sacrum', 'Os triangulaire formé de cinq vertèbres soudées, entre les deux os coxaux.', 'Os et repères osseux'),
  ('COCCYX', 'Coccyx', 'Petit os terminal de la colonne vertébrale, sous le sacrum.', 'Os et repères osseux'),
  ('TALUS', 'Talus', 'Os du tarse qui s''articule avec le tibia et la fibula pour former la cheville ; anciennement astragale.', 'Os et repères osseux'),
  ('VERTEBRE', 'Vertèbre', 'Os de la colonne vertébrale ; l''empilement des vertèbres protège la moelle épinière.', 'Os et repères osseux'),
  ('ATLAS', 'Atlas', 'Première vertèbre cervicale (C1), qui supporte la tête.', 'Os et repères osseux'),
  ('CARPE', 'Carpe', 'Ensemble des huit petits os du poignet.', 'Os et repères osseux'),
  ('TARSE', 'Tarse', 'Ensemble des sept os de l''arrière-pied, dont le talus et le calcanéus.', 'Os et repères osseux'),
  ('PHALANGE', 'Phalange', 'Os des doigts et des orteils.', 'Os et repères osseux'),
  ('CLAVICULE', 'Clavicule', 'Os allongé en forme de S qui relie le sternum à la scapula.', 'Os et repères osseux'),
  ('MANDIBULE', 'Mandibule', 'Os de la mâchoire inférieure, seul os mobile du crâne.', 'Os et repères osseux'),
  ('CALCANEUS', 'Calcanéus', 'Os du talon, le plus volumineux du tarse.', 'Os et repères osseux'),
  ('CUBOIDE', 'Cuboïde', 'Os latéral du tarse, en avant du calcanéus.', 'Os et repères osseux'),
  ('SCAPHOIDE', 'Scaphoïde', 'Os du carpe situé du côté du pouce, souvent fracturé lors d''une chute sur la main.', 'Os et repères osseux'),
  ('LUNATUM', 'Lunatum', 'Os central de la première rangée du carpe, anciennement semi-lunaire.', 'Os et repères osseux'),
  ('ILIUM', 'Ilium', 'Partie supérieure et évasée de l''os coxal ; son bord supérieur forme la crête iliaque.', 'Os et repères osseux'),
  ('ISCHION', 'Ischion', 'Partie postéro-inférieure de l''os coxal, sur laquelle on s''assoit.', 'Os et repères osseux'),
  ('PUBIS', 'Pubis', 'Partie antérieure de l''os coxal ; les deux pubis se rejoignent à la symphyse pubienne.', 'Os et repères osseux'),
  ('BASSIN', 'Bassin', 'Ceinture osseuse formée par les deux os coxaux et le sacrum ; elle transmet le poids du tronc aux membres inférieurs.', 'Os et repères osseux'),
  ('CRANE', 'Crâne', 'Boîte osseuse qui protège l''encéphale.', 'Os et repères osseux'),
  ('THORAX', 'Thorax', 'Partie du tronc entre le cou et l''abdomen, qui contient le cœur et les poumons.', 'Os et repères osseux'),
  ('RACHIS', 'Rachis', 'Autre nom de la colonne vertébrale.', 'Os et repères osseux'),
  ('HYOIDE', 'Hyoïde', 'Petit os en fer à cheval à l''avant du cou, qui ne s''articule avec aucun autre os.', 'Os et repères osseux'),
  ('ACROMION', 'Acromion', 'Prolongement de l''épine de la scapula, qui forme le sommet de l''épaule.', 'Os et repères osseux'),
  ('OLECRANE', 'Olécrane', 'Saillie de l''ulna qui forme la pointe du coude.', 'Os et repères osseux'),
  ('MALLEOLE', 'Malléole', 'Saillie osseuse de chaque côté de la cheville.', 'Os et repères osseux'),
  ('CONDYLE', 'Condyle', 'Surface articulaire arrondie à l''extrémité d''un os, comme celles du fémur au genou.', 'Os et repères osseux'),
  ('EPIPHYSE', 'Épiphyse', 'Extrémité d''un os long, recouverte de cartilage articulaire.', 'Os et repères osseux'),
  ('DIAPHYSE', 'Diaphyse', 'Partie moyenne, allongée, d''un os long.', 'Os et repères osseux'),
  ('PERIOSTE', 'Périoste', 'Membrane fibreuse qui entoure l''os et participe à sa croissance et à sa consolidation.', 'Os et repères osseux'),
  ('TROCHLEE', 'Trochlée', 'Surface articulaire en forme de poulie, par exemple à l''extrémité distale de l''humérus.', 'Os et repères osseux'),
  ('GLENE', 'Glène', 'Cavité articulaire peu profonde, comme celle de la scapula qui reçoit la tête de l''humérus.', 'Os et repères osseux'),
  ('COTYLE', 'Cotyle', 'Cavité de l''os coxal qui reçoit la tête du fémur ; aussi appelée acétabulum.', 'Os et repères osseux'),
  ('APOPHYSE', 'Apophyse', 'Saillie osseuse qui sert souvent d''insertion à un muscle ou à un ligament ; aussi appelée processus.', 'Os et repères osseux'),
  ('TUBERCULE', 'Tubercule', 'Petite saillie osseuse arrondie où s''insèrent des tendons ou des ligaments.', 'Os et repères osseux'),
  ('METATARSE', 'Métatarse', 'Partie du pied formée de cinq os longs, entre le tarse et les orteils.', 'Os et repères osseux'),
  ('METACARPE', 'Métacarpe', 'Partie de la main formée de cinq os longs, entre le carpe et les doigts.', 'Os et repères osseux'),
  ('SQUELETTE', 'Squelette', 'Ensemble des os du corps ; charpente qui soutient et protège.', 'Os et repères osseux'),
  ('ORTEIL', 'Orteil', 'Doigt du pied.', 'Régions du corps'),
  ('POUCE', 'Pouce', 'Premier doigt de la main, opposable aux autres.', 'Régions du corps'),
  ('HALLUX', 'Hallux', 'Nom anatomique du gros orteil.', 'Régions du corps'),
  ('COUDE', 'Coude', 'Articulation entre le bras et l''avant-bras.', 'Régions du corps'),
  ('GENOU', 'Genou', 'Articulation entre la cuisse et la jambe, qui réunit le fémur, le tibia et la patella.', 'Régions du corps'),
  ('HANCHE', 'Hanche', 'Articulation entre le bassin et le fémur (coxo-fémorale).', 'Régions du corps'),
  ('EPAULE', 'Épaule', 'Région qui relie le bras au tronc ; son articulation principale est la gléno-humérale.', 'Régions du corps'),
  ('POIGNET', 'Poignet', 'Région articulaire entre l''avant-bras et la main.', 'Régions du corps'),
  ('CHEVILLE', 'Cheville', 'Articulation entre la jambe et le pied.', 'Régions du corps'),
  ('TALON', 'Talon', 'Partie postérieure du pied, formée par le calcanéus.', 'Régions du corps'),
  ('NUQUE', 'Nuque', 'Partie postérieure du cou.', 'Régions du corps'),
  ('LOMBES', 'Lombes', 'Région du bas du dos, entre les côtes et le bassin.', 'Régions du corps'),
  ('CUISSE', 'Cuisse', 'Segment du membre inférieur entre la hanche et le genou.', 'Régions du corps'),
  ('JAMBE', 'Jambe', 'Segment du membre inférieur entre le genou et la cheville.', 'Régions du corps'),
  ('MOLLET', 'Mollet', 'Partie postérieure charnue de la jambe, formée par le triceps sural.', 'Régions du corps'),
  ('AISSELLE', 'Aisselle', 'Creux situé sous l''épaule, traversé par les vaisseaux et les nerfs du membre supérieur.', 'Régions du corps'),
  ('ABDOMEN', 'Abdomen', 'Partie du tronc entre le thorax et le bassin.', 'Régions du corps'),
  ('PERINEE', 'Périnée', 'Ensemble des muscles et des tissus qui ferment le bas du bassin ; aussi appelé plancher pelvien.', 'Régions du corps'),
  ('PELVIS', 'Pelvis', 'Autre nom du bassin.', 'Régions du corps'),
  ('TRONC', 'Tronc', 'Partie centrale du corps, sans la tête ni les membres.', 'Régions du corps'),
  ('PAUME', 'Paume', 'Face antérieure de la main.', 'Régions du corps'),
  ('MUSCLE', 'Muscle', 'Organe capable de se contracter pour produire un mouvement ou maintenir une posture.', 'Muscles et tissus'),
  ('TENDON', 'Tendon', 'Structure fibreuse qui relie un muscle à un os.', 'Muscles et tissus'),
  ('LIGAMENT', 'Ligament', 'Bande fibreuse qui relie deux os et stabilise une articulation.', 'Muscles et tissus'),
  ('FASCIA', 'Fascia', 'Enveloppe de tissu conjonctif qui entoure les muscles et les organes.', 'Muscles et tissus'),
  ('DELTOIDE', 'Deltoïde', 'Muscle de l''épaule, principal abducteur du bras.', 'Muscles et tissus'),
  ('BICEPS', 'Biceps', 'Muscle à deux chefs ; au bras, il fléchit le coude et participe à la supination.', 'Muscles et tissus'),
  ('TRICEPS', 'Triceps', 'Muscle à trois chefs ; au bras, il étend le coude.', 'Muscles et tissus'),
  ('TRAPEZE', 'Trapèze', 'Muscle large et superficiel du haut du dos et de la nuque, qui mobilise la scapula.', 'Muscles et tissus'),
  ('PSOAS', 'Psoas', 'Muscle profond qui relie les vertèbres lombaires au fémur ; fléchisseur de la hanche.', 'Muscles et tissus'),
  ('SOLEAIRE', 'Soléaire', 'Muscle profond du mollet, fléchisseur plantaire de la cheville, très actif en station debout.', 'Muscles et tissus'),
  ('PECTORAL', 'Pectoral', 'Muscle de la face antérieure du thorax ; le grand pectoral rapproche le bras du tronc et le tourne vers l''intérieur.', 'Muscles et tissus'),
  ('DENTELE', 'Dentelé', 'Le dentelé antérieur plaque la scapula contre le thorax et la fait glisser vers l''avant.', 'Muscles et tissus'),
  ('RHOMBOIDE', 'Rhomboïde', 'Muscle situé entre la colonne et la scapula, qu''il rapproche de la ligne médiane.', 'Muscles et tissus'),
  ('SARTORIUS', 'Sartorius', 'Muscle le plus long du corps, qui croise la cuisse en diagonale ; anciennement couturier.', 'Muscles et tissus'),
  ('GRACILE', 'Gracile', 'Muscle fin de la face médiale de la cuisse, adducteur de la hanche et fléchisseur du genou.', 'Muscles et tissus'),
  ('POPLITE', 'Poplité', 'Petit muscle de l''arrière du genou, qui « déverrouille » le genou au début de la flexion.', 'Muscles et tissus'),
  ('PIRIFORME', 'Piriforme', 'Muscle profond de la fesse, rotateur latéral de la hanche, voisin du nerf sciatique.', 'Muscles et tissus'),
  ('ILIAQUE', 'Iliaque', 'Muscle logé dans la fosse iliaque, qui fléchit la hanche avec le psoas.', 'Muscles et tissus'),
  ('FESSIER', 'Fessier', 'Muscle de la fesse ; le grand fessier est le principal extenseur de la hanche.', 'Muscles et tissus'),
  ('MASSETER', 'Masséter', 'Muscle puissant de la mastication, qui ferme la mâchoire.', 'Muscles et tissus'),
  ('SPLENIUS', 'Splénius', 'Muscle de la nuque qui étend et tourne la tête.', 'Muscles et tissus'),
  ('SCALENE', 'Scalène', 'Muscle latéral du cou, inspirateur accessoire, tendu entre les vertèbres cervicales et les premières côtes.', 'Muscles et tissus'),
  ('OBLIQUE', 'Oblique', 'Muscle de la paroi abdominale qui participe à la rotation et à l''inclinaison du tronc.', 'Muscles et tissus'),
  ('ANCONE', 'Anconé', 'Petit muscle de la face postérieure du coude, qui aide le triceps à l''étendre.', 'Muscles et tissus'),
  ('PRONATEUR', 'Pronateur', 'Muscle qui tourne l''avant-bras pour amener la paume vers le bas.', 'Muscles et tissus'),
  ('EXTENSEUR', 'Extenseur', 'Muscle dont la contraction ouvre l''angle d''une articulation.', 'Muscles et tissus'),
  ('ADDUCTEUR', 'Adducteur', 'Muscle qui rapproche un membre de l''axe du corps.', 'Muscles et tissus'),
  ('ABDUCTEUR', 'Abducteur', 'Muscle qui écarte un membre de l''axe du corps.', 'Muscles et tissus'),
  ('ROTATEUR', 'Rotateur', 'Muscle qui fait tourner un segment autour de son axe ; la coiffe des rotateurs stabilise l''épaule.', 'Muscles et tissus'),
  ('ERECTEUR', 'Érecteur', 'Les érecteurs du rachis sont les muscles profonds du dos qui redressent la colonne.', 'Muscles et tissus'),
  ('COIFFE', 'Coiffe', 'Ensemble de quatre tendons qui entourent la tête de l''humérus et stabilisent l''épaule.', 'Muscles et tissus'),
  ('AGONISTE', 'Agoniste', 'Muscle principal responsable d''un mouvement.', 'Muscles et tissus'),
  ('SYNERGIE', 'Synergie', 'Action coordonnée de plusieurs muscles pour réaliser un même mouvement.', 'Muscles et tissus'),
  ('SARCOMERE', 'Sarcomère', 'Unité contractile de la fibre musculaire, délimitée par deux stries Z.', 'Muscles et tissus'),
  ('MYOSINE', 'Myosine', 'Protéine des filaments épais du muscle, qui tire sur l''actine pour produire la contraction.', 'Muscles et tissus'),
  ('ACTINE', 'Actine', 'Protéine des filaments fins du muscle, sur laquelle se fixe la myosine.', 'Muscles et tissus'),
  ('MYOCARDE', 'Myocarde', 'Muscle du cœur.', 'Muscles et tissus'),
  ('TONUS', 'Tonus', 'Légère tension permanente d''un muscle au repos.', 'Muscles et tissus'),
  ('FIBRE', 'Fibre', 'Cellule musculaire allongée ; il en existe des lentes (type I) et des rapides (type II).', 'Muscles et tissus'),
  ('INSERTION', 'Insertion', 'Point d''attache d''un muscle sur un os.', 'Muscles et tissus'),
  ('CAPSULE', 'Capsule', 'Enveloppe fibreuse qui entoure une articulation.', 'Muscles et tissus'),
  ('SYNOVIE', 'Synovie', 'Liquide qui lubrifie l''articulation et nourrit le cartilage.', 'Muscles et tissus'),
  ('CARTILAGE', 'Cartilage', 'Tissu lisse et élastique qui recouvre les surfaces articulaires.', 'Muscles et tissus'),
  ('MENISQUE', 'Ménisque', 'Fibrocartilage en forme de croissant du genou, qui amortit et stabilise.', 'Muscles et tissus'),
  ('BOURSE', 'Bourse', 'Petite poche de liquide qui facilite le glissement d''un tendon ou d''un muscle sur l''os.', 'Muscles et tissus'),
  ('DISQUE', 'Disque', 'Coussin fibrocartilagineux situé entre deux vertèbres.', 'Muscles et tissus'),
  ('LABRUM', 'Labrum', 'Bourrelet fibrocartilagineux qui agrandit la cavité articulaire de l''épaule ou de la hanche.', 'Muscles et tissus'),
  ('SYMPHYSE', 'Symphyse', 'Articulation peu mobile unie par du fibrocartilage, comme la symphyse pubienne.', 'Muscles et tissus'),
  ('SUTURE', 'Suture', 'Articulation immobile entre les os du crâne.', 'Muscles et tissus'),
  ('COLLAGENE', 'Collagène', 'Protéine principale des tendons, des ligaments et du cartilage.', 'Muscles et tissus'),
  ('ELASTINE', 'Élastine', 'Protéine qui donne leur élasticité aux tissus.', 'Muscles et tissus'),
  ('TISSU', 'Tissu', 'Ensemble de cellules semblables qui assurent une même fonction.', 'Muscles et tissus'),
  ('CELLULE', 'Cellule', 'Plus petite unité vivante de l''organisme.', 'Muscles et tissus'),
  ('DERME', 'Derme', 'Couche profonde de la peau, sous l''épiderme.', 'Muscles et tissus'),
  ('EPIDERME', 'Épiderme', 'Couche superficielle de la peau.', 'Muscles et tissus'),
  ('MOELLE', 'Moelle', 'La moelle épinière transmet les messages entre le cerveau et le corps ; la moelle osseuse fabrique les cellules du sang.', 'Muscles et tissus'),
  ('SURAL', 'Sural', 'Qui se rapporte au mollet, comme le triceps sural ou le nerf sural.', 'Orientation et vocabulaire anatomique'),
  ('PLANTAIRE', 'Plantaire', 'Qui se rapporte à la plante du pied.', 'Orientation et vocabulaire anatomique'),
  ('PALMAIRE', 'Palmaire', 'Qui se rapporte à la paume de la main.', 'Orientation et vocabulaire anatomique'),
  ('DORSAL', 'Dorsal', 'Qui se rapporte au dos ou à la face postérieure ; le grand dorsal est le muscle le plus large du dos.', 'Orientation et vocabulaire anatomique'),
  ('LOMBAIRE', 'Lombaire', 'Qui se rapporte au bas du dos ; il y a cinq vertèbres lombaires.', 'Orientation et vocabulaire anatomique'),
  ('CERVICAL', 'Cervical', 'Qui se rapporte au cou ; il y a sept vertèbres cervicales.', 'Orientation et vocabulaire anatomique'),
  ('CRURAL', 'Crural', 'Qui se rapporte à la cuisse.', 'Orientation et vocabulaire anatomique'),
  ('BRACHIAL', 'Brachial', 'Qui se rapporte au bras ; le muscle brachial fléchit le coude.', 'Orientation et vocabulaire anatomique'),
  ('RADIAL', 'Radial', 'Qui se rapporte au radius ou au côté du pouce de l''avant-bras.', 'Orientation et vocabulaire anatomique'),
  ('ULNAIRE', 'Ulnaire', 'Qui se rapporte à l''ulna, du côté du petit doigt de l''avant-bras.', 'Orientation et vocabulaire anatomique'),
  ('FEMORAL', 'Fémoral', 'Qui se rapporte à la cuisse ou au fémur, comme le nerf fémoral.', 'Orientation et vocabulaire anatomique'),
  ('TIBIAL', 'Tibial', 'Qui se rapporte au tibia ; le muscle tibial antérieur relève le pied.', 'Orientation et vocabulaire anatomique'),
  ('FIBULAIRE', 'Fibulaire', 'Qui se rapporte à la fibula ; les muscles fibulaires stabilisent la cheville du côté latéral.', 'Orientation et vocabulaire anatomique'),
  ('MEDIAL', 'Médial', 'Situé du côté de la ligne médiane du corps.', 'Orientation et vocabulaire anatomique'),
  ('LATERAL', 'Latéral', 'Situé du côté opposé à la ligne médiane du corps.', 'Orientation et vocabulaire anatomique'),
  ('PROXIMAL', 'Proximal', 'Plus proche de la racine du membre ou du tronc.', 'Orientation et vocabulaire anatomique'),
  ('DISTAL', 'Distal', 'Plus éloigné de la racine du membre ou du tronc.', 'Orientation et vocabulaire anatomique'),
  ('VENTRAL', 'Ventral', 'Situé du côté antérieur du corps.', 'Orientation et vocabulaire anatomique'),
  ('CAUDAL', 'Caudal', 'Dirigé vers le bas du tronc, vers le coccyx.', 'Orientation et vocabulaire anatomique'),
  ('CRANIAL', 'Crânial', 'Dirigé vers la tête.', 'Orientation et vocabulaire anatomique'),
  ('SAGITTAL', 'Sagittal', 'Plan vertical qui sépare le corps en parties droite et gauche ; plan de la flexion et de l''extension.', 'Orientation et vocabulaire anatomique'),
  ('FRONTAL', 'Frontal', 'Plan vertical qui sépare le corps en parties avant et arrière ; plan de l''abduction et de l''adduction.', 'Orientation et vocabulaire anatomique'),
  ('AXIAL', 'Axial', 'Qui se rapporte à l''axe du corps : tête, colonne et thorax.', 'Orientation et vocabulaire anatomique'),
  ('FLEXION', 'Flexion', 'Mouvement qui ferme l''angle d''une articulation.', 'Mouvement et biomécanique'),
  ('EXTENSION', 'Extension', 'Mouvement qui ouvre l''angle d''une articulation.', 'Mouvement et biomécanique'),
  ('ABDUCTION', 'Abduction', 'Mouvement qui écarte un membre de l''axe du corps.', 'Mouvement et biomécanique'),
  ('ADDUCTION', 'Adduction', 'Mouvement qui rapproche un membre de l''axe du corps.', 'Mouvement et biomécanique'),
  ('ROTATION', 'Rotation', 'Mouvement d''un segment autour de son axe longitudinal.', 'Mouvement et biomécanique'),
  ('PRONATION', 'Pronation', 'Rotation de l''avant-bras qui amène la paume vers le bas.', 'Mouvement et biomécanique'),
  ('INVERSION', 'Inversion', 'Mouvement du pied qui oriente la plante vers l''intérieur.', 'Mouvement et biomécanique'),
  ('EVERSION', 'Éversion', 'Mouvement du pied qui oriente la plante vers l''extérieur.', 'Mouvement et biomécanique'),
  ('ELEVATION', 'Élévation', 'Mouvement vers le haut, par exemple de la scapula ou du bras.', 'Mouvement et biomécanique'),
  ('ROULEMENT', 'Roulement', 'Mouvement d''une surface articulaire qui roule sur l''autre, associé au glissement.', 'Mouvement et biomécanique'),
  ('AMPLITUDE', 'Amplitude', 'Étendue du mouvement possible dans une articulation.', 'Mouvement et biomécanique'),
  ('MOBILITE', 'Mobilité', 'Capacité d''une articulation ou d''une personne à bouger.', 'Mouvement et biomécanique'),
  ('STABILITE', 'Stabilité', 'Capacité d''une articulation à rester centrée et contrôlée pendant le mouvement.', 'Mouvement et biomécanique'),
  ('POSTURE', 'Posture', 'Position du corps et de ses segments, maintenue contre la gravité.', 'Mouvement et biomécanique'),
  ('EQUILIBRE', 'Équilibre', 'Capacité à maintenir le centre de masse au-dessus de la base d''appui.', 'Mouvement et biomécanique'),
  ('MARCHE', 'Marche', 'Mode de déplacement qui alterne phase d''appui et phase oscillante.', 'Mouvement et biomécanique'),
  ('FOULEE', 'Foulée', 'En course, mouvement et distance entre deux appuis successifs.', 'Mouvement et biomécanique'),
  ('CADENCE', 'Cadence', 'Nombre de pas par minute.', 'Mouvement et biomécanique'),
  ('APPUI', 'Appui', 'Phase de la marche où le pied est en contact avec le sol.', 'Mouvement et biomécanique'),
  ('BOITERIE', 'Boiterie', 'Marche irrégulière ou asymétrique, souvent liée à une douleur ou à une faiblesse.', 'Mouvement et biomécanique'),
  ('TRANSFERT', 'Transfert', 'Passage d''une position ou d''un support à un autre, par exemple du lit au fauteuil.', 'Mouvement et biomécanique'),
  ('LEVIER', 'Levier', 'Système où une force agit autour d''un point d''appui ; les os et les articulations en forment.', 'Mouvement et biomécanique'),
  ('COUPLE', 'Couple', 'Effet de rotation produit par une force appliquée à distance d''un axe ; aussi appelé moment.', 'Mouvement et biomécanique'),
  ('FORCE', 'Force', 'Capacité d''un muscle à produire une tension ; elle se mesure en newtons.', 'Mouvement et biomécanique'),
  ('CHARGE', 'Charge', 'Contrainte mécanique imposée aux tissus ; son dosage progressif est au cœur de la rééducation.', 'Mouvement et biomécanique'),
  ('PUISSANCE', 'Puissance', 'Produit de la force par la vitesse.', 'Mouvement et biomécanique'),
  ('ENDURANCE', 'Endurance', 'Capacité à maintenir un effort dans la durée.', 'Mouvement et biomécanique'),
  ('SOUPLESSE', 'Souplesse', 'Capacité des muscles et des articulations à permettre de grandes amplitudes.', 'Mouvement et biomécanique'),
  ('RAIDEUR', 'Raideur', 'Limitation de l''amplitude articulaire ou résistance accrue au mouvement.', 'Mouvement et biomécanique'),
  ('LAXITE', 'Laxité', 'Jeu excessif d''une articulation, par distension des ligaments ou de la capsule.', 'Mouvement et biomécanique'),
  ('INERTIE', 'Inertie', 'Résistance d''un corps au changement de son état de mouvement.', 'Mouvement et biomécanique'),
  ('GRAVITE', 'Gravité', 'Force d''attraction terrestre, contre laquelle travaillent les muscles posturaux.', 'Mouvement et biomécanique'),
  ('PIVOT', 'Pivot', 'Rotation du corps sur un pied en appui ; ce mouvement sollicite fortement les ligaments du genou.', 'Mouvement et biomécanique'),
  ('SQUAT', 'Squat', 'Exercice de flexion et d''extension des hanches et des genoux, en appui sur les deux pieds.', 'Évaluation, exercices et techniques'),
  ('FENTE', 'Fente', 'Exercice de renforcement avec un pied en avant et une flexion des deux genoux.', 'Évaluation, exercices et techniques'),
  ('GAINAGE', 'Gainage', 'Exercice de maintien qui renforce les muscles stabilisateurs du tronc.', 'Évaluation, exercices et techniques'),
  ('PLANCHE', 'Planche', 'Exercice de gainage en appui sur les avant-bras et les pieds, corps aligné.', 'Évaluation, exercices et techniques'),
  ('ETIREMENT', 'Étirement', 'Mise en tension d''un muscle pour entretenir ou gagner de la souplesse.', 'Évaluation, exercices et techniques'),
  ('MASSAGE', 'Massage', 'Technique manuelle de mobilisation des tissus mous.', 'Évaluation, exercices et techniques'),
  ('FRICTION', 'Friction', 'Technique de massage appuyée et localisée, par exemple sur un tendon.', 'Évaluation, exercices et techniques'),
  ('DRAINAGE', 'Drainage', 'Technique douce qui favorise la circulation de la lymphe pour réduire un gonflement.', 'Évaluation, exercices et techniques'),
  ('TRACTION', 'Traction', 'Force d''étirement appliquée dans l''axe d''un segment ou de la colonne.', 'Évaluation, exercices et techniques'),
  ('ATTELLE', 'Attelle', 'Dispositif externe qui immobilise ou soutient une articulation.', 'Évaluation, exercices et techniques'),
  ('ORTHESE', 'Orthèse', 'Appareillage qui soutient, corrige ou stabilise une partie du corps.', 'Évaluation, exercices et techniques'),
  ('PROTHESE', 'Prothèse', 'Dispositif qui remplace un membre ou une articulation.', 'Évaluation, exercices et techniques'),
  ('BEQUILLE', 'Béquille', 'Aide de marche qui décharge un membre inférieur.', 'Évaluation, exercices et techniques'),
  ('CANNE', 'Canne', 'Aide de marche, tenue en général du côté opposé au membre atteint.', 'Évaluation, exercices et techniques'),
  ('ROLLATOR', 'Rollator', 'Déambulateur à roulettes qui sécurise la marche.', 'Évaluation, exercices et techniques'),
  ('BANDAGE', 'Bandage', 'Bande appliquée pour comprimer, soutenir ou protéger une région.', 'Évaluation, exercices et techniques'),
  ('STRAPPING', 'Strapping', 'Contention adhésive qui limite un mouvement douloureux ou à risque.', 'Évaluation, exercices et techniques'),
  ('TAPING', 'Taping', 'Application de bandes adhésives sur la peau pour soutenir une articulation ou un muscle.', 'Évaluation, exercices et techniques'),
  ('PLATRE', 'Plâtre', 'Contention rigide utilisée pour immobiliser une fracture.', 'Évaluation, exercices et techniques'),
  ('ULTRASON', 'Ultrason', 'Onde mécanique de haute fréquence utilisée en physiothérapie et en imagerie.', 'Évaluation, exercices et techniques'),
  ('ELECTRODE', 'Électrode', 'Conducteur posé sur la peau pour transmettre un courant de stimulation ou recueillir un signal.', 'Évaluation, exercices et techniques'),
  ('CHALEUR', 'Chaleur', 'Agent physique utilisé pour détendre les muscles et augmenter la circulation locale.', 'Évaluation, exercices et techniques'),
  ('GLACE', 'Glace', 'Application de froid, utilisée pour diminuer la douleur après un traumatisme.', 'Évaluation, exercices et techniques'),
  ('BILAN', 'Bilan', 'Évaluation du patient au début et au cours du traitement : douleur, mobilité, force, fonction.', 'Évaluation, exercices et techniques'),
  ('TESTING', 'Testing', 'Évaluation manuelle de la force d''un muscle, cotée de 0 à 5.', 'Évaluation, exercices et techniques'),
  ('PALPATION', 'Palpation', 'Examen des structures anatomiques par le toucher.', 'Évaluation, exercices et techniques'),
  ('ANAMNESE', 'Anamnèse', 'Recueil de l''histoire du patient et de ses symptômes par l''entretien.', 'Évaluation, exercices et techniques'),
  ('AUTONOMIE', 'Autonomie', 'Capacité d''une personne à décider et à réaliser seule ses activités.', 'Évaluation, exercices et techniques'),
  ('EXERCICE', 'Exercice', 'Mouvement ou activité prescrit et dosé dans un but thérapeutique.', 'Évaluation, exercices et techniques'),
  ('SERIE', 'Série', 'Groupe de répétitions d''un exercice réalisées sans pause.', 'Évaluation, exercices et techniques'),
  ('DOSAGE', 'Dosage', 'Réglage de l''intensité, du volume et de la fréquence d''un exercice.', 'Évaluation, exercices et techniques'),
  ('PODOMETRE', 'Podomètre', 'Appareil qui compte les pas.', 'Évaluation, exercices et techniques'),
  ('OXYMETRE', 'Oxymètre', 'Appareil qui mesure la saturation du sang en oxygène, souvent au bout du doigt.', 'Évaluation, exercices et techniques'),
  ('ERGONOMIE', 'Ergonomie', 'Adaptation du travail et de l''environnement aux capacités de la personne.', 'Évaluation, exercices et techniques'),
  ('HANDICAP', 'Handicap', 'Limitation d''activité ou restriction de participation, née de l''interaction entre une déficience et l''environnement.', 'Évaluation, exercices et techniques'),
  ('EMPATHIE', 'Empathie', 'Capacité à comprendre ce que ressent le patient, essentielle à la relation de soin.', 'Évaluation, exercices et techniques'),
  ('PLACEBO', 'Placebo', 'Effet bénéfique lié aux attentes du patient et au contexte du soin, et non au traitement lui-même.', 'Évaluation, exercices et techniques'),
  ('NOCEBO', 'Nocebo', 'Effet négatif lié aux attentes défavorables du patient.', 'Évaluation, exercices et techniques'),
  ('SYMPTOME', 'Symptôme', 'Manifestation ressentie et décrite par le patient.', 'Évaluation, exercices et techniques'),
  ('SIGNE', 'Signe', 'Manifestation observée par le soignant lors de l''examen.', 'Évaluation, exercices et techniques'),
  ('SYNDROME', 'Syndrome', 'Ensemble de signes et de symptômes qui apparaissent ensemble.', 'Évaluation, exercices et techniques'),
  ('PRONOSTIC', 'Pronostic', 'Prévision de l''évolution d''une maladie ou d''une blessure.', 'Évaluation, exercices et techniques'),
  ('CHRONIQUE', 'Chronique', 'Qui dure dans le temps ; pour la douleur, au-delà de trois mois.', 'Évaluation, exercices et techniques'),
  ('ANTALGIE', 'Antalgie', 'Diminution ou suppression de la douleur.', 'Évaluation, exercices et techniques'),
  ('ENTORSE', 'Entorse', 'Lésion d''un ligament par étirement ou déchirure, fréquente à la cheville.', 'Pathologies et symptômes'),
  ('LUXATION', 'Luxation', 'Perte de contact complète entre les surfaces d''une articulation.', 'Pathologies et symptômes'),
  ('FRACTURE', 'Fracture', 'Rupture de la continuité d''un os.', 'Pathologies et symptômes'),
  ('FELURE', 'Fêlure', 'Fracture incomplète, sans déplacement.', 'Pathologies et symptômes'),
  ('TENDINITE', 'Tendinite', 'Douleur d''un tendon liée à une surcharge ; on parle aujourd''hui plutôt de tendinopathie.', 'Pathologies et symptômes'),
  ('BURSITE', 'Bursite', 'Inflammation d''une bourse séreuse, par exemple à l''épaule ou au coude.', 'Pathologies et symptômes'),
  ('ARTHROSE', 'Arthrose', 'Usure progressive du cartilage articulaire, avec douleur et raideur.', 'Pathologies et symptômes'),
  ('ARTHRITE', 'Arthrite', 'Inflammation d''une articulation.', 'Pathologies et symptômes'),
  ('SCOLIOSE', 'Scoliose', 'Déformation de la colonne dans les trois plans, avec rotation des vertèbres.', 'Pathologies et symptômes'),
  ('CYPHOSE', 'Cyphose', 'Courbure de la colonne à convexité postérieure, physiologique au niveau thoracique.', 'Pathologies et symptômes'),
  ('LORDOSE', 'Lordose', 'Courbure de la colonne à concavité postérieure, physiologique aux niveaux cervical et lombaire.', 'Pathologies et symptômes'),
  ('LUMBAGO', 'Lumbago', 'Douleur lombaire aiguë, d''apparition souvent brutale.', 'Pathologies et symptômes'),
  ('LOMBALGIE', 'Lombalgie', 'Douleur de la région lombaire.', 'Pathologies et symptômes'),
  ('SCIATIQUE', 'Sciatique', 'Douleur qui irradie le long du trajet du nerf sciatique, de la fesse vers le pied.', 'Pathologies et symptômes'),
  ('HERNIE', 'Hernie', 'Saillie d''un tissu hors de sa place ; la hernie discale peut comprimer une racine nerveuse.', 'Pathologies et symptômes'),
  ('CRAMPE', 'Crampe', 'Contraction musculaire involontaire, brutale et douloureuse.', 'Pathologies et symptômes'),
  ('CLAQUAGE', 'Claquage', 'Déchirure de fibres musculaires survenue lors d''un effort.', 'Pathologies et symptômes'),
  ('CONTUSION', 'Contusion', 'Lésion des tissus par un choc, sans plaie.', 'Pathologies et symptômes'),
  ('HEMATOME', 'Hématome', 'Collection de sang dans un tissu après la rupture de vaisseaux.', 'Pathologies et symptômes'),
  ('ATROPHIE', 'Atrophie', 'Diminution du volume d''un muscle, par exemple après une immobilisation.', 'Pathologies et symptômes'),
  ('SPASME', 'Spasme', 'Contraction musculaire involontaire.', 'Pathologies et symptômes'),
  ('CLONUS', 'Clonus', 'Série de contractions rythmiques involontaires, déclenchées par l''étirement brusque d''un muscle.', 'Pathologies et symptômes'),
  ('PARESIE', 'Parésie', 'Diminution partielle de la force musculaire, d''origine neurologique.', 'Pathologies et symptômes'),
  ('PARALYSIE', 'Paralysie', 'Perte de la motricité volontaire d''un ou de plusieurs muscles.', 'Pathologies et symptômes'),
  ('ATAXIE', 'Ataxie', 'Trouble de la coordination des mouvements, sans perte de force.', 'Pathologies et symptômes'),
  ('APRAXIE', 'Apraxie', 'Difficulté à réaliser un geste appris, sans paralysie.', 'Pathologies et symptômes'),
  ('APHASIE', 'Aphasie', 'Trouble du langage acquis après une lésion cérébrale.', 'Pathologies et symptômes'),
  ('DYSPNEE', 'Dyspnée', 'Sensation de difficulté à respirer.', 'Pathologies et symptômes'),
  ('APNEE', 'Apnée', 'Arrêt temporaire de la respiration.', 'Pathologies et symptômes'),
  ('ASTHME', 'Asthme', 'Maladie inflammatoire chronique des bronches, avec des crises de gêne respiratoire.', 'Pathologies et symptômes'),
  ('VERTIGE', 'Vertige', 'Sensation erronée de rotation ou de déplacement du corps ou de l''espace.', 'Pathologies et symptômes'),
  ('SYNCOPE', 'Syncope', 'Perte de connaissance brève, due à une baisse du débit sanguin cérébral.', 'Pathologies et symptômes'),
  ('ALGIE', 'Algie', 'Douleur, quelle que soit sa cause.', 'Pathologies et symptômes'),
  ('DOULEUR', 'Douleur', 'Expérience sensorielle et émotionnelle désagréable, associée ou non à une lésion.', 'Pathologies et symptômes'),
  ('NEVRALGIE', 'Névralgie', 'Douleur sur le trajet d''un nerf.', 'Pathologies et symptômes'),
  ('MYALGIE', 'Myalgie', 'Douleur musculaire.', 'Pathologies et symptômes'),
  ('ESCARRE', 'Escarre', 'Lésion de la peau due à une pression prolongée, chez une personne peu mobile.', 'Pathologies et symptômes'),
  ('CICATRICE', 'Cicatrice', 'Tissu fibreux qui remplace la peau après une plaie.', 'Pathologies et symptômes'),
  ('FIBROSE', 'Fibrose', 'Formation excessive de tissu fibreux dans un organe ou un tissu.', 'Pathologies et symptômes'),
  ('NECROSE', 'Nécrose', 'Mort d''un tissu.', 'Pathologies et symptômes'),
  ('ISCHEMIE', 'Ischémie', 'Diminution de l''apport sanguin à un tissu.', 'Pathologies et symptômes'),
  ('THROMBOSE', 'Thrombose', 'Formation d''un caillot dans un vaisseau sanguin.', 'Pathologies et symptômes'),
  ('PHLEBITE', 'Phlébite', 'Thrombose d''une veine, le plus souvent au mollet.', 'Pathologies et symptômes'),
  ('VARICE', 'Varice', 'Veine dilatée et tortueuse, surtout aux membres inférieurs.', 'Pathologies et symptômes'),
  ('CHUTE', 'Chute', 'Événement fréquent chez la personne âgée ; sa prévention passe par l''équilibre et la force.', 'Pathologies et symptômes'),
  ('RUPTURE', 'Rupture', 'Déchirure complète d''un tendon, d''un ligament ou d''un muscle.', 'Pathologies et symptômes'),
  ('LESION', 'Lésion', 'Altération d''un tissu ou d''un organe.', 'Pathologies et symptômes'),
  ('TRAUMA', 'Trauma', 'Lésion provoquée par un agent extérieur ; abréviation de traumatisme.', 'Pathologies et symptômes'),
  ('ANKYLOSE', 'Ankylose', 'Perte complète ou presque complète de la mobilité d''une articulation.', 'Pathologies et symptômes'),
  ('HYPOTONIE', 'Hypotonie', 'Diminution du tonus musculaire.', 'Pathologies et symptômes'),
  ('DYSTONIE', 'Dystonie', 'Contractions musculaires involontaires et prolongées, qui entraînent des postures anormales.', 'Pathologies et symptômes'),
  ('MYOPATHIE', 'Myopathie', 'Maladie du muscle.', 'Pathologies et symptômes'),
  ('COXALGIE', 'Coxalgie', 'Douleur de la hanche.', 'Pathologies et symptômes'),
  ('GONALGIE', 'Gonalgie', 'Douleur du genou.', 'Pathologies et symptômes'),
  ('TALALGIE', 'Talalgie', 'Douleur du talon.', 'Pathologies et symptômes'),
  ('OSTEITE', 'Ostéite', 'Infection ou inflammation de l''os.', 'Pathologies et symptômes'),
  ('CAPSULITE', 'Capsulite', 'Inflammation et rétraction de la capsule de l''épaule, dite « épaule gelée ».', 'Pathologies et symptômes'),
  ('SYNOVITE', 'Synovite', 'Inflammation de la membrane synoviale.', 'Pathologies et symptômes'),
  ('GOUTTE', 'Goutte', 'Arthrite due à des cristaux d''acide urique, qui touche souvent le gros orteil.', 'Pathologies et symptômes'),
  ('KYSTE', 'Kyste', 'Cavité fermée contenant du liquide, par exemple le kyste poplité à l''arrière du genou.', 'Pathologies et symptômes'),
  ('SEQUELLE', 'Séquelle', 'Trouble qui persiste après la guérison d''une maladie ou d''une blessure.', 'Pathologies et symptômes'),
  ('RECIDIVE', 'Récidive', 'Réapparition d''une blessure ou d''une maladie après la guérison.', 'Pathologies et symptômes'),
  ('NEURONE', 'Neurone', 'Cellule nerveuse qui produit et transmet l''influx nerveux.', 'Système nerveux'),
  ('SYNAPSE', 'Synapse', 'Zone de communication entre deux neurones, ou entre un neurone et un muscle.', 'Système nerveux'),
  ('AXONE', 'Axone', 'Prolongement du neurone qui conduit l''influx vers d''autres cellules.', 'Système nerveux'),
  ('DENDRITE', 'Dendrite', 'Prolongement du neurone qui reçoit les messages d''autres neurones.', 'Système nerveux'),
  ('MYELINE', 'Myéline', 'Gaine isolante qui entoure certains axones et accélère la conduction nerveuse.', 'Système nerveux'),
  ('REFLEXE', 'Réflexe', 'Réponse motrice involontaire et rapide à un stimulus.', 'Système nerveux'),
  ('CERVEAU', 'Cerveau', 'Partie la plus volumineuse de l''encéphale, siège de la motricité volontaire et de la cognition.', 'Système nerveux'),
  ('CERVELET', 'Cervelet', 'Structure située à l''arrière de l''encéphale, essentielle à la coordination et à l''équilibre.', 'Système nerveux'),
  ('CORTEX', 'Cortex', 'Couche superficielle de substance grise du cerveau.', 'Système nerveux'),
  ('THALAMUS', 'Thalamus', 'Relais central des informations sensitives vers le cortex.', 'Système nerveux'),
  ('PLEXUS', 'Plexus', 'Réseau de nerfs entremêlés, comme le plexus brachial pour le membre supérieur.', 'Système nerveux'),
  ('GANGLION', 'Ganglion', 'Petit amas de cellules nerveuses, ou relais du système lymphatique.', 'Système nerveux'),
  ('DERMATOME', 'Dermatome', 'Territoire de peau innervé par une seule racine nerveuse.', 'Système nerveux'),
  ('MYOTOME', 'Myotome', 'Groupe de muscles innervés par une même racine nerveuse.', 'Système nerveux'),
  ('RACINE', 'Racine', 'Portion d''un nerf spinal à sa sortie de la moelle épinière.', 'Système nerveux'),
  ('MEDIAN', 'Médian', 'Nerf de l''avant-bras et de la main, qui passe dans le canal carpien.', 'Système nerveux'),
  ('PHRENIQUE', 'Phrénique', 'Nerf qui commande le diaphragme.', 'Système nerveux'),
  ('VAGUE', 'Vague', 'Dixième nerf crânien, qui ralentit le cœur et régule la digestion.', 'Système nerveux'),
  ('MOTEUR', 'Moteur', 'Qui commande le mouvement ; un nerf moteur transmet l''ordre de contraction au muscle.', 'Système nerveux'),
  ('SENSITIF', 'Sensitif', 'Qui transmet les sensations, comme le toucher, la douleur ou la température.', 'Système nerveux'),
  ('INFLUX', 'Influx', 'Signal électrique qui se propage le long d''un nerf.', 'Système nerveux'),
  ('RECEPTEUR', 'Récepteur', 'Structure qui capte un stimulus et le transforme en message nerveux.', 'Système nerveux'),
  ('FUSEAU', 'Fuseau', 'Le fuseau neuromusculaire est le récepteur qui informe sur l''étirement du muscle.', 'Système nerveux'),
  ('VESTIBULE', 'Vestibule', 'Partie de l''oreille interne qui renseigne sur les mouvements de la tête et l''équilibre.', 'Système nerveux'),
  ('PRAXIE', 'Praxie', 'Capacité à réaliser un geste volontaire coordonné.', 'Système nerveux'),
  ('MENINGE', 'Méninge', 'Chacune des trois membranes qui enveloppent le cerveau et la moelle épinière.', 'Système nerveux'),
  ('POUMON', 'Poumon', 'Organe de la respiration, où le sang se charge en oxygène.', 'Respiration, circulation et énergie'),
  ('BRONCHE', 'Bronche', 'Conduit qui amène l''air de la trachée aux poumons.', 'Respiration, circulation et énergie'),
  ('TRACHEE', 'Trachée', 'Conduit qui relie le larynx aux bronches.', 'Respiration, circulation et énergie'),
  ('ALVEOLE', 'Alvéole', 'Petit sac au bout des voies aériennes, où se font les échanges gazeux.', 'Respiration, circulation et énergie'),
  ('PLEVRE', 'Plèvre', 'Membrane à deux feuillets qui entoure chaque poumon.', 'Respiration, circulation et énergie'),
  ('LARYNX', 'Larynx', 'Organe de la voix, situé entre le pharynx et la trachée.', 'Respiration, circulation et énergie'),
  ('PHARYNX', 'Pharynx', 'Carrefour des voies respiratoires et digestives, à l''arrière de la bouche et du nez.', 'Respiration, circulation et énergie'),
  ('GLOTTE', 'Glotte', 'Espace entre les cordes vocales, qui se ferme pendant la toux.', 'Respiration, circulation et énergie'),
  ('HYPOXIE', 'Hypoxie', 'Manque d''oxygène dans les tissus.', 'Respiration, circulation et énergie'),
  ('OXYGENE', 'Oxygène', 'Gaz indispensable à la production d''énergie par les cellules.', 'Respiration, circulation et énergie'),
  ('MUCUS', 'Mucus', 'Sécrétion des voies respiratoires, que les techniques de désencombrement aident à évacuer.', 'Respiration, circulation et énergie'),
  ('CRACHAT', 'Crachat', 'Sécrétion bronchique expulsée par la toux.', 'Respiration, circulation et énergie'),
  ('AEROSOL', 'Aérosol', 'Médicament inhalé sous forme de fines gouttelettes.', 'Respiration, circulation et énergie'),
  ('ARTERE', 'Artère', 'Vaisseau qui conduit le sang du cœur vers les organes.', 'Respiration, circulation et énergie'),
  ('VEINE', 'Veine', 'Vaisseau qui ramène le sang vers le cœur.', 'Respiration, circulation et énergie'),
  ('AORTE', 'Aorte', 'Plus grosse artère du corps, qui part du ventricule gauche.', 'Respiration, circulation et énergie'),
  ('POULS', 'Pouls', 'Battement d''une artère perçu au toucher, reflet de la fréquence cardiaque.', 'Respiration, circulation et énergie'),
  ('SYSTOLE', 'Systole', 'Phase de contraction du cœur.', 'Respiration, circulation et énergie'),
  ('DIASTOLE', 'Diastole', 'Phase de relâchement et de remplissage du cœur.', 'Respiration, circulation et énergie'),
  ('PLASMA', 'Plasma', 'Partie liquide du sang.', 'Respiration, circulation et énergie'),
  ('LYMPHE', 'Lymphe', 'Liquide qui circule dans les vaisseaux lymphatiques.', 'Respiration, circulation et énergie'),
  ('LACTATE', 'Lactate', 'Produit du métabolisme anaérobie, dont le taux sanguin augmente à l''effort intense.', 'Respiration, circulation et énergie'),
  ('GLUCOSE', 'Glucose', 'Sucre simple, principal carburant des cellules.', 'Respiration, circulation et énergie'),
  ('GLYCOGENE', 'Glycogène', 'Forme de réserve du glucose dans le muscle et le foie.', 'Respiration, circulation et énergie'),
  ('AEROBIE', 'Aérobie', 'Qui utilise l''oxygène pour produire de l''énergie, comme lors d''un effort d''endurance.', 'Respiration, circulation et énergie'),
  ('CALORIE', 'Calorie', 'Unité de mesure de l''énergie.', 'Respiration, circulation et énergie')
on conflict (word) do nothing;

notify pgrst, 'reload schema';
