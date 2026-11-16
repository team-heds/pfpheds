-- Sécurité des notifications push.
--
-- Faille corrigée : un visiteur anonyme (clé publique du site) pouvait insérer dans
-- push_outbox une ligne sans destinataire (user_id null). Le service d'envoi diffuse ces
-- lignes à TOUS les appareils abonnés, avec le titre, le texte et le lien choisis par
-- l'attaquant (hameçonnage). Un étudiant connecté pouvait aussi lire et réécrire le lien
-- d'une diffusion en attente.
--
-- Maintenant :
--   - un anonyme n'a plus aucun droit sur push_outbox ;
--   - un utilisateur ne voit, ne modifie et ne supprime que ses propres notifications ;
--   - un utilisateur ne peut s'envoyer une notification qu'à lui-même (inchangé) ;
--   - seule l'administration (app_is_privileged) peut écrire pour un autre compte ou diffuser
--     à tous ;
--   - le lien d'une nouvelle notification doit être un chemin interne (« /… »), jamais une
--     adresse externe ; titre et texte sont limités en longueur ;
--   - un anonyme ne peut plus modifier un abonnement « invité » existant (détournement).
-- Les fonctions serveur (mentorat) écrivent en tant que propriétaire et ne sont pas concernées.
-- Les anciennes lignes ne sont pas contrôlées (contraintes NOT VALID) : rien n'est réécrit.

drop policy if exists "insert guest push" on public.push_outbox;
drop policy if exists read_own_notifications on public.push_outbox;
drop policy if exists update_notifications on public.push_outbox;

revoke all on table public.push_outbox from anon;

create policy push_outbox_update_own
  on public.push_outbox
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy push_outbox_insert_privileged
  on public.push_outbox
  for insert
  to authenticated
  with check ((select public.app_is_privileged()));

create policy push_outbox_select_privileged
  on public.push_outbox
  for select
  to authenticated
  using ((select public.app_is_privileged()));

alter table public.push_outbox
  add constraint push_outbox_internal_url
  check (url is null or url = '/' or url ~ '^/[^/\\]')
  not valid;

alter table public.push_outbox
  add constraint push_outbox_text_length
  check (char_length(coalesce(title, '')) <= 120 and char_length(coalesce(body, '')) <= 400)
  not valid;

drop policy if exists "update guest subscription" on public.push_subscriptions;
revoke select, update, delete on table public.push_subscriptions from anon;

notify pgrst, 'reload schema';
