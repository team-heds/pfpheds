-- Sécurité : retirer aux visiteurs non connectés les coordonnées visibles dans modules et institutions.
--
-- Constat en production (23.11.2026) : sans connexion, on pouvait lire les noms et e-mails des
-- responsables de modules, ainsi que les noms, e-mails et téléphones des chefs d'institution.
--
-- - modules : le calendrier reste public, sans responsable, e-mail ni coordinateur.
-- - institutions : toutes les pages exigent une connexion, le rôle anon n'a donc plus de lecture.
-- Les comptes connectés et le backend (service_role) ne changent pas.
-- À appliquer APRÈS le déploiement du front, qui ne demande plus select=* sur modules.
-- Migration rejouable.

revoke select on table public.modules from anon;
grant select (
  id, code, short_code, number, title, color, description, year, credits,
  heures_contact, track_id, created_at, updated_at
) on table public.modules to anon;

revoke select on table public.institutions from anon;

notify pgrst, 'reload schema';
