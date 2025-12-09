<template>
  <div class="card h-full flex flex-column justify-content-between relative overflow-hidden surface-card p-4 border-round-xl shadow-2">
    <!-- Background Decoration -->
    <div class="absolute top-0 right-0 opacity-10" style="transform: translate(30%, -30%);">
      <i class="pi pi-spin pi-cog text-900" style="font-size: 10rem;"></i>
    </div>

    <div class="z-1">
      <div class="flex align-items-center gap-2 mb-3">
        <i class="pi pi-ticket text-primary text-xl"></i>
        <span class="font-bold text-lg text-900">Roue Quotidienne</span>
      </div>
      
      <div v-if="loading" class="flex justify-content-center p-4">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
      </div>

      <div v-else-if="wheelStore.backendFunctionMissing" class="text-center py-2 text-orange-500 surface-50 border-round p-3">
        <i class="pi pi-database text-2xl mb-2"></i>
        <p class="font-bold mb-1">Configuration Manquante</p>
        <p class="text-sm mb-3 text-700">Le moteur du jeu n'est pas installé sur Supabase.</p>
        <div class="text-left text-xs bg-black-alpha-10 p-2 border-round text-700 overflow-hidden text-overflow-ellipsis">
          Exécutez le script SQL: <br>
          <span class="font-mono text-primary">20251209_daily_wheel_logic.sql</span>
        </div>
        <Button label="Réessayer" icon="pi pi-refresh" class="mt-3 p-button-sm p-button-outlined" @click="wheelStore.checkStatus()" />
      </div>

      <div v-else-if="wheelStore.error" class="text-center py-2 text-red-500">
        <i class="pi pi-exclamation-triangle text-2xl mb-2"></i>
        <p class="font-bold">Erreur de chargement</p>
        <p class="text-sm mb-3">Impossible de vérifier le statut de la roue.</p>
        <Button label="Réessayer" icon="pi pi-refresh" class="p-button-sm p-button-outlined p-button-danger" @click="wheelStore.checkStatus()" />
      </div>

      <div v-else>
        <div v-if="wheelStore.canSpin">
          <p class="text-600 mb-4 line-height-3">
            Votre tour quotidien est disponible ! Tentez votre chance pour gagner de l'XP ou des bonus.
          </p>
          <Button 
            label="Tourner la roue" 
            icon="pi pi-star-fill" 
            class="w-full p-button-raised p-button-lg"
            @click="wheelStore.openModal()"
          />
        </div>

        <div v-else class="text-center py-2">
          <div class="mb-3">
            <i class="pi pi-check-circle text-green-500 text-4xl"></i>
          </div>
          <p class="font-bold text-900 mb-2">Déjà joué aujourd'hui !</p>
          <p class="text-sm text-600 mb-3">
            Revenez demain pour un nouveau tirage.
          </p>
          <div v-if="wheelStore.lastResult" class="surface-100 p-2 border-round text-sm">
            Dernier gain : <strong>{{ wheelStore.lastResult.label }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- The Modal Component is mounted here but hidden by default -->
    <DailyWheelModal />
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useDailyWheelStore } from '@/stores/dailyWheelStore'
import Button from 'primevue/button'
import DailyWheelModal from './DailyWheelModal.vue'

const wheelStore = useDailyWheelStore()
const loading = computed(() => wheelStore.loading)

onMounted(() => {
  wheelStore.checkStatus()
})
</script>
