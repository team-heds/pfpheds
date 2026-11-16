-- Corrections de sécurité de gravité moyenne (audit du 16.11.2026).
--
-- 1. Un étudiant ne peut plus supprimer sa propre fiche profil.
--    La règle « delete_own_profile » le permettait. La suppression efface en cascade son
--    historique d'XP, ses badges, ses progrès de défis, ses essais au mot de la semaine et
--    son accès initial, puis la garde de profil (20261109180000) l'empêche de recréer sa
--    fiche : compte cassé et traces de jeu effacées. La suppression d'une fiche reste
--    possible pour l'administration par le serveur (service_role).
--
-- 2. Formulaire public de demande de partenariat Alp'in Physio (20261111153000).
--    La seule limite était globale (30 demandes par heure, tous visiteurs confondus) : un robot
--    pouvait envoyer 30 demandes et bloquer le formulaire pour tout le monde pendant une heure.
--    Maintenant : 5 demandes par heure et par adresse IP (empreinte md5, l'adresse n'est pas
--    conservée en clair), 3 demandes par jour et par adresse e-mail, et une limite globale de
--    100 demandes par heure en dernier recours.

drop policy if exists delete_own_profile on public.user_profiles;

alter table public.alpinphysio_partnership_requests
  add column if not exists client_key text
  check (client_key is null or client_key ~ '^[0-9a-f]{32}$');

create index if not exists alpinphysio_partnership_requests_client_idx
  on public.alpinphysio_partnership_requests (client_key, created_at desc)
  where client_key is not null;

create or replace function public.submit_alpinphysio_partnership_request(p_request jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent integer;
  v_count text := nullif(btrim(coalesce(p_request->>'masseurs_count', '')), '');
  v_date text := nullif(btrim(coalesce(p_request->>'event_date', '')), '');
  v_email text := lower(btrim(coalesce(p_request->>'email', '')));
  v_forwarded text;
  v_ip text;
  v_client_key text;
begin
  if p_request is null or jsonb_typeof(p_request) <> 'object' then
    raise exception 'Demande invalide.' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_request->>'website', '')), '') is not null then
    return true;
  end if;

  -- Adresse du visiteur ajoutée par la passerelle (dernière entrée, non falsifiable par le client).
  begin
    v_forwarded := nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for';
  exception when others then
    v_forwarded := null;
  end;
  v_ip := nullif(btrim(regexp_replace(coalesce(v_forwarded, ''), '^.*,', '')), '');
  if v_ip is not null then
    v_client_key := md5('alpinphysio-partnership:' || v_ip);
  end if;

  if v_client_key is not null then
    select count(*) into v_recent
    from public.alpinphysio_partnership_requests r
    where r.client_key = v_client_key
      and r.created_at > now() - interval '1 hour';
    if v_recent >= 5 then
      raise exception 'Trop de demandes envoyées depuis cette connexion. Merci de réessayer plus tard ou d''écrire à alpinphysio@hevs.ch.'
        using errcode = 'P0001', hint = 'rate_limited';
    end if;
  end if;

  select count(*) into v_recent
  from public.alpinphysio_partnership_requests r
  where r.email = v_email
    and r.created_at > now() - interval '1 day';
  if v_recent >= 3 then
    raise exception 'Plusieurs demandes ont déjà été reçues pour cette adresse e-mail. Nous vous répondrons rapidement ; vous pouvez aussi écrire à alpinphysio@hevs.ch.'
      using errcode = 'P0001', hint = 'rate_limited';
  end if;

  select count(*) into v_recent
  from public.alpinphysio_partnership_requests r
  where r.created_at > now() - interval '1 hour';
  if v_recent >= 100 then
    raise exception 'Trop de demandes reçues pour le moment. Merci de réessayer plus tard ou d''écrire à alpinphysio@hevs.ch.'
      using errcode = 'P0001', hint = 'rate_limited';
  end if;

  if v_count is not null and v_count !~ '^\d{1,3}$' then
    raise exception 'Le nombre de masseurs doit être un nombre entier.' using errcode = '22023';
  end if;
  if v_date is not null and v_date !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'La date de l''événement est invalide.' using errcode = '22023';
  end if;

  insert into public.alpinphysio_partnership_requests (
    organization, contact_name, email, phone, event_date, location, masseurs_count, message, client_key
  ) values (
    btrim(coalesce(p_request->>'organization', '')),
    btrim(coalesce(p_request->>'contact_name', '')),
    v_email,
    nullif(btrim(coalesce(p_request->>'phone', '')), ''),
    v_date::date,
    nullif(btrim(coalesce(p_request->>'location', '')), ''),
    v_count::integer,
    nullif(btrim(coalesce(p_request->>'message', '')), ''),
    v_client_key
  );

  return true;
exception
  when check_violation then
    raise exception 'Merci de vérifier les champs du formulaire (nom, organisation et adresse e-mail valides).'
      using errcode = '22023';
end;
$$;

revoke all on function public.submit_alpinphysio_partnership_request(jsonb) from public;
grant execute on function public.submit_alpinphysio_partnership_request(jsonb) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
