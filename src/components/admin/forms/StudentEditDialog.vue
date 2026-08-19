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
        <FormStatus status="loading" title="Chargement du profil" message="Les informations de l’étudiant sont en cours de chargement." />
      </div>

      <ErrorState
        v-else-if="loadError"
        title="Impossible de charger cet étudiant"
        :description="loadError"
        @retry="loadStudentData"
      />

      <!-- Form -->
      <form v-else id="student-edit-form" class="app-form" @submit.prevent="saveStudent">
        <FormSection title="Identité et inscription" description="Modifiez les informations principales de l’étudiant." icon="pi pi-user-edit">
        <div class="grid">
        <FormField for-id="forname" label="Prénom" required :error="errors.forname" v-slot="field">
          <InputText 
            v-bind="field.controlAttrs"
            v-model="formData.forname" 
            required 
            :class="{ 'p-invalid': errors.forname }"
          />
        </FormField>

        <!-- Nom -->
        <FormField for-id="family_name" label="Nom" required :error="errors.family_name" v-slot="field">
          <InputText 
            v-bind="field.controlAttrs"
            v-model="formData.family_name" 
            required
            :class="{ 'p-invalid': errors.family_name }"
          />
        </FormField>

        <!-- Email -->
        <FormField for-id="email" label="Email" required hint="Utilisez l’adresse institutionnelle de l’étudiant." :error="errors.email" v-slot="field">
          <InputText 
            v-bind="field.controlAttrs"
            v-model="formData.email" 
            type="email"
            autocomplete="email"
            required
            :class="{ 'p-invalid': errors.email }"
          />
        </FormField>

        <!-- Classe -->
        <FormField for-id="class" label="Classe" required :error="errors.class" v-slot="field">
          <Dropdown
            v-bind="field.controlAttrs"
            v-model="formData.class"
            :options="classOptions"
            placeholder="Sélectionner une classe"
            :class="{ 'p-invalid': errors.class }"
          />
        </FormField>

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
        <FormField for-id="cas_particulier" label="Détails du cas particulier" optional-label="Facultatif" v-slot="field">
          <InputText 
            v-bind="field.controlAttrs"
            v-model="formData.cas_particulier"
            placeholder="Ajoutez uniquement les informations utiles"
          />
        </FormField>
        </div>
        </FormSection>
        <FormStatus :status="submitStatus" :message="submitMessage" />
      </form>
    </div>

    <template #footer>
      <Button label="Annuler" icon="pi pi-times" text @click="closeDialog" :disabled="saving" />
      <Button 
        label="Enregistrer" 
        icon="pi pi-check" 
        type="submit"
        form="student-edit-form"
        :loading="saving"
        :disabled="loading || !!loadError"
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
import Toast from 'primevue/toast'
import { supabase } from '@/supabase'
import FormSection from '@/components/common/forms/FormSection.vue'
import FormField from '@/components/common/forms/FormField.vue'
import FormStatus from '@/components/common/forms/FormStatus.vue'
import ErrorState from '@/components/common/states/ErrorState.vue'

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
const loadError = ref(null)
const saving = ref(false)
const errors = ref({})
const submitStatus = ref('idle')
const submitMessage = ref('')

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
  loadError.value = null
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

    if (physioError && physioError.code !== 'PGRST116') throw physioError

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
    loadError.value = error?.message || 'Vérifiez votre connexion puis réessayez.'
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

  if (!formData.value.class) {
    errors.value.class = 'La classe est requise'
    isValid = false
  }

  return isValid
}

const saveStudent = async () => {
  if (!validateForm()) {
    submitStatus.value = 'error'
    submitMessage.value = 'Corrigez les champs signalés avant d’enregistrer.'
    await nextTick()
    document.querySelector('#student-edit-form [aria-invalid="true"]')?.focus()
    return
  }

  saving.value = true
  submitStatus.value = 'loading'
  submitMessage.value = 'Enregistrement des modifications…'

  try {
    // Mettre à jour user_profiles
    const profilePayload = {
      forname: formData.value.forname,
      family_name: formData.value.family_name,
      email: formData.value.email,
      classe: formData.value.class
    }
    const { data: persistedProfile, error: profileError } = await supabase
      .from('user_profiles')
      .update(profilePayload)
      .eq('user_id', props.studentId)
      .select('user_id, forname, family_name, email, classe')
      .maybeSingle()

    if (profileError) throw profileError
    if (!persistedProfile || Object.entries(profilePayload).some(([key, value]) => persistedProfile[key] !== value)) {
      throw new Error('Le profil n’a pas été enregistré intégralement.')
    }

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
    let persistedPhysio = updateResult?.[0] || null
    if (!updateError && !persistedPhysio) {
      const { data: insertedPhysio, error: insertError } = await supabase
        .from('StudentsPhysio')
        .insert({ user_id: props.studentId, ...physioData })
        .select('user_id, class, sae, cas_particulier')
        .single()
      
      if (insertError) throw insertError
      persistedPhysio = insertedPhysio
    } else if (updateError) {
      throw updateError
    }

    const physioMatches = persistedPhysio
      && persistedPhysio.class === physioData.class
      && String(persistedPhysio.sae) === String(physioData.sae)
      && (persistedPhysio.cas_particulier || '') === physioData.cas_particulier
    if (!physioMatches) {
      throw new Error('Les données de formation pratique n’ont pas été enregistrées intégralement.')
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

    submitStatus.value = 'success'
    submitMessage.value = 'Le profil étudiant a bien été mis à jour.'

    closeDialog()

  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder les modifications',
      life: 3000
    })
    submitStatus.value = 'error'
    submitMessage.value = 'La sauvegarde a échoué. Vérifiez votre connexion puis réessayez.'
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
  submitStatus.value = 'idle'
  submitMessage.value = ''
  loadError.value = null
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
