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
      const { data: rows, error } = await supabase.rpc('api_my_permissions');
      if (error) {
        console.error('Erreur chargement permissions:', error);
        perms.value = [];
        return;
      }
      perms.value = (rows || []).map(r => r.perm);
      console.log('✅ Permissions chargées depuis DB:', perms.value);
    } catch (e) {
      console.error('Erreur RPC api_my_permissions:', e);
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
