import { defineStore } from 'pinia'
import { supabase } from '@/supabase.js'

export const useUserStore = defineStore('user', {
  state: () => ({
    // Auth
    session: null,
    user: null,
    authLoading: false,

    // Profil
    profile: null,
    profileLoading: false,
    profileChannel: null,

    // Subscriptions
    authSub: null,
  }),

  getters: {
    isAuthenticated: (s) => !!s.user,
  },

  actions: {
    // Appeler une seule fois au boot (ex: dans App.vue ou dans un guard)
    async init() {
      // Session initiale
      const { data } = await supabase.auth.getSession()
      this.session = data?.session || null
      this.user = this.session?.user || null

      // Écoute des changements d’auth
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user || null
        // Recharger/vider profil selon connexion
        if (this.user) {
          this.fetchProfile()
          // ❌ Realtime désactivé
          // this.subscribeProfile()
        } else {
          // ❌ Realtime désactivé
          // this.unsubscribeProfile()
          this.profile = null
        }
      })
      this.authSub = sub
      // Charger si déjà connecté (sans Realtime)
      if (this.user) {
        await this.fetchProfile()
        // ❌ Realtime désactivé
        // this.subscribeProfile()
      }
    },

    // Nettoyage (ex: avant app destroy)
    dispose() {
      if (this.authSub) this.authSub.unsubscribe()
      // ❌ Realtime désactivé
      // this.unsubscribeProfile()
    },

    async fetchProfile() {
      if (!this.user) { this.profile = null; return }
      this.profileLoading = true
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', this.user.id)
          .maybeSingle()
        if (error) throw error
        this.profile = data || null
      } finally {
        this.profileLoading = false
      }
    },

    // Upsert hybride: colonnes dédiées + JSONB
    // fields peut contenir: { mail, prenom, nom, username, photo_url, ville, roles, communities, gamification, messages, extra }
    async upsertProfile(fields) {
      if (!this.user) throw new Error('Non connecté')
      const row = {
        user_id: this.user.id,
        ...fields,
      }
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(row, { onConflict: 'user_id' })
        .select()
        .single()
      if (error) throw error
      this.profile = data
      return data
    },

    subscribeProfile() {
      if (!this.user || this.profileChannel) return
      
      try {
        this.profileChannel = supabase
          .channel(`user_profile:${this.user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_profiles',
              filter: `user_id=eq.${this.user.id}`,
            },
            (payload) => {
              console.log('📡 [UserStore] Profile update received:', payload.eventType)
              if (payload.eventType === 'DELETE') {
                this.profile = null
              } else {
                // INSERT/UPDATE: payload.new contient la ligne complète
                this.profile = payload.new
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ [UserStore] Profile realtime subscription active')
            } else if (status === 'CHANNEL_ERROR') {
              console.warn('⚠️ [UserStore] Realtime subscription error:', err)
              console.log('ℹ️ [UserStore] App will continue without realtime updates')
            } else if (status === 'TIMED_OUT') {
              console.warn('⚠️ [UserStore] Realtime subscription timed out')
              console.log('ℹ️ [UserStore] App will continue without realtime updates')
            } else if (status === 'CLOSED') {
              console.log('🔌 [UserStore] Realtime subscription closed')
            }
          })
      } catch (error) {
        console.error('❌ [UserStore] Failed to subscribe to profile updates:', error)
        console.log('ℹ️ [UserStore] App will continue without realtime updates')
        this.profileChannel = null
      }
    },

    unsubscribeProfile() {
      if (this.profileChannel) {
        supabase.removeChannel(this.profileChannel)
        this.profileChannel = null
      }
    },

    // Helpers d’auth si tu veux les centraliser dans le store
    async signUp(email, password) {
      this.authLoading = true
      try {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } finally {
        this.authLoading = false
      }
    },


    async signIn(email, password) {
      this.authLoading = true
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        this.session = data.session
        this.user = data.user
        await this.fetchProfile()
        // ❌ Realtime désactivé
        // this.subscribeProfile()
      } finally {
        this.authLoading = false
      }
    },

    async signOut() {
      this.authLoading = true
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        this.session = null
        this.user = null
        this.profile = null
        // ❌ Realtime désactivé
        // this.unsubscribeProfile()
      } finally {
        this.authLoading = false
      }
    },
  },
})