-- Audit agrégé et strictement en lecture seule de la préparation PFP2 BA25 2027.
-- Cette requête ne retourne aucun nom, e-mail ni identifiant individuel.

begin transaction read only;

-- 1. Cohorte déclarée dans les profils et snapshots annuels disponibles.
select
  count(distinct up.user_id) filter (
    where up.is_active is distinct from false
      and upper(trim(coalesce(up.classe, ''))) = 'BA25'
  ) as profils_actifs_ba25,
  count(distinct sp.user_id) filter (
    where sp.year = '2027'
      and upper(trim(coalesce(sp.class, ''))) = 'BA25'
  ) as snapshot_ba25_2027,
  count(distinct sp.user_id) filter (
    where sp.year = '2026'
      and upper(trim(coalesce(sp.class, ''))) = 'BA25'
  ) as snapshot_ba25_2026
from public.user_profiles up
left join public."StudentsPhysio" sp on sp.user_id = up.user_id;

-- 2. Répartition des snapshots liés aux profils actuellement marqués BA25.
select
  sp.year,
  coalesce(nullif(upper(trim(sp.class)), ''), '(VIDE)') as classe_snapshot,
  count(distinct sp.user_id) as etudiants,
  count(distinct sp.user_id) filter (
    where nullif(trim(coalesce(sp.repondant_hes, '')), '') is null
  ) as repondant_manquant
from public."StudentsPhysio" sp
join public.user_profiles up on up.user_id = sp.user_id
where up.is_active is distinct from false
  and upper(trim(coalesce(up.classe, ''))) = 'BA25'
group by sp.year, coalesce(nullif(upper(trim(sp.class)), ''), '(VIDE)')
order by sp.year desc, classe_snapshot;

-- 3. Couverture des répondants sur le snapshot candidat et annuaire actif.
select
  count(distinct sp.user_id) as etudiants_ba25_2026,
  count(distinct sp.user_id) filter (
    where nullif(trim(coalesce(sp.repondant_hes, '')), '') is not null
  ) as avec_repondant,
  count(distinct sp.user_id) filter (
    where nullif(trim(coalesce(sp.repondant_hes, '')), '') is null
  ) as sans_repondant,
  (select count(*) from public."RepondantPhysioHES" where is_active is distinct from false)
    as repondants_actifs
from public."StudentsPhysio" sp
where sp.year = '2026'
  and upper(trim(coalesce(sp.class, ''))) = 'BA25';

-- 4. Capacité numérique PFP2 pour 2027.
with capacity as (
  select
    coalesce("selectedOut", false) as selected_out,
    case
      when coalesce(pfp2_proposition ->> '2027', '') ~ '^\d+$'
        then (pfp2_proposition ->> '2027')::integer
      when coalesce(pfp2_proposition ->> '2026-2027', '') ~ '^\d+$'
        then (pfp2_proposition ->> '2026-2027')::integer
      else 0
    end as proposition,
    case
      when coalesce("PFP2" ->> '2027', '') ~ '^\d+$'
        then ("PFP2" ->> '2027')::integer
      when coalesce("PFP2" ->> '2026-2027', '') ~ '^\d+$'
        then ("PFP2" ->> '2026-2027')::integer
      else 0
    end as offre
  from public.places
)
select
  sum(proposition) as propositions_total,
  sum(offre) as offres_total,
  sum(proposition) filter (where not selected_out) as propositions_sans_selected_out,
  sum(proposition) filter (where selected_out) as propositions_selected_out,
  sum(offre) filter (where not selected_out) as offres_sans_selected_out,
  sum(offre) filter (where selected_out) as offres_selected_out,
  count(*) filter (where proposition > 0) as lieux_proposes
from capacity;

-- 4b. Sièges BA25 imbriqués dans les propositions.
-- Ils sont rapportés séparément et ne doivent pas être ajoutés automatiquement
-- à la capacité numérique précédente sans validation du modèle de données.
with place_assignments as (
  select
    coalesce(p."selectedOut", false) as selected_out,
    assignment.key as seat_key,
    lower(coalesce(assignment.value ->> 'active', 'false')) = 'true' as active,
    nullif(trim(coalesce(assignment.value ->> 'etudiant', '')), '') is not null as occupied
  from public.places p
  cross join lateral jsonb_each(
    case
      when jsonb_typeof(p.pfp2_proposition -> 'assignations') = 'object'
        then p.pfp2_proposition -> 'assignations'
      else '{}'::jsonb
    end
  ) as assignment
  where assignment.key like 'BA25-%'
)
select
  count(*) as sieges_ba25,
  count(*) filter (where active) as sieges_actifs,
  count(*) filter (where active and occupied) as sieges_actifs_occupes,
  count(*) filter (where active and not occupied) as sieges_actifs_disponibles,
  count(*) filter (where active and selected_out) as sieges_actifs_selected_out
from place_assignments;

-- 5. État de la votation et des résultats : attendu à zéro avant ouverture.
select
  (select count(*)
   from public.votation_sessions
   where pfp_type = 'PFP2'
     and year in ('2027', '2026-2027')
     and upper(trim(target_class)) = 'BA25') as sessions,
  (select count(*)
   from public.student_votes
   where pfp_type = 'PFP2'
     and year = '2027') as votes,
  (select count(*)
   from public.student_result_vote
   where pfp_type = 'PFP2'
     and year in ('2027', '2026-2027')) as resultats;

-- 6. Année académique globale. Les dates PFP2 précises ne sont pas stockées ici.
select name, start_date, end_date, is_active
from public.academic_years
where name = '2026-2027';

rollback;
