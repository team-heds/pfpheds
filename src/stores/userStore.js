import { defineStore } from 'pinia'
import { supabase } from '@/supabase.js'

export const useUserStore = defineStore('user', {
  state: () => ({
    session: null,
    user: null,
    authLoading: false,
    initialized: false,
    initPromise: null,

    profile: null,
    profileLoading: false,
    profilePromise: null,
    profileChannel: null,

    authSub: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user
  },

  actions: {
    async init({ session: resolvedSession = null, sessionResolved = false } = {}) {
      if (this.initialized) return
      if (this.initPromise) return this.initPromise

      this.initPromise = (async () => {
        if (sessionResolved) {
          this.session = resolvedSession || null
        } else {
          const { data, error } = await supabase.auth.getSession()
          if (error) throw error
          this.session = data?.session || null
        }
        this.user = this.session?.user || null

        if (!this.authSub) {
          const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            this.session = session
            this.user = session?.user || null
            const expectedUserId = this.user?.id || null

            if (!expectedUserId) {
              this.unsubscribeProfile()
              this.profile = null
              return
            }

            queueMicrotask(() => {
              if (this.user?.id !== expectedUserId) return
              this.fetchProfile()
                .then(() => {
                  if (this.user?.id === expectedUserId) this.subscribeProfile()
                })
                .catch((profileError) => {
                  console.error('[UserStore] Failed to refresh profile after auth change:', profileError)
                })
            })
          })
          this.authSub = sub?.subscription || sub
        }

        if (this.user) {
          await this.fetchProfile()
          this.subscribeProfile()
        }

        this.initialized = true
      })()

      try {
        await this.initPromise
      } finally {
        this.initPromise = null
      }
    },

    dispose() {
      if (this.authSub) {
        this.authSub.unsubscribe()
        this.authSub = null
      }
      this.unsubscribeProfile()
      this.initialized = false
      this.initPromise = null
      this.profilePromise = null
    },

    async fetchProfile() {
      if (!this.user) {
        this.profile = null
        return null
      }

      if (this.profilePromise) {
        return this.profilePromise
      }

      this.profileLoading = true
      this.profilePromise = (async () => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', this.user.id)
            .maybeSingle()

          if (error) throw error
          this.profile = data || null
          return this.profile
        } finally {
          this.profileLoading = false
        }
      })()

      try {
        return await this.profilePromise
      } finally {
        this.profilePromise = null
      }
    },

    async upsertProfile(fields) {
      if (!this.user) throw new Error('Non connecté')

      const row = {
        user_id: this.user.id,
        ...fields
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
              filter: `user_id=eq.${this.user.id}`
            },
            (payload) => {
              if (payload.eventType === 'DELETE') {
                this.profile = null
              } else {
                this.profile = payload.new
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR') {
              console.warn('[UserStore] Realtime subscription error:', err)
            } else if (status === 'TIMED_OUT') {
              console.warn('[UserStore] Realtime subscription timed out')
            }
          })
      } catch (error) {
        console.error('[UserStore] Failed to subscribe to profile updates:', error)
        this.profileChannel = null
      }
    },

    unsubscribeProfile() {
      if (this.profileChannel) {
        supabase.removeChannel(this.profileChannel)
        this.profileChannel = null
      }
    },

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
        this.subscribeProfile()
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
        this.profilePromise = null
        this.unsubscribeProfile()
      } finally {
        this.authLoading = false
      }
    }
  }
})
