-- Chasse au trésor d'exemple (3 étapes, ordre libre, toutes les classes), pour le SITE DE TEST.
-- Ne pas lancer en production. Usage :
--   psql -X -v ON_ERROR_STOP=1 -v organizer_email='<compte organisateur>' -f scripts/supabase/treasure-hunt-demo.sql
-- Ouverte tout de suite pour 14 jours et publiée. Chaque étape reçoit son QR code fixe.
\set ON_ERROR_STOP on

begin;

select set_config('heds_demo.organizer', (
  select u.id::text from auth.users u where lower(u.email) = lower(:'organizer_email')
), true);

do $demo$
declare
  v_organizer uuid := nullif(current_setting('heds_demo.organizer', true), '')::uuid;
  v_hunt uuid;
  v_step uuid;
  v_item record;
begin
  if v_organizer is null then
    raise exception 'Compte organisateur introuvable';
  end if;

  insert into gamification_private.treasure_hunts (title, description, starts_at, ends_at, target_classes, ordered, published, created_by)
  values (
    'Chasse d''essai du campus',
    'Trois QR codes à trouver dans l''école. Chasse d''exemple pour le site de test.',
    now() - interval '5 minutes', now() + interval '14 days', '{}', false, true, v_organizer
  )
  returning id into v_hunt;

  for v_item in
    select * from (values
      (1, 'Bibliothèque', 'Là où dorment les livres, près des revues de physiothérapie.', 10),
      (2, 'Cafétéria', 'Là où l''on recharge les batteries entre deux cours.', 15),
      (3, 'Salle de pratique', 'Cherchez près des tables de traitement.', 20)
    ) as s(position, name, hint, xp)
  loop
    insert into gamification_private.treasure_hunt_steps (hunt_id, position, name, hint, xp_reward)
    values (v_hunt, v_item.position, v_item.name, v_item.hint, v_item.xp)
    returning id into v_step;
    perform gamification_private.issue_treasure_step_code(v_step, v_organizer);
  end loop;

  raise notice 'Chasse créée : %', v_hunt;
end
$demo$;

select s.position, s.name, s.xp_reward, c.short_code
from gamification_private.treasure_hunt_steps s
join gamification_private.treasure_hunts h on h.id = s.hunt_id
join gamification_private.scan_codes c on c.id = s.code_id
where h.title = 'Chasse d''essai du campus'
order by h.created_at desc, s.position;

commit;
