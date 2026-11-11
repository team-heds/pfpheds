\set ON_ERROR_STOP on
-- Quiz d'exemple : « Anatomie de l'épaule » (10 questions).
--
-- À FAIRE RELIRE PAR UN ENSEIGNANT avant publication : le quiz est créé en BROUILLON, au nom de
-- l'enseignant indiqué, qui peut le corriger puis le publier depuis « Quiz > Gérer les quiz ».
-- Ce script n'est appliqué nulle part automatiquement. Il ne modifie ni ne supprime rien : s'il
-- existe déjà un quiz du même titre pour cet auteur, il ne fait rien.
--
-- Prérequis : migration 20261111120000_gamification_quizzes.sql appliquée.
-- Utilisation (adresse de l'enseignant ou de l'admin qui sera l'auteur) :
--   psql "$DATABASE_URL" -v author_email='prenom.nom@hevs.ch' -f scripts/supabase/quiz-demo-epaule.sql

begin;

select set_config('quiz_demo.author_email', :'author_email', true);

do $demo$
declare
  v_email text := lower(btrim(current_setting('quiz_demo.author_email')));
  v_author uuid;
  v_quiz uuid;
  v_title constant text := 'Anatomie de l''épaule : les bases';
begin
  select up.user_id into v_author
  from public.user_profiles up
  where lower(up.email) = v_email;

  if v_author is null then
    raise exception 'Aucun profil trouvé pour l''adresse %', v_email;
  end if;

  if exists (select 1 from public.quizzes q where q.author_id = v_author and q.title = v_title) then
    raise notice 'Le quiz « % » existe déjà pour cet auteur : rien à faire.', v_title;
    return;
  end if;

  insert into public.quizzes (author_id, title, description, theme, target_classes, status)
  values (
    v_author,
    v_title,
    'Dix questions pour réviser les articulations, les muscles et l''innervation du complexe de l''épaule.',
    'Épaule',
    '{}',
    'draft'
  )
  returning id into v_quiz;

  insert into public.quiz_questions (quiz_id, position, kind, prompt, explanation, options)
  values
    (v_quiz, 0, 'single',
     'De quel type est l''articulation gléno-humérale ?',
     'C''est une articulation synoviale sphéroïde (énarthrose) : trois degrés de liberté, très mobile mais peu congruente, donc dépendante des muscles et des ligaments pour sa stabilité.',
     '[{"id":"a","label":"Sphéroïde (énarthrose)","correct":true},
       {"id":"b","label":"Ginglyme (charnière)","correct":false},
       {"id":"c","label":"Trochoïde (pivot)","correct":false},
       {"id":"d","label":"Articulation en selle","correct":false}]'),

    (v_quiz, 1, 'multiple',
     'Quels muscles font partie de la coiffe des rotateurs ? (plusieurs réponses)',
     'La coiffe des rotateurs comprend quatre muscles : supra-épineux, infra-épineux, petit rond et subscapulaire. Le deltoïde et le grand rond n''en font pas partie.',
     '[{"id":"a","label":"Supra-épineux","correct":true},
       {"id":"b","label":"Infra-épineux","correct":true},
       {"id":"c","label":"Petit rond","correct":true},
       {"id":"d","label":"Subscapulaire","correct":true},
       {"id":"e","label":"Deltoïde","correct":false},
       {"id":"f","label":"Grand rond","correct":false}]'),

    (v_quiz, 2, 'single',
     'Quel muscle participe surtout à l''amorce de l''abduction du bras (premiers degrés) ?',
     'Le supra-épineux amorce l''abduction et plaque la tête humérale dans la glène ; le deltoïde prend ensuite le relais comme abducteur principal.',
     '[{"id":"a","label":"Supra-épineux","correct":true},
       {"id":"b","label":"Deltoïde (faisceau moyen)","correct":false},
       {"id":"c","label":"Trapèze supérieur","correct":false},
       {"id":"d","label":"Grand pectoral","correct":false}]'),

    (v_quiz, 3, 'single',
     'Quel nerf innerve le muscle deltoïde ?',
     'Le nerf axillaire (C5-C6) innerve le deltoïde et le petit rond. Il peut être lésé lors d''une luxation antéro-inférieure de l''épaule ou d''une fracture du col chirurgical de l''humérus.',
     '[{"id":"a","label":"Nerf axillaire","correct":true},
       {"id":"b","label":"Nerf supra-scapulaire","correct":false},
       {"id":"c","label":"Nerf musculo-cutané","correct":false},
       {"id":"d","label":"Nerf radial","correct":false}]'),

    (v_quiz, 4, 'single',
     'Quel muscle de la coiffe des rotateurs est rotateur médial de l''épaule ?',
     'Le subscapulaire, situé à la face antérieure de la scapula et inséré sur le tubercule mineur, est le seul rotateur médial de la coiffe.',
     '[{"id":"a","label":"Subscapulaire","correct":true},
       {"id":"b","label":"Infra-épineux","correct":false},
       {"id":"c","label":"Petit rond","correct":false},
       {"id":"d","label":"Supra-épineux","correct":false}]'),

    (v_quiz, 5, 'multiple',
     'Quels muscles sont rotateurs latéraux de l''épaule ? (plusieurs réponses)',
     'L''infra-épineux et le petit rond sont les rotateurs latéraux de la coiffe. Le subscapulaire et le grand dorsal sont rotateurs médiaux.',
     '[{"id":"a","label":"Infra-épineux","correct":true},
       {"id":"b","label":"Petit rond","correct":true},
       {"id":"c","label":"Subscapulaire","correct":false},
       {"id":"d","label":"Grand dorsal","correct":false}]'),

    (v_quiz, 6, 'single',
     'Une scapula alata (décollement du bord médial de la scapula) évoque le plus souvent l''atteinte de quel nerf ?',
     'Le nerf thoracique long innerve le dentelé antérieur, qui plaque la scapula contre le thorax. Sa paralysie fait décoller le bord médial de la scapula, surtout lors d''une poussée contre un mur.',
     '[{"id":"a","label":"Nerf thoracique long","correct":true},
       {"id":"b","label":"Nerf axillaire","correct":false},
       {"id":"c","label":"Nerf supra-scapulaire","correct":false},
       {"id":"d","label":"Nerf ulnaire","correct":false}]'),

    (v_quiz, 7, 'single',
     'Sur l''ensemble de l''élévation du bras, quel est le rapport classiquement décrit entre le mouvement gléno-huméral et le mouvement scapulo-thoracique (rythme scapulo-huméral) ?',
     'On décrit classiquement un rapport global de 2 pour 1 : environ 120° dans l''articulation gléno-humérale pour 60° de rotation latérale (sonnette latérale) de la scapula.',
     '[{"id":"a","label":"2 pour 1","correct":true},
       {"id":"b","label":"1 pour 1","correct":false},
       {"id":"c","label":"1 pour 2","correct":false},
       {"id":"d","label":"5 pour 1","correct":false}]'),

    (v_quiz, 8, 'single',
     'Où se termine le tendon du muscle supra-épineux ?',
     'Le supra-épineux s''insère sur la facette supérieure du tubercule majeur de l''humérus, après être passé sous l''arc coraco-acromial.',
     '[{"id":"a","label":"Tubercule majeur de l''humérus","correct":true},
       {"id":"b","label":"Tubercule mineur de l''humérus","correct":false},
       {"id":"c","label":"Processus coracoïde","correct":false},
       {"id":"d","label":"Tubérosité deltoïdienne","correct":false}]'),

    (v_quiz, 9, 'multiple',
     'Parmi ces éléments du complexe de l''épaule, lesquels sont de vraies articulations synoviales ? (plusieurs réponses)',
     'Les articulations gléno-humérale, acromio-claviculaire et sterno-claviculaire sont des articulations synoviales. Les espaces scapulo-thoracique et sous-acromial sont des plans de glissement, sans capsule ni cartilage articulaire.',
     '[{"id":"a","label":"Gléno-humérale","correct":true},
       {"id":"b","label":"Acromio-claviculaire","correct":true},
       {"id":"c","label":"Sterno-claviculaire","correct":true},
       {"id":"d","label":"Scapulo-thoracique","correct":false},
       {"id":"e","label":"Sous-acromiale","correct":false}]');

  raise notice 'Quiz « % » créé en brouillon (% questions).', v_title,
    (select count(*) from public.quiz_questions qq where qq.quiz_id = v_quiz);
end
$demo$;

commit;
