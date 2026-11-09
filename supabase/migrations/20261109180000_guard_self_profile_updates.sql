-- Sécurité : un utilisateur sans droits d'administration ne peut modifier, sur son propre
-- profil, que sa ville, sa langue préférée, son canton d'origine et sa photo.
--
-- Avant : la règle RLS « update own » autorisait toutes les colonnes de sa ligne. En appelant
-- l'API directement, un étudiant pouvait se donner role = 'admin' ou des permissions admin,
-- puis obtenir tous les droits (app_is_privileged). De même, un compte sans profil pouvait
-- créer sa ligne avec un rôle privilégié.
--
-- Le garde-fou ne s'applique qu'aux appels directs de l'API (current_user = authenticated/anon).
-- Les fonctions serveur SECURITY DEFINER (attribution de maison, etc.) et le service backend
-- ne sont pas concernés. Les administrateurs (app_is_privileged) gardent tous leurs droits.

create or replace function gamification_private.guard_self_profile_write()
returns trigger
language plpgsql
-- Invocateur volontairement : current_user vaut « authenticated » pour un appel direct de l'API,
-- et le propriétaire de la fonction quand l'écriture vient d'une fonction SECURITY DEFINER.
security invoker
set search_path = ''
as $$
declare
  -- Colonnes qu'un utilisateur peut changer lui-même.
  v_allowed text[] := array['city', 'preferred_language', 'canton_of_origin', 'avatar_url', 'updated_at', 'last_login'];
  v_changed text[];
begin
  if current_user not in ('authenticated', 'anon') or (select public.app_is_privileged()) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role is not null
       or coalesce(new.permissions, '[]'::jsonb) <> '[]'::jsonb
       or new.classe is not null
       or new.pfp_cohort is not null
       or new.primary_track_id is not null
       or new.house_id is not null
       or coalesce(new.is_verified, false) then
      raise exception 'Création de profil refusée : rôle, permissions et classe sont attribués par l''administration'
        using errcode = '42501';
    end if;
    return new;
  end if;

  select array_agg(n.key order by n.key)
  into v_changed
  from jsonb_each(to_jsonb(new)) n
  join jsonb_each(to_jsonb(old)) o on o.key = n.key
  where n.value is distinct from o.value
    and n.key <> all (v_allowed);

  if v_changed is not null then
    raise exception 'Modification refusée : seuls la ville, la langue, le canton d''origine et la photo sont modifiables (%).',
      array_to_string(v_changed, ', ')
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function gamification_private.guard_self_profile_write() from public, anon, authenticated;

drop trigger if exists guard_self_profile_write on public.user_profiles;
create trigger guard_self_profile_write
  before insert or update on public.user_profiles
  for each row execute function gamification_private.guard_self_profile_write();
