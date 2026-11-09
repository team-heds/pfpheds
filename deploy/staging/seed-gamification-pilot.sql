-- HEDS25-617 safety guard.
--
-- The former seed modified every gamification profile in the copied database.
-- Pilot data must now be installed through the audited, participant-scoped RPC
-- after creating the two synthetic accounts outside the repository:
--
--   node deploy/staging/prepare-gamification-pilot-accounts.mjs
--   node deploy/staging/run-gamification-pilot.mjs
--
-- Keep this file as a hard failure so an old operational command can never
-- silently seed all copied users again.

do $$
begin
  raise exception
    'Unsafe global pilot seed retired by HEDS25-617; use the scoped pilot scripts';
end
$$;
