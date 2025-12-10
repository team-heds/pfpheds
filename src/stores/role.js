import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/supabase';

export const useRoleStore = defineStore('role', () => {
  // State
  const session = ref(null);
  const perms = ref([]);
  const initialized = ref(false);

  // Getters
  const isSuper = computed(() => perms.value.includes('super.all'));

  // Actions
  async function init() {
    if (initialized.value) return;
    
    const { data } = await supabase.auth.getSession();
    session.value = data.session ?? null;

    // Charger permissions depuis DB via RPC (source unique de vérité)
    await loadPermissions();

    // Écouter les changements d'auth pour recharger
    supabase.auth.onAuthStateChange(async (_e, s) => {
      session.value = s;
      if (s) {
        await loadPermissions();
      } else {
        perms.value = [];
      }
    });

    initialized.value = true;
  }

  async function loadPermissions() {
    try {
      const permsSet = new Set();

      // 1. Tenter via RPC (source principale idéale)
      try {
        const { data: rows, error } = await supabase.rpc('api_my_permissions');
        if (!error && rows) {
          rows.forEach(r => permsSet.add(r.perm));
        }
      } catch (e) {
        console.warn('RPC api_my_permissions failed or empty', e);
      }

      // 2. Fallback / Complément : Lire depuis user_profiles
      // C'est ici que l'Admin Panel écrit (colonnes 'role' et 'permissions')
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, permissions')
          .eq('user_id', user.id)
          .single();
        
        if (!profileError && profile) {
          // Ajouter le rôle comme permission (ex: 'admin')
          if (profile.role) {
            permsSet.add(profile.role);
          }
          // Ajouter les permissions explicites stockées en JSON/Array
          if (Array.isArray(profile.permissions)) {
            profile.permissions.forEach(p => permsSet.add(p));
          }
        }
      }

      perms.value = Array.from(permsSet);
      console.log('✅ Permissions consolidées (RPC + user_profiles):', perms.value);
    } catch (e) {
      console.error('Erreur globale loadPermissions:', e);
      perms.value = [];
    }
  }

  function can(perm) {
    if (Array.isArray(perm)) {
      if (perm.includes('public') || perm.includes('anonymous')) return true;
      if (perm.includes('authenticated')) return !!session.value;
      return isSuper.value || perm.some(p => perms.value.includes(p));
    }
    if (perm === 'public' || perm === 'anonymous') return true;
    if (perm === 'authenticated') return !!session.value;
    return isSuper.value || perms.value.includes(perm);
  }

  return {
    session,
    perms,
    initialized,
    isSuper,
    init,
    can,
  };
});
