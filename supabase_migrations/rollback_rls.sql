-- Script de rollback : Désactive le RLS pour revenir au fonctionnement normal
-- À exécuter dans Supabase SQL Editor

-- 1. Désactiver RLS sur modules
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;

-- 2. Désactiver RLS sur user_roles
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- 3. Supprimer toutes les politiques RLS
DROP POLICY IF EXISTS "Responsables can view own modules" ON modules;
DROP POLICY IF EXISTS "Responsables can update own modules" ON modules;
DROP POLICY IF EXISTS "Admins can create modules" ON modules;
DROP POLICY IF EXISTS "Admins can delete modules" ON modules;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE '✅ RLS désactivé - Les modules sont à nouveau accessibles à tous';
  RAISE NOTICE '⚠️ Attention: Aucune restriction d''accès n''est active';
END $$;
