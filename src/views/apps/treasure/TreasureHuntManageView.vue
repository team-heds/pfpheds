<template>
  <Navbar />
  <main class="th-page" data-page-scroll>
    <div class="th-shell">
      <GamificationPageHeader
        title="Gérer les chasses au trésor"
        description="Créez une chasse, ajoutez ses étapes, imprimez les QR codes et suivez le classement."
        icon="pi pi-pencil"
        @back="router.push(TREASURE_HUNT_PATH)"
      >
        <template #actions>
          <Button v-if="allowed" label="Nouvelle chasse" icon="pi pi-plus" class="th-primary th-touch" @click="router.push(`${TREASURE_HUNT_MANAGE_PATH}/nouvelle`)" />
        </template>
      </GamificationPageHeader>

      <section v-if="loading" class="th-panel th-state" aria-busy="true" role="status">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <div><h2>Chargement des chasses</h2><p class="th-muted">Un instant…</p></div>
      </section>

      <section v-else-if="error" class="th-panel th-state" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <div>
          <h2>Les chasses n’ont pas pu être chargées</h2>
          <p class="th-muted">Vérifiez votre connexion puis réessayez.</p>
          <div class="th-actions th-gap"><Button label="Réessayer" icon="pi pi-refresh" @click="load" /></div>
        </div>
      </section>

      <section v-else-if="!allowed" class="th-panel th-state" role="alert">
        <i class="pi pi-lock" aria-hidden="true"></i>
        <div>
          <h2>Accès réservé</h2>
          <p class="th-muted">La gestion des chasses au trésor est réservée à l’administration, aux enseignants et aux maîtres du jeu.</p>
        </div>
      </section>

      <section v-else-if="!hunts.length" class="th-panel th-state">
        <i class="pi pi-map" aria-hidden="true"></i>
        <div>
          <h2>Aucune chasse pour le moment</h2>
          <p class="th-muted">Créez votre première chasse : elle reste en brouillon, invisible des joueurs, tant que vous ne la publiez pas.</p>
          <div class="th-actions th-gap">
            <Button label="Nouvelle chasse" icon="pi pi-plus" class="th-primary" @click="router.push(`${TREASURE_HUNT_MANAGE_PATH}/nouvelle`)" />
          </div>
        </div>
      </section>

      <ul v-else class="manage-list">
        <li v-for="hunt in hunts" :key="hunt.id" class="th-panel manage-card">
          <div class="manage-card__main">
            <div class="manage-card__head">
              <h2>{{ hunt.title }}</h2>
              <Tag :value="huntStateLabel(hunt.state)" :severity="huntStateSeverity(hunt.state)" />
            </div>
            <p class="th-meta">
              <span><i class="pi pi-calendar" aria-hidden="true"></i>{{ formatHuntPeriod(hunt.starts_at, hunt.ends_at) }}</span>
              <span><i class="pi pi-users" aria-hidden="true"></i>{{ classesLabel(hunt.target_classes) }}</span>
              <span><i class="pi pi-list" aria-hidden="true"></i>{{ hunt.step_count }} étape{{ hunt.step_count > 1 ? 's' : '' }}</span>
              <span><i class="pi pi-user" aria-hidden="true"></i>{{ hunt.player_count }} participant{{ hunt.player_count > 1 ? 's' : '' }}, {{ hunt.completed_count }} à 100 %</span>
            </p>
          </div>
          <div class="th-actions">
            <Button label="Modifier" icon="pi pi-pencil" :aria-label="`Modifier : ${hunt.title}`" @click="router.push(`${TREASURE_HUNT_MANAGE_PATH}/${hunt.id}`)" />
            <Button
              label="Imprimer"
              icon="pi pi-print"
              outlined
              :disabled="!hunt.step_count"
              :aria-label="`Imprimer les QR codes : ${hunt.title}`"
              @click="router.push(`${TREASURE_HUNT_MANAGE_PATH}/${hunt.id}/impression`)"
            />
          </div>
        </li>
      </ul>
    </div>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Navbar from '@/components/common/utils/Navbar.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import {
  TREASURE_HUNT_MANAGE_PATH,
  TREASURE_HUNT_PATH,
  classesLabel,
  formatHuntPeriod,
  huntStateLabel,
  huntStateSeverity,
  manageListTreasureHunts,
} from '@/service/treasureHuntService'
import './treasure-shared.css'

const router = useRouter()
const loading = ref(true)
const error = ref(false)
const allowed = ref(false)
const hunts = ref([])

async function load() {
  loading.value = true
  error.value = false
  try {
    const data = await manageListTreasureHunts()
    allowed.value = Boolean(data.allowed)
    hunts.value = data.hunts || []
  } catch (cause) {
    console.error('Chargement des chasses impossible:', cause)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.th-gap { margin-top: 1rem; }
.manage-list { display: grid; gap: 1rem; margin: 0; padding: 0; list-style: none; }
.manage-card { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
.manage-card__main { display: grid; flex: 1 1 22rem; gap: .6rem; min-width: 0; }
.manage-card__head { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem 1rem; }
.manage-card__head h2 { font-size: 1.15rem; overflow-wrap: anywhere; }
</style>
