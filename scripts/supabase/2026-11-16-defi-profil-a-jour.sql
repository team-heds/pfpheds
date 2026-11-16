-- Reformulation du défi « Profil à jour » (décision du 16.11.2026).
-- Depuis #251, un étudiant ne modifie plus que photo, ville, langue et canton :
-- « présentation, coordonnées » promettait des champs inaccessibles.
-- Texte seulement : ni dates, ni points, ni progression ne changent. Rejouable.
begin;

update public.challenges
set description = 'Complète ou mets à jour ton profil : photo, ville, langue ou canton d''origine.'
where name = 'Profil à jour'
  and action_type = 'update_profile'
  and description = 'Complète ou mets à jour ton profil (photo, présentation, coordonnées).';

update public.challenges
set description = 'Mets à jour ton profil : photo, ville, langue ou canton d''origine.'
where name = 'Profil à jour'
  and action_type = 'update_profile'
  and description = 'Mets à jour ton profil (photo, présentation, coordonnées).';

select name, start_date, description
from public.challenges
where name = 'Profil à jour'
order by start_date;

commit;
