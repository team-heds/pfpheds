-- Force-confirme les emails des comptes démo BA00
-- À exécuter dans Supabase SQL Editor si le login retourne "Invalid login credentials"

UPDATE auth.users
SET
  email_confirmed_at  = coalesce(email_confirmed_at, now()),
  confirmation_token  = '',
  recovery_token      = '',
  updated_at          = now()
WHERE email LIKE 'ba00.demo%@test-heds.ch';

-- Vérification: doit retourner 10 lignes avec email_confirmed_at non NULL
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email LIKE 'ba00.demo%@test-heds.ch'
ORDER BY email;
