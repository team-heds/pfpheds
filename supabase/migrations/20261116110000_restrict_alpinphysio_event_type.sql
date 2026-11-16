-- Sécurité : seul un responsable Alp'in Physio peut publier au nom d'Alp'in Physio.
--
-- Faille corrigée : la création d'un événement « alpinphysio » était bien réservée aux
-- responsables, mais la règle de modification laissait le propriétaire d'un événement
-- ordinaire changer son type en « alpinphysio ». L'événement apparaissait alors sur le site
-- public Alp'in Physio (show_on_public_site) et, via la synchronisation du fil
-- (20261111150000), comme une publication signée « Alp'in Physio ».
--
-- Maintenant, après modification, un événement de type « alpinphysio » doit être écrit par un
-- responsable Alp'in Physio (app_is_alpinphysio_manager, qui inclut les administrateurs
-- globaux). Les autres cas sont inchangés.

alter policy events_owner_or_alpin_manager_update
  on public.events
  with check (
    (
      type is distinct from 'alpinphysio'
      or (select public.app_is_alpinphysio_manager())
    )
    and (
      admin_uid = ((select auth.uid()))::text
      or (select public.app_is_privileged())
      or (type = 'alpinphysio' and (select public.app_is_alpinphysio_manager()))
    )
  );

notify pgrst, 'reload schema';
