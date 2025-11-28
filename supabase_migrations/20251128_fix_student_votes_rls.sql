-- Temporairement, créer une policy plus permissive pour debug
-- Cette policy permet à TOUS les utilisateurs authentifiés d'insérer
drop policy if exists "Users can insert their own votes" on public.student_votes;
create policy "Users can insert their own votes"
  on public.student_votes for insert
  to authenticated
  with check (true); -- TEMPORAIRE: autoriser tout le monde pour tester

-- Également pour update
drop policy if exists "Users can update their own votes" on public.student_votes;
create policy "Users can update their own votes"
  on public.student_votes for update
  to authenticated
  using (true)
  with check (true); -- TEMPORAIRE: autoriser tout le monde pour tester
