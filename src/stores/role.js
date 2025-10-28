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

    // helper: normalize specific permission naming differences from RPC
    const normalizePerm = (p) => {
      const mapAccess = new Set([
        'AdminPhysio.access',
        'AdminSoins.access',
        'EnseignantPhysio.access',
        'EnseignantSoins.access',
        'EtudiantPhysio.access',
        'EtudiantSoins.access',
        'RMSoins.access',
      ]);
      if (p === 'page1') return 'page1.access';
      if (p === 'page2') return 'page2.access';
      if (mapAccess.has(p)) return p.replace('.access', '');
      return p;
    };

    if (session.value) {
      // Récupérer les deux sources
      const { data: rows, error } = await supabase.rpc('api_my_permissions');
      const rpcPerms = (!error && rows) ? (rows ?? []).map((r) => normalizePerm(r.perm)) : [];
      const mdPerms = session.value?.user?.user_metadata?.permissions;
      const metaPerms = Array.isArray(mdPerms) ? mdPerms.map(normalizePerm) : [];

      // Fusionner et dédupliquer
      const merged = Array.from(new Set([ ...rpcPerms, ...metaPerms ]));
      perms.value = merged;
    }

    supabase.auth.onAuthStateChange(async (_e, s) => {
      session.value = s;
      if (s) {
        // Recharger et fusionner les permissions
        try {
          const { data: rows, error } = await supabase.rpc('api_my_permissions');
          const rpcPerms = (!error && rows) ? (rows ?? []).map((r) => normalizePerm(r.perm)) : [];
          const mdPerms = s.user?.user_metadata?.permissions;
          const metaPerms = Array.isArray(mdPerms) ? mdPerms.map(normalizePerm) : [];
          perms.value = Array.from(new Set([ ...rpcPerms, ...metaPerms ]));
        } catch {
          const mdPerms = s.user?.user_metadata?.permissions;
          const metaPerms = Array.isArray(mdPerms) ? mdPerms.map(normalizePerm) : [];
          perms.value = Array.from(new Set(metaPerms));
        }
      } else {
        perms.value = [];
      }
    });

    initialized.value = true;
  }

  function can(perm) {
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
