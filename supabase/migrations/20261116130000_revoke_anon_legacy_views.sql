-- Sécurité : fermer l'accès anonyme aux anciennes vues qui contournent les règles d'accès.
--
-- Faille corrigée (antérieure au 9 novembre, trouvée pendant l'audit de sécurité) : ces vues
-- appartiennent à postgres et ne sont pas en « security_invoker » ; elles lisent donc les
-- tables sans appliquer leurs règles RLS. Elles étaient pourtant ouvertes au rôle anonyme :
-- n'importe qui, avec la clé publique du site, pouvait lire par exemple
-- studentsphysio_with_profiles (nom, prénom, e-mail, classe, cas particulier et note de
-- chaque étudiant).
--
-- Maintenant :
--   - aucune de ces vues n'est lisible sans connexion ;
--   - les trois vues de données personnelles que l'application n'utilise plus
--     (studentsphysio_with_profiles, student_progress_details, responsable_stats) ne sont
--     plus lisibles non plus par les comptes connectés (l'administration passe par les tables
--     protégées).
-- events_with_counts est déjà en « security_invoker » et n'est pas touchée.

revoke all on table public.academic_tickets_stats from anon;
revoke all on table public.buckets from anon;
revoke all on table public.capsules_with_stats from anon;
revoke all on table public.house_leaderboard from anon;
revoke all on table public.popular_badges from anon;
revoke all on table public.responsable_stats from anon, authenticated;
revoke all on table public.result_statistics from anon;
revoke all on table public.student_progress_details from anon, authenticated;
revoke all on table public.studentsphysio_with_profiles from anon, authenticated;
revoke all on table public.v_role_permissions from anon;
revoke all on table public.vote_place_aggregation from anon;
revoke all on table public.vote_statistics from anon;

notify pgrst, 'reload schema';
