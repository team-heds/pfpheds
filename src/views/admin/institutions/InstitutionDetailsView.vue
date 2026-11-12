<template>
  <section class="pt-5">
    <div class="container" data-sticky-container>
      <div class="row g-4 g-sm-5">
        <!-- Image de l'institution -->
        <div class="col-xl-4">
          <div data-sticky data-margin-top="80" data-sticky-for="992">
            <div class="row justify-content-center">
              <div class="col-md-8 col-xl-12">
                <div class="card shadow">
                  <div class="rounded-3">
                    <img :src="primaryImage" class="card-img-top" alt="institution image" @error="showInstitutionPlaceholder">
                  </div>
                </div>
              </div>
              <div>
                <h3 class="mt-4">Place de stage disponible</h3>
                <button class="btn btn-primary-soft">Postuler</button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Détails de l'institution -->
        <div class="col-xl-8">
          <h1 class="mb-4">{{ institutionDetails?.Name || 'Chargement...' }}</h1>
          <div class="card bg-light mb-4">
            <div class="card-body">
              <h4 class="card-title">Information</h4>
              <p class="card-text">
                <i class="bi bi-geo-alt-fill"></i> 
                <strong>Adresse:</strong> {{ institutionDetails?.Address || '' }}
              </p>
              <p class="card-text">
                <i class="bi bi-building"></i> 
                <strong>Lieu:</strong> {{ institutionDetails?.Locality || '' }}
              </p>
              <p class="card-text">
                <i class="bi bi-map"></i> 
                <strong>Canton:</strong> {{ institutionDetails?.Canton || '' }}
              </p>
              <p class="card-text">
                <i class="bi bi-globe"></i> 
                <strong>Langue:</strong> {{ institutionDetails?.Language || '' }}
              </p>
              <p class="card-text">
                <i class="bi bi-person-badge-fill"></i> 
                <strong>Nom Responsable Physio:</strong> {{ institutionDetails?.NomChef || '' }}
              </p>
              <p class="card-text">
                <i class="bi bi-envelope-fill"></i> 
                <strong>Email Responsable:</strong> 
                <a :href="`mailto:${institutionDetails?.MailChef}`">{{ institutionDetails?.MailChef || '' }}</a>
              </p>
              <p class="card-text">
                <i class="bi bi-telephone-fill"></i> 
                <strong>Téléphone Responsable:</strong> 
                <a :href="`tel:${institutionDetails?.PhoneChef}`">{{ institutionDetails?.PhoneChef || '' }}</a>
              </p>
              <p class="card-text">
                <i class="bi bi-link-45deg"></i> 
                <strong>Site web:</strong> 
                <a :href="institutionDetails?.URL" target="_blank">{{ institutionDetails?.URL || '' }}</a>
              </p>
            </div>
          </div>
          <InstitutionLocationMap :institution="institutionDetails" :map-link="institutionMapLink" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { institutionImageOf, showInstitutionPlaceholder } from '@/utils/institutionImage'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import InstitutionLocationMap from '@/components/map/InstitutionLocationMap.vue'

const route = useRoute()
const router = useRouter()
const institutionsStore = useInstitutionsStore()

const institutionDetails = ref(null)
// Grande carte centrée sur cette institution.
const institutionMapLink = computed(() => {
  const id = institutionDetails.value?.InstitutionId ?? institutionDetails.value?.id
  return id != null ? { name: 'Map', query: { institution: String(id) } } : ''
})
const isLoading = ref(true)

const institutionId = computed(() => route.params.id)

const primaryImage = computed(() => institutionImageOf(institutionDetails.value))

onMounted(async () => {
  await fetchInstitutionDetails()
})

watch(institutionId, async (newId) => {
  if (newId) {
    await fetchInstitutionDetails()
  }
})

async function fetchInstitutionDetails() {
  if (!institutionId.value) return
  
  isLoading.value = true
  try {
    const institution = await institutionsStore.fetchInstitutionById(institutionId.value)
    
    if (institution) {
      institutionDetails.value = institution
    } else {
      router.push({ name: 'Error404' })
    }
  } catch (error) {
    console.error('❌ Erreur chargement institution:', error)
    router.push({ name: 'Error404' })
  } finally {
    isLoading.value = false
  }
}

</script>

<style scoped>
.card-img-top {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: cover;
}
</style>
