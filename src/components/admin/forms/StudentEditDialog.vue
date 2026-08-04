<template>
  <Dialog 
    :visible="visible"
    @update:visible="(val) => emit('update:visible', val)"
    modal 
    :header="dialogTitle"
    :style="{ width: '50vw' }"
    :breakpoints="{ '960px': '75vw', '640px': '95vw' }"
    @hide="closeDialog"
  >
    <div class="p-fluid">
      <Toast />
      
      <!-- Loading state -->
      <div v-if="loading" class="flex justify-content-center align-items-center" style="min-height: 300px;">
        <ProgressSpinner />
      </div>

      <!-- Form -->
      <form v-else id="student-edit-form" @submit.prevent="saveStudent">
        <FormSection title="Identité et inscription" description="Modifiez les informations principales de l’étudiant." icon="pi pi-user-edit">
        <div class="grid">
        <!-- Prénom -->
        <div class="field col-12 md:col-6">
          <label for="forname" class="font-semibold">Prénom</label>
          <InputText 
            id="forname" 
            v-model="formData.forname" 
            required 
            :class="{ 'p-invalid': errors.forname }"
          />
          <small v-if="errors.forname" class="p-error">{{ errors.forname }}</small>
        </div>

        <!-- Nom -->
        <div class="field col-12 md:col-6">
          <label for="family_name" class="font-semibold">Nom</label>
          <InputText 
            id="family_name" 
            v-model="formData.family_name" 
            required
            :class="{ 'p-invalid': errors.family_name }"
          />
          <small v-if="errors.family_name" class="p-error">{{ errors.family_name }}</small>
        </div>

        <!-- Email -->
        <div class="field col-12 md:col-6">
          <label for="email" class="font-semibold">Email</label>
          <InputText 
            id="email" 
            v-model="formData.email" 
            type="email"
            required
            :class="{ 'p-invalid': errors.email }"
          />
          <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
        </div>

        <!-- Classe -->
        <div class="field col-12 md:col-6">
          <label for="class" class="font-semibold">Classe</label>
          <Dropdown
            id="class"
            v-model="formData.class"
            :options="classOptions"
            placeholder="Sélectionner une classe"
            :class="{ 'p-invalid': errors.class }"
          />
          <small v-if="errors.class" class="p-error">{{ errors.class }}</small>
        </div>

        <!-- SAE (Cas Particulier) -->
        <div class="field col-12 md:col-6">
          <div class="flex align-items-center">
            <Checkbox 
              id="sae" 
              v-model="formData.sae" 
              :binary="true"
            />
            <label for="sae" class="ml-2 font-semibold">SAE (Cas Particulier)</label>
          </div>
        </div>

        <!-- Cas Particulier (texte) -->
        <div class="field col-12 md:col-6">
          <label for="cas_particulier" class="font-semibold">Détails cas particulier</label>
          <InputText 
            id="cas_particulier" 
            v-model="formData.cas_particulier"
            placeholder="Optionnel"
          />
        </div>
        </div>
        </FormSection>
      </form>
    </div>

    <template #footer>
      <Button label="Annuler" icon="pi pi-times" text @click="closeDialog" :disabled="saving" />
      <Button 
        label="Enregistrer" 
        icon="pi pi-check" 
        @click="saveStudent" 
        :loading="saving"
        :disabled="loading"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import Toast from 'primevue/toast'
import { supabase } from '@/supabase'
import FormSection from '@/components/common/forms/FormSection.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  studentId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'student-updated'])

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const errors = ref({})

const classOptions = ['BA22', 'BA23', 'BA24', 'BA25']

const formData = ref({
  user_id: null,
  forname: '',
  family_name: '',
  email: '',
  class: '',
  sae: false,
  cas_particulier: ''
})

const dialogTitle = computed(() => {
  return props.studentId ? 'Modifier l\'étudiant' : 'Nouvel étudiant'
})

// Watch pour charger les données quand le dialog s'ouvre
watch(() => props.visible, async (newVal) => {
  if (newVal && props.studentId) {
    await loadStudentData()
  } else if (newVal && !props.studentId) {
    resetForm()
  }
})

const loadStudentData = async () => {
  loading.value = true
  errors.value = {}
  
  try {
    // Charger depuis user_profiles
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, forname, family_name, email')
      .eq('user_id', props.studentId)
      .single()

    if (profileError) throw profileError

    // Charger depuis StudentsPhysio
    const { data: physioData, error: physioError } = await supabase
      .from('StudentsPhysio')
      .select('*')
      .eq('user_id', props.studentId)
      .single()

    // Fusionner les données
    formData.value = {
      user_id: profileData.user_id,
      forname: profileData.forname || '',
      family_name: profileData.family_name || '',
      email: profileData.email || '',
      class: physioData?.class || '',
      sae: physioData?.sae === 'true' || physioData?.sae === true || false,
      cas_particulier: physioData?.cas_particulier || ''
    }

  } catch (error) {
    console.error('Erreur lors du chargement de l\'étudiant:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données de l\'étudiant',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!formData.value.forname?.trim()) {
    errors.value.forname = 'Le prénom est requis'
    isValid = false
  }

  if (!formData.value.family_name?.trim()) {
    errors.value.family_name = 'Le nom est requis'
    isValid = false
  }

  if (!formData.value.email?.trim()) {
    errors.value.email = 'L\'email est requis'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    errors.value.email = 'Email invalide'
    isValid = false
  }

  return isValid
}

const saveStudent = async () => {
  if (!validateForm()) {
    return
  }

  saving.value = true

  try {
    // Mettre à jour user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        forname: formData.value.forname,
        family_name: formData.value.family_name,
        email: formData.value.email,
        classe: formData.value.class
      })
      .eq('user_id', props.studentId)

    if (profileError) throw profileError

    // Mettre à jour ou insérer dans StudentsPhysio
    const physioData = {
      class: formData.value.class,
      sae: formData.value.sae ? 'true' : 'false',
      cas_particulier: formData.value.cas_particulier || ''
    }

    // Essayer d'abord un UPDATE simple
    const { data: updateResult, error: updateError } = await supabase
      .from('StudentsPhysio')
      .update(physioData)
      .eq('user_id', props.studentId)
      .select()

    // Si aucune ligne retournée, faire un INSERT
    if (!updateError && (!updateResult || updateResult.length === 0)) {
      const { error: insertError } = await supabase
        .from('StudentsPhysio')
        .insert({ user_id: props.studentId, ...physioData })
      
      if (insertError) throw insertError
    } else if (updateError) {
      throw updateError
    }

    // Émettre l'événement AVANT de fermer le dialog
    emit('student-updated')
    
    // Attendre que le parent traite l'événement (nextTick + délai)
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Étudiant mis à jour avec succès',
      life: 3000
    })

    closeDialog()

  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder les modifications',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  formData.value = {
    user_id: null,
    forname: '',
    family_name: '',
    email: '',
    class: '',
    sae: false,
    cas_particulier: ''
  }
  errors.value = {}
}

const closeDialog = () => {
  emit('update:visible', false)
  resetForm()
}
</script>

<style scoped>
.p-fluid .field {
  margin-bottom: 1rem;
}

.p-invalid {
  border-color: #e24c4c;
}

.p-error {
  color: #e24c4c;
  font-size: 0.875rem;
}
</style>
