-- Défis : lien d'action facultatif, et défi hebdomadaire « Mot de la semaine ».
--
-- 1. Lien d'action générique : un défi peut porter une adresse interne de la plateforme
--    (colonne challenges.action_url, par exemple « /mot-de-la-semaine »). La carte du défi
--    y mène. Utilisable par tout défi (jeux, quiz, mentorat…), jamais obligatoire.
-- 2. Le mot de la semaine devient une action de défi (« word_of_week ») : un défi de ce
--    type se coche tout seul quand le joueur trouve le mot de la semaine. La progression
--    est écrite par le serveur, à partir des parties réellement gagnées.
--
-- Le défi ne paie rien de plus : les XP restent ceux du jeu (30 XP, +15 XP en 3 essais ou
-- moins). Les défis hebdomadaires eux-mêmes sont des données : ils sont créés par
-- scripts/supabase/gamification-defi-mot-de-la-semaine.sql (xp_reward = 0).

-- Adresse interne uniquement : commence par « / », jamais un site externe.
alter table public.challenges
  add column if not exists action_url text;

do $constraint$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'challenges_action_url_check'
      and conrelid = 'public.challenges'::regclass
  ) then
    alter table public.challenges
      add constraint challenges_action_url_check
      check (action_url is null or action_url ~ '^/[A-Za-z0-9][A-Za-z0-9/_.?=&#-]{0,198}$');
  end if;
end
$constraint$;

comment on column public.challenges.action_url is
  'Adresse interne facultative où réaliser le défi (ex. /mot-de-la-semaine). La carte du défi y mène.';

-- Règle du moteur : rend l'action « word_of_week » utilisable par un défi. Elle n'est pas
-- acceptée par record_my_gamification_action (appel navigateur) : seul le jeu attribue les
-- XP, après comparaison du mot par le serveur.
insert into gamification_private.action_rules (
  action_code, rule_version, xp_amount, challenge_action, window_kind, max_awards_per_window, is_active
)
values ('WORD_OF_WEEK', 'gamification-word-v1', 30, 'word_of_week', 'week', 1, true)
on conflict (action_code) do nothing;

-- Met à jour la progression d'un joueur sur les défis « word_of_week » qui couvrent la
-- semaine donnée : une semaine gagnée compte pour 1. Sans effet sur un défi déjà réussi,
-- et sans aucun XP (la récompense d'un défi n'est versée que par le moteur d'actions).
create or replace function gamification_private.word_of_day_mark_challenge(p_user_id uuid, p_week date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_week date := date_trunc('week', p_week)::date;
  v_count integer;
begin
  insert into public.user_challenge_progress (user_id, challenge_id, current_value, completed, completed_at)
  select p_user_id, c.id, least(w.won, c.target_value), w.won >= c.target_value,
         case when w.won >= c.target_value then now() end
  from public.challenges c
  cross join lateral (
    select count(distinct g.play_date)::integer as won
    from gamification_private.word_of_day_guesses g
    where g.user_id = p_user_id
      and g.is_correct
      and g.play_date = date_trunc('week', g.play_date)::date
      and g.play_date + 6 >= c.start_date
      and g.play_date <= c.end_date
  ) w
  where lower(c.action_type) = 'word_of_week'
    and c.status in ('scheduled', 'active')
    and c.start_date <= v_week + 6
    and c.end_date >= v_week
    and w.won > 0
  on conflict (user_id, challenge_id) do update
    set current_value = excluded.current_value,
        completed = excluded.completed,
        completed_at = excluded.completed_at
    where not coalesce(public.user_challenge_progress.completed, false);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Dès qu'un essai gagnant est enregistré (ou rattaché à une semaine), le défi se coche.
create or replace function gamification_private.word_of_day_guess_marks_challenge()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform gamification_private.word_of_day_mark_challenge(new.user_id, new.play_date);
  return new;
end;
$$;

create or replace trigger word_of_day_guess_marks_challenge
after insert or update of play_date on gamification_private.word_of_day_guesses
for each row
when (new.is_correct)
execute function gamification_private.word_of_day_guess_marks_challenge();

revoke all on function gamification_private.word_of_day_mark_challenge(uuid, date) from public, anon, authenticated;
revoke all on function gamification_private.word_of_day_guess_marks_challenge() from public, anon, authenticated;

notify pgrst, 'reload schema';
