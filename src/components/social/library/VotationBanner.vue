<template>
  <div v-if="openSessions.length > 0" class="votation-banner">
    <div class="banner-header">
      <i class="pi pi-megaphone"></i>
      <h4>Votation ouverte</h4>
    </div>
    <div v-for="session in openSessions" :key="session.id" class="session-card">
      <div class="session-info">
        <Tag :value="session.pfp_type" severity="primary" class="mb-1" />
        <span class="session-year">{{ session.year }}</span>
      </div>
      <p class="session-text">
        La votation <strong>{{ session.pfp_type }}</strong> est ouverte !
      </p>
      <router-link :to="`/votation/${session.pfp_type}`" class="vote-link">
        <Button
          label="Aller voter"
          icon="pi pi-arrow-right"
          iconPos="right"
          size="small"
          class="w-full"
        />
      </router-link>
    </div>
  </div>
</template>

<script>
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import votationSessionService from '@/service/votationSessionService'
import { useUserStore } from '@/stores/userStore'
import { supabase } from '@/supabase'

export default {
  name: 'VotationBanner',
  components: { Button, Tag },
  data() {
    return {
      openSessions: [],
      realtimeChannel: null
    }
  },
  async mounted() {
    await this.checkOpenSessions()
    this.subscribeRealtime()
  },
  beforeUnmount() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel)
    }
  },
  methods: {
    async checkOpenSessions() {
      try {
        const userStore = useUserStore()
        let profile = userStore.profile

        // Si le profil n'est pas encore chargé, attendre qu'il le soit
        if (!profile && userStore.user) {
          await userStore.fetchProfile()
          profile = userStore.profile
        }

        const studentClass = profile?.Classe || profile?.classe || profile?.class || profile?.Class || null
        const currentUserId = profile?.user_id || userStore.user?.id || null

        console.log('🎯 VotationBanner - profile:', profile?.user_id, 'classe:', studentClass, 'userId:', currentUserId)

        if (!studentClass) {
          // Pas de classe — essayer de récupérer toutes les sessions ouvertes et filtrer par userId
          if (!currentUserId) return
          const allSessions = await votationSessionService.getAllActiveSessions()
          this.openSessions = allSessions.filter(s => {
            if (s.is_priority && Array.isArray(s.priority_user_ids)) {
              return s.priority_user_ids.includes(currentUserId)
            }
            return false // Sans classe, on ne montre que les sessions prioritaires où l'étudiant est listé
          })
          console.log('🎯 VotationBanner (sans classe) - sessions:', this.openSessions.length)
          return
        }

        // 1. Sessions normales pour la classe de l'étudiant
        const classSessions = await votationSessionService.getOpenSessionForClass(studentClass)

        // 2. Sessions prioritaires où l'étudiant est listé (peu importe la classe)
        const allSessions = await votationSessionService.getAllActiveSessions()
        const prioritySessions = currentUserId
          ? allSessions.filter(s => s.is_priority && Array.isArray(s.priority_user_ids) && s.priority_user_ids.includes(currentUserId))
          : []

        // Fusionner sans doublons
        const sessionMap = new Map()
        classSessions.forEach(s => {
          // Sessions normales : afficher sauf si prioritaire et l'étudiant n'y est pas
          if (s.is_priority && Array.isArray(s.priority_user_ids)) {
            if (currentUserId && s.priority_user_ids.includes(currentUserId)) {
              sessionMap.set(s.id, s)
            }
          } else {
            sessionMap.set(s.id, s)
          }
        })
        prioritySessions.forEach(s => sessionMap.set(s.id, s))

        this.openSessions = Array.from(sessionMap.values())
        console.log('🎯 VotationBanner - sessions filtrées:', this.openSessions.length, '(classe:', classSessions.length, '+ prio:', prioritySessions.length, ')')
      } catch (error) {
        console.error('Erreur chargement sessions votation:', error)
        this.openSessions = []
      }
    },
    subscribeRealtime() {
      try {
        this.realtimeChannel = supabase
          .channel('votation-sessions-realtime')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'votation_sessions'
          }, () => {
            // Recharger les sessions quand il y a un changement
            this.checkOpenSessions()
          })
          .subscribe()
      } catch (error) {
        console.error('Erreur souscription realtime votation:', error)
      }
    }
  }
}
</script>

<style scoped>
.votation-banner {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.banner-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.banner-header i {
  color: var(--primary-color);
  font-size: 1.2rem;
}

.banner-header h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 0.95rem;
  font-weight: 600;
}

.session-card {
  padding: 0.5rem 0;
}

.session-card + .session-card {
  border-top: 1px solid var(--surface-border);
  padding-top: 0.75rem;
  margin-top: 0.5rem;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.session-year {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.session-text {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  margin: 0.25rem 0 0.5rem 0;
}

.vote-link {
  text-decoration: none;
}
</style>
