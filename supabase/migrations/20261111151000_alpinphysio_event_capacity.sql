-- Événements : le nombre de places est désormais appliqué par la base.
--
-- Avant : events.capacity était enregistré mais jamais contrôlé ; on pouvait
-- répondre « présent » au-delà du nombre de places.
-- Après : une réponse « présent » est refusée quand l'événement est complet.
-- Les réponses « peut-être » et « absent » restent toujours possibles, et une
-- personne déjà inscrite garde sa place même si le nombre de places baisse.

create or replace function public.enforce_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_capacity integer;
  v_taken integer;
begin
  if new.response is distinct from 'going' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.response = 'going' and old.event_id = new.event_id then
    return new;
  end if;

  -- Verrou sur l'événement : deux réponses simultanées ne peuvent pas prendre
  -- la même dernière place.
  select e.capacity into v_capacity
  from public.events e
  where e.id = new.event_id
  for share;

  if v_capacity is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.event_id::text, 0));

  select count(*) into v_taken
  from public.event_registrations r
  where r.event_id = new.event_id
    and r.response = 'going'
    and r.id is distinct from new.id;

  if v_taken >= v_capacity then
    raise exception 'Cet événement est complet.'
      using errcode = 'P0001', hint = 'event_full';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_event_capacity() from public, anon, authenticated;

create or replace trigger event_registrations_enforce_capacity
before insert or update of response, event_id
on public.event_registrations
for each row execute function public.enforce_event_capacity();

-- Places prises par événement, lisibles par toute personne connectée.
-- Les réponses individuelles restent protégées : seul un total est renvoyé,
-- et seulement pour les événements publiés (ou gérés par l'appelant).
create or replace function public.event_places(p_event_ids uuid[])
returns table (event_id uuid, capacity integer, going_count integer)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select e.id, e.capacity,
    (select count(*)::integer from public.event_registrations r
      where r.event_id = e.id and r.response = 'going')
  from public.events e
  where (select auth.uid()) is not null
    and e.id = any ((coalesce(p_event_ids, '{}'::uuid[]))[1:200])
    and (
      e.status = 'published'
      or e.admin_uid = (select auth.uid())::text
      or (e.type = 'alpinphysio' and (select public.app_is_alpinphysio_manager()))
    );
$$;

revoke all on function public.event_places(uuid[]) from public, anon;
grant execute on function public.event_places(uuid[]) to authenticated, service_role;
