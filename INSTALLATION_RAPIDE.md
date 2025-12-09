# ⚡ Installation Rapide - Fonctions Admin

## 🎯 Tu as l'erreur "Could not find the function admin_create_user" ?

**Solution en 3 étapes** :

---

## 📋 Étape 1 : Copier le Script SQL

Ouvre le fichier : `supabase/migrations/INSTALLER_FONCTIONS_ADMIN.sql`

**OU** copie directement ce script :

```sql
-- COPIE TOUT CE SCRIPT ET COLLE-LE DANS SUPABASE SQL EDITOR

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.admin_create_user(
  user_email TEXT,
  user_password TEXT,
  user_forname TEXT DEFAULT '',
  user_family_name TEXT DEFAULT '',
  user_role TEXT DEFAULT 'student'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid()::text 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can create users';
  END IF;

  new_user_id := uuid_generate_v4();

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(), NOW(), NOW(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('forname', user_forname, 'family_name', user_family_name, 'role', user_role),
    FALSE, 'authenticated', 'authenticated'
  );

  INSERT INTO public.user_profiles (
    user_id, email, forname, family_name, role, is_active, created_at, updated_at
  )
  VALUES (
    new_user_id::text, user_email, user_forname, user_family_name, user_role, TRUE, NOW(), NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  result := json_build_object('user_id', new_user_id, 'email', user_email, 'role', user_role, 'success', true);
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE public.user_profiles.user_id = auth.uid()::text 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can delete users';
  END IF;

  DELETE FROM public.user_profiles WHERE public.user_profiles.user_id = delete_user.user_id::text;
  DELETE FROM auth.users WHERE id = delete_user.user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
```

---

## 📝 Étape 2 : Exécuter dans Supabase

1. Va sur **Supabase Dashboard**
2. Menu de gauche → **SQL Editor**
3. Clique **"New query"**
4. **Colle le script** ci-dessus
5. Clique **"RUN"** (bouton vert en bas à droite)

✅ Tu devrais voir : **"Success. No rows returned"**

---

## ✅ Étape 3 : Vérifier l'Installation

**Dans le même SQL Editor**, exécute cette requête :

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('admin_create_user', 'delete_user');
```

**Résultat attendu** :
```
routine_name
-----------------
admin_create_user
delete_user
```

✅ **Si tu vois ces 2 lignes, c'est bon !**

---

## 🎉 C'est Prêt !

Maintenant tu peux :
- ✅ **Créer des utilisateurs** sans te déconnecter
- ✅ **Supprimer des utilisateurs** complètement

**Retourne dans ton interface admin et teste !**

---

## ❌ En Cas de Problème

### Erreur "permission denied for schema auth"
➡️ Tu n'es pas connecté en tant qu'admin dans Supabase

### Erreur "function crypt does not exist"
➡️ Vérifie que `CREATE EXTENSION IF NOT EXISTS "pgcrypto";` est exécuté

### Les fonctions n'apparaissent pas
➡️ Recharge la page Supabase et vérifie à nouveau

---

**Besoin d'aide ?** Regarde le fichier `GESTION_UTILISATEURS_ADMIN.md` pour plus de détails.
