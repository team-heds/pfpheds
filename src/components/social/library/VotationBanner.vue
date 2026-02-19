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

export default {
  name: 'VotationBanner',
  components: { Button, Tag },
  data() {
    return {
      openSessions: []
    }
  },
  async mounted() {
    await this.checkOpenSessions()
  },
  methods: {
    async checkOpenSessions() {
      try {
        const userStore = useUserStore()
        const profile = userStore.profile
        const studentClass = profile?.Classe || profile?.classe || profile?.class || profile?.Class || null

        if (!studentClass) return

        const sessions = await votationSessionService.getOpenSessionForClass(studentClass)
        this.openSessions = sessions
      } catch (error) {
        console.error('Erreur chargement sessions votation:', error)
        this.openSessions = []
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
